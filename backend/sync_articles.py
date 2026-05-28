"""Reconcile the articles database against the content/articles/ directory.

Run directly::

    uv run python -m backend.sync_articles
    uv run python -m backend.sync_articles --prune
"""
from __future__ import annotations

import argparse
import asyncio
from dataclasses import dataclass, field
from pathlib import Path
from typing import List

import aiomysql

from .content_loader_articles import ArticleFile, _extract_summary, _reading_time, load_all_articles
from .database import PROJECT_ROOT, create_pool
from .sync_content import _upsert_categories, _upsert_tag


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
        return "Article sync complete:\n" + "\n".join(lines)


async def _upsert_article(
    conn: aiomysql.Connection,
    article: ArticleFile,
) -> tuple[int, str]:
    summary = _extract_summary(article.body)
    reading_time = _reading_time(article.body)
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT * FROM articles WHERE slug = %s", (article.slug,))
        existing = await cur.fetchone()

        if existing is None:
            await cur.execute(
                """INSERT INTO articles
                   (title, slug, subtitle, body, summary, reading_time_minutes, is_published)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (
                    article.title,
                    article.slug,
                    article.subtitle,
                    article.body,
                    summary,
                    reading_time,
                    1 if article.is_published else 0,
                ),
            )
            return cur.lastrowid, "inserted"

        fields = {
            "title": article.title,
            "subtitle": article.subtitle,
            "body": article.body,
            "summary": summary,
            "reading_time_minutes": reading_time,
            "is_published": 1 if article.is_published else 0,
        }
        dirty = any(existing.get(k) != v for k, v in fields.items())
        if dirty:
            await cur.execute(
                """UPDATE articles
                      SET title=%s, subtitle=%s, body=%s, summary=%s,
                          reading_time_minutes=%s, is_published=%s, updated_at=NOW()
                    WHERE id=%s""",
                (
                    article.title,
                    article.subtitle,
                    article.body,
                    summary,
                    reading_time,
                    1 if article.is_published else 0,
                    existing["id"],
                ),
            )
            return existing["id"], "updated"
        return existing["id"], "unchanged"


async def _replace_article_joins(
    conn: aiomysql.Connection,
    article: ArticleFile,
    article_id: int,
    category_ids: dict[str, int],
    slug_to_term_id: dict[str, int],
    slug_to_article_id: dict[str, int],
    report: SyncReport,
) -> None:
    async with conn.cursor() as cur:
        await cur.execute("DELETE FROM article_categories WHERE article_id = %s", (article_id,))
        await cur.execute("DELETE FROM article_tags WHERE article_id = %s", (article_id,))
        await cur.execute("DELETE FROM article_related_terms WHERE article_id = %s", (article_id,))
        await cur.execute(
            "DELETE FROM article_related_articles WHERE article_a = %s OR article_b = %s",
            (article_id, article_id),
        )

        for slug in article.categories:
            cat_id = category_ids.get(slug)
            if cat_id is None:
                report.warnings.append(
                    f"article '{article.slug}': unknown category '{slug}' (not in categories.yml)"
                )
                continue
            await cur.execute(
                "INSERT IGNORE INTO article_categories (article_id, category_id) VALUES (%s, %s)",
                (article_id, cat_id),
            )

    for tag_name in article.tags:
        tag_id = await _upsert_tag(conn, tag_name)
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT IGNORE INTO article_tags (article_id, tag_id) VALUES (%s, %s)",
                (article_id, tag_id),
            )

    async with conn.cursor() as cur:
        for term_slug in article.related_terms:
            term_id = slug_to_term_id.get(term_slug)
            if term_id is None:
                report.warnings.append(
                    f"article '{article.slug}': related term '{term_slug}' not found; skipped"
                )
                continue
            await cur.execute(
                "INSERT IGNORE INTO article_related_terms (article_id, term_id) VALUES (%s, %s)",
                (article_id, term_id),
            )

        for other_slug in article.related_articles:
            other_id = slug_to_article_id.get(other_slug)
            if other_id is None:
                report.warnings.append(
                    f"article '{article.slug}': related article '{other_slug}' not found; skipped"
                )
                continue
            if other_id == article_id:
                continue
            a, b = (article_id, other_id) if article_id < other_id else (other_id, article_id)
            await cur.execute(
                "INSERT IGNORE INTO article_related_articles (article_a, article_b) VALUES (%s, %s)",
                (a, b),
            )


async def sync_articles(
    pool: aiomysql.Pool,
    content_root: Path = DEFAULT_CONTENT_ROOT,
    prune: bool = False,
) -> SyncReport:
    """Full reconciliation of content/articles/ -> database."""
    from .content_loader import load_categories

    report = SyncReport()
    categories = load_categories(content_root / "categories.yml")
    articles = load_all_articles(content_root)

    async with pool.acquire() as conn:
        category_ids = await _upsert_categories(conn, categories)

        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT id, slug FROM terms")
            slug_to_term_id = {r["slug"]: r["id"] for r in await cur.fetchall()}

        slug_to_article_id: dict[str, int] = {}
        for article in articles:
            aid, action = await _upsert_article(conn, article)
            slug_to_article_id[article.slug] = aid
            if action == "inserted":
                report.inserted += 1
            elif action == "updated":
                report.updated += 1
            else:
                report.unchanged += 1

        for article in articles:
            aid = slug_to_article_id[article.slug]
            await _replace_article_joins(
                conn, article, aid, category_ids, slug_to_term_id, slug_to_article_id, report
            )

        if prune:
            file_slugs = {a.slug for a in articles}
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute("SELECT id, slug FROM articles")
                rows = await cur.fetchall()
                for row in rows:
                    if row["slug"] not in file_slugs:
                        await cur.execute("DELETE FROM articles WHERE id = %s", (row["id"],))
                        report.deleted += 1

    return report


async def _main(prune: bool, content_root: Path) -> None:
    pool = await create_pool()
    try:
        report = await sync_articles(pool, content_root=content_root, prune=prune)
    finally:
        pool.close()
        await pool.wait_closed()
    print(report.format())


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync content/articles/ -> database")
    parser.add_argument("--prune", action="store_true", help="Delete DB articles whose .md file is missing")
    parser.add_argument("--content-root", default=str(DEFAULT_CONTENT_ROOT))
    args = parser.parse_args()
    asyncio.run(_main(args.prune, Path(args.content_root)))


if __name__ == "__main__":
    main()
