"""Integration tests for ``sync_content`` against the test database.

These create temporary content directories with unique slugs (prefixed
``sync-test-``) to avoid colliding with existing seed data.
"""
from __future__ import annotations

import asyncio
from pathlib import Path

import pytest

from backend.database import _exec_sql_file, create_pool
from backend.sync_content import sync_content


TEST_SLUG_PREFIX = "sync-test-"


def _write_content(root: Path) -> None:
    root.mkdir(exist_ok=True)
    (root / "categories.yml").write_text(
        "- name: Sync Test Cat\n  slug: sync-test-cat\n",
        encoding="utf-8",
    )
    terms_dir = root / "terms"
    terms_dir.mkdir(exist_ok=True)
    (terms_dir / f"{TEST_SLUG_PREFIX}alpha.md").write_text(
        f"""---
name: Sync Test Alpha
categories: [sync-test-cat]
tags: [sync-test-tag]
related: [{TEST_SLUG_PREFIX}beta]
code_lang: python
---

Alpha definition.

```python
print("a")
```
""",
        encoding="utf-8",
    )
    (terms_dir / f"{TEST_SLUG_PREFIX}beta.md").write_text(
        f"""---
name: Sync Test Beta
categories: [sync-test-cat]
tags: [sync-test-tag]
related: [{TEST_SLUG_PREFIX}alpha, {TEST_SLUG_PREFIX}missing]
---

Beta definition.
""",
        encoding="utf-8",
    )


async def _cleanup(pool):
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "DELETE FROM terms WHERE slug LIKE %s",
                (f"{TEST_SLUG_PREFIX}%",),
            )
            await cur.execute(
                "DELETE FROM categories WHERE slug LIKE %s",
                (f"{TEST_SLUG_PREFIX}%",),
            )
            await cur.execute(
                "DELETE FROM tags WHERE name LIKE %s",
                (f"{TEST_SLUG_PREFIX}%",),
            )


def _run(coro):
    return asyncio.run(coro)


def test_sync_inserts(tmp_path):
    root = tmp_path / "content"
    _write_content(root)

    async def _go():
        pool = await create_pool()
        try:
            await _cleanup(pool)
            report = await sync_content(pool, content_root=root)
            return report
        finally:
            await _cleanup(pool)
            pool.close()
            await pool.wait_closed()

    report = _run(_go())
    assert report.inserted == 2
    assert any("missing" in w for w in report.warnings)


def test_sync_idempotent(tmp_path):
    root = tmp_path / "content"
    _write_content(root)

    async def _go():
        pool = await create_pool()
        try:
            await _cleanup(pool)
            await sync_content(pool, content_root=root)
            return await sync_content(pool, content_root=root)
        finally:
            await _cleanup(pool)
            pool.close()
            await pool.wait_closed()

    report = _run(_go())
    assert report.inserted == 0
    assert report.unchanged == 2


def test_sync_prune_removes_orphans(tmp_path):
    """``--prune`` deletes DB terms whose file no longer exists.

    This test is destructive: it clears the test DB and re-seeds it from
    ``backend/seed.sql`` on teardown so later tests see the expected data.
    """
    from pathlib import Path as _Path

    root = tmp_path / "content"
    _write_content(root)
    seed_sql = _Path(__file__).resolve().parents[1] / "backend" / "seed.sql"

    async def _go():
        import aiomysql

        pool = await create_pool()
        try:
            await _cleanup(pool)
            await sync_content(pool, content_root=root)
            (root / "terms" / f"{TEST_SLUG_PREFIX}beta.md").unlink()
            report = await sync_content(pool, content_root=root, prune=True)
            async with pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cur:
                    await cur.execute(
                        "SELECT slug FROM terms WHERE slug LIKE %s",
                        (f"{TEST_SLUG_PREFIX}%",),
                    )
                    remaining = {r["slug"] for r in await cur.fetchall()}
            return report, remaining
        finally:
            # Restore seed data so other test modules still see the expected rows.
            async with pool.acquire() as conn:
                await _exec_sql_file(conn, seed_sql)
            await _cleanup(pool)
            pool.close()
            await pool.wait_closed()

    report, remaining = _run(_go())
    assert f"{TEST_SLUG_PREFIX}beta" not in remaining
    assert f"{TEST_SLUG_PREFIX}alpha" in remaining
    assert report.deleted >= 1


def test_sync_updates_on_change(tmp_path):
    root = tmp_path / "content"
    _write_content(root)

    async def _go():
        pool = await create_pool()
        try:
            await _cleanup(pool)
            await sync_content(pool, content_root=root)
            alpha = root / "terms" / f"{TEST_SLUG_PREFIX}alpha.md"
            alpha.write_text(
                alpha.read_text().replace("Alpha definition.", "Alpha CHANGED."),
                encoding="utf-8",
            )
            return await sync_content(pool, content_root=root)
        finally:
            await _cleanup(pool)
            pool.close()
            await pool.wait_closed()

    report = _run(_go())
    assert report.updated == 1
    assert report.unchanged == 1
