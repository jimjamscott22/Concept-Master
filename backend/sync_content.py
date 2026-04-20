"""Reconcile the glossary database against the ``content/`` directory.

Run directly::

    uv run python -m backend.sync_content
    uv run python -m backend.sync_content --prune

The database becomes a rebuildable search index; the ``content/`` directory
is the source of truth.
"""
from __future__ import annotations

import argparse
import asyncio
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, List, Optional

import aiomysql
from slugify import slugify

from .content_loader import Category, TermFile, load_all_terms, load_categories
from .database import PROJECT_ROOT, create_pool


DEFAULT_CONTENT_ROOT = PROJECT_ROOT / "content"


@dataclass
class SyncReport:
    inserted: int = 0
    updated: int = 0
    unchanged: int = 0
    deleted: int = 0
    warnings: List[str] = field(default_factory=list)

    def format(self) -> str:
        lines = [
            f"  inserted:  {self.inserted}",
            f"  updated:   {self.updated}",
            f"  unchanged: {self.unchanged}",
            f"  deleted:   {self.deleted}",
            f"  warnings:  {len(self.warnings)}",
        ]
        for w in self.warnings:
            lines.append(f"    - {w}")
        return "Sync complete:\n" + "\n".join(lines)


async def _upsert_categories(conn: aiomysql.Connection, categories: Iterable[Category]) -> dict[str, int]:
    """Ensure every category exists; return a ``slug -> id`` map."""
    slug_to_id: dict[str, int] = {}
    async with conn.cursor(aiomysql.DictCursor) as cur:
        for cat in categories:
            await cur.execute(
                "INSERT INTO categories (name, slug) VALUES (%s, %s) "
                "ON DUPLICATE KEY UPDATE name = VALUES(name)",
                (cat.name, cat.slug),
            )
            await cur.execute("SELECT id FROM categories WHERE slug = %s", (cat.slug,))
            row = await cur.fetchone()
            if row:
                slug_to_id[cat.slug] = row["id"]
    return slug_to_id


async def _upsert_tag(conn: aiomysql.Connection, name: str) -> int:
    name = name.strip().lower()
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("INSERT IGNORE INTO tags (name) VALUES (%s)", (name,))
        await cur.execute("SELECT id FROM tags WHERE name = %s", (name,))
        row = await cur.fetchone()
    return row["id"]


async def _upsert_term(
    conn: aiomysql.Connection,
    term: TermFile,
) -> tuple[int, str]:
    """Insert or update the ``terms`` row. Return ``(id, 'inserted'|'updated'|'unchanged')``."""
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT * FROM terms WHERE slug = %s", (term.slug,))
        existing = await cur.fetchone()

        if existing is None:
            await cur.execute(
                """INSERT INTO terms (name, slug, definition, example_code, code_lang, is_favorite)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (
                    term.name,
                    term.slug,
                    term.definition,
                    term.example_code,
                    term.code_lang,
                    1 if term.is_favorite else 0,
                ),
            )
            return cur.lastrowid, "inserted"

        fields = {
            "name": term.name,
            "definition": term.definition,
            "example_code": term.example_code,
            "code_lang": term.code_lang,
            "is_favorite": 1 if term.is_favorite else 0,
        }
        dirty = any(existing.get(k) != v for k, v in fields.items())
        if dirty:
            await cur.execute(
                """UPDATE terms
                      SET name=%s, definition=%s, example_code=%s, code_lang=%s,
                          is_favorite=%s, updated_at=NOW()
                    WHERE id=%s""",
                (
                    term.name,
                    term.definition,
                    term.example_code,
                    term.code_lang,
                    1 if term.is_favorite else 0,
                    existing["id"],
                ),
            )
            return existing["id"], "updated"
        return existing["id"], "unchanged"


async def _replace_joins(
    conn: aiomysql.Connection,
    term: TermFile,
    term_id: int,
    category_ids: dict[str, int],
    slug_to_term_id: dict[str, int],
    report: SyncReport,
) -> None:
    async with conn.cursor() as cur:
        await cur.execute("DELETE FROM term_categories WHERE term_id = %s", (term_id,))
        await cur.execute("DELETE FROM term_tags WHERE term_id = %s", (term_id,))
        await cur.execute(
            "DELETE FROM related_terms WHERE term_a = %s OR term_b = %s",
            (term_id, term_id),
        )

        for slug in term.categories:
            cat_id = category_ids.get(slug)
            if cat_id is None:
                report.warnings.append(
                    f"term '{term.slug}': unknown category '{slug}' (not in categories.yml)"
                )
                continue
            await cur.execute(
                "INSERT IGNORE INTO term_categories (term_id, category_id) VALUES (%s, %s)",
                (term_id, cat_id),
            )

    for tag_name in term.tags:
        tag_id = await _upsert_tag(conn, tag_name)
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT IGNORE INTO term_tags (term_id, tag_id) VALUES (%s, %s)",
                (term_id, tag_id),
            )

    async with conn.cursor() as cur:
        for other_slug in term.related:
            other_id = slug_to_term_id.get(other_slug)
            if other_id is None:
                report.warnings.append(
                    f"term '{term.slug}': related slug '{other_slug}' not found; skipped"
                )
                continue
            if other_id == term_id:
                continue
            a, b = (term_id, other_id) if term_id < other_id else (other_id, term_id)
            await cur.execute(
                "INSERT IGNORE INTO related_terms (term_a, term_b) VALUES (%s, %s)",
                (a, b),
            )


async def sync_content(
    pool: aiomysql.Pool,
    content_root: Path = DEFAULT_CONTENT_ROOT,
    prune: bool = False,
) -> SyncReport:
    """Full reconciliation of ``content/`` -> database."""
    report = SyncReport()
    categories = load_categories(content_root / "categories.yml")
    terms = load_all_terms(content_root)

    async with pool.acquire() as conn:
        category_ids = await _upsert_categories(conn, categories)

        slug_to_term_id: dict[str, int] = {}
        for term in terms:
            tid, action = await _upsert_term(conn, term)
            slug_to_term_id[term.slug] = tid
            if action == "inserted":
                report.inserted += 1
            elif action == "updated":
                report.updated += 1
            else:
                report.unchanged += 1

        for term in terms:
            tid = slug_to_term_id[term.slug]
            await _replace_joins(conn, term, tid, category_ids, slug_to_term_id, report)

        if prune:
            file_slugs = {t.slug for t in terms}
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute("SELECT id, slug FROM terms")
                rows = await cur.fetchall()
                for row in rows:
                    if row["slug"] not in file_slugs:
                        await cur.execute("DELETE FROM terms WHERE id = %s", (row["id"],))
                        report.deleted += 1

    return report


async def _main(prune: bool, content_root: Path) -> None:
    pool = await create_pool()
    try:
        report = await sync_content(pool, content_root=content_root, prune=prune)
    finally:
        pool.close()
        await pool.wait_closed()
    print(report.format())


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync content/ -> database")
    parser.add_argument("--prune", action="store_true", help="Delete DB terms whose .md file is missing")
    parser.add_argument("--content-root", default=str(DEFAULT_CONTENT_ROOT))
    args = parser.parse_args()
    asyncio.run(_main(args.prune, Path(args.content_root)))


if __name__ == "__main__":
    main()
