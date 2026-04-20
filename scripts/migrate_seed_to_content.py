"""One-shot migration: dump the current live glossary into ``content/``.

Reads the MariaDB database (using credentials from the repo ``.env``) and
emits:

- ``content/categories.yml`` — canonical category list
- ``content/terms/<slug>.md`` — one file per term, with frontmatter
  (categories, tags, related, code_lang, is_favorite) and a Markdown body
  containing the definition and a fenced code block for ``example_code``.

Run from the repo root::

    uv run python scripts/migrate_seed_to_content.py
"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import aiomysql

from backend.content_loader import TermFile
from backend.content_writer import write_categories, write_term
from backend.database import PROJECT_ROOT, create_pool


CONTENT_ROOT = PROJECT_ROOT / "content"


async def _fetch_all(conn: aiomysql.Connection):
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT id, name, slug FROM categories ORDER BY name")
        categories = await cur.fetchall()

        await cur.execute(
            "SELECT id, name, slug, definition, example_code, code_lang, is_favorite FROM terms ORDER BY slug"
        )
        terms = await cur.fetchall()

        await cur.execute(
            """SELECT tc.term_id, c.slug
                 FROM term_categories tc
                 JOIN categories c ON c.id = tc.category_id"""
        )
        term_cat = await cur.fetchall()

        await cur.execute(
            """SELECT tt.term_id, t.name
                 FROM term_tags tt
                 JOIN tags t ON t.id = tt.tag_id"""
        )
        term_tag = await cur.fetchall()

        await cur.execute(
            """SELECT rt.term_a, rt.term_b, ta.slug AS slug_a, tb.slug AS slug_b
                 FROM related_terms rt
                 JOIN terms ta ON ta.id = rt.term_a
                 JOIN terms tb ON tb.id = rt.term_b"""
        )
        related = await cur.fetchall()

    return categories, terms, term_cat, term_tag, related


async def main() -> None:
    pool = await create_pool()
    try:
        async with pool.acquire() as conn:
            categories, terms, term_cat, term_tag, related = await _fetch_all(conn)
    finally:
        pool.close()
        await pool.wait_closed()

    CONTENT_ROOT.mkdir(exist_ok=True)
    (CONTENT_ROOT / "terms").mkdir(exist_ok=True)

    write_categories(
        [(c["name"], c["slug"]) for c in categories],
        CONTENT_ROOT / "categories.yml",
    )
    print(f"Wrote {CONTENT_ROOT / 'categories.yml'} ({len(categories)} categories)")

    cats_by_term: dict[int, list[str]] = {}
    for row in term_cat:
        cats_by_term.setdefault(row["term_id"], []).append(row["slug"])

    tags_by_term: dict[int, list[str]] = {}
    for row in term_tag:
        tags_by_term.setdefault(row["term_id"], []).append(row["name"])

    related_by_term: dict[int, list[str]] = {}
    for row in related:
        related_by_term.setdefault(row["term_a"], []).append(row["slug_b"])
        related_by_term.setdefault(row["term_b"], []).append(row["slug_a"])

    count = 0
    for t in terms:
        term_file = TermFile(
            slug=t["slug"],
            name=t["name"],
            definition=(t["definition"] or "").strip(),
            example_code=t["example_code"],
            code_lang=t["code_lang"],
            is_favorite=bool(t["is_favorite"]),
            categories=sorted(cats_by_term.get(t["id"], [])),
            tags=sorted(tags_by_term.get(t["id"], [])),
            related=sorted(set(related_by_term.get(t["id"], []))),
        )
        write_term(term_file, CONTENT_ROOT)
        count += 1

    print(f"Wrote {count} term files into {CONTENT_ROOT / 'terms'}")


if __name__ == "__main__":
    asyncio.run(main())
