"""Opt-in MariaDB checks using newly created disposable databases only.

Set DAILY_TEST_DB_HOST, DAILY_TEST_DB_USER, DAILY_TEST_DB_PASS, and optionally
DAILY_TEST_DB_PORT. The account must be allowed to create/drop databases. Never
fall back to the application's DB_* settings or existing database name.
"""
import asyncio
from contextlib import asynccontextmanager
import json
import os
from pathlib import Path
from uuid import uuid4

import aiomysql
import pytest
import yaml

from backend.database import _exec_sql_file
from daily_concept.graph import GraphValidationError
from daily_concept.sync import sync_concepts


SCHEMA = Path(__file__).resolve().parents[1] / "backend/schema.sql"


@pytest.fixture
def isolated_server():
    keys = ("DAILY_TEST_DB_HOST", "DAILY_TEST_DB_USER", "DAILY_TEST_DB_PASS")
    if not all(os.getenv(key) for key in keys):
        pytest.skip("Isolated MariaDB requires explicit DAILY_TEST_DB_HOST/USER/PASS")
    return {
        "host": os.environ[keys[0]], "user": os.environ[keys[1]],
        "password": os.environ[keys[2]],
        "port": int(os.getenv("DAILY_TEST_DB_PORT", "3306")),
        "charset": "utf8mb4", "autocommit": True, "connect_timeout": 5,
    }


@asynccontextmanager
async def _database(server):
    # A fresh random name, CREATE without IF NOT EXISTS, and a created flag ensure
    # teardown never drops an existing database, even if creation fails.
    name = "daily_concept_test_" + uuid4().hex
    admin = await aiomysql.connect(**server)
    created = False
    pool = None
    try:
        async with admin.cursor() as cur:
            await cur.execute(f"CREATE DATABASE `{name}` CHARACTER SET utf8mb4")
            created = True
        pool = await aiomysql.create_pool(**server, db=name, minsize=1, maxsize=2)
        yield pool
    finally:
        if pool is not None:
            pool.close()
            await pool.wait_closed()
        try:
            if created:
                async with admin.cursor() as cur:
                    await cur.execute(f"DROP DATABASE `{name}`")
        finally:
            admin.close()


async def _rows(pool, sql, args=()):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(sql, args)
            return await cur.fetchall()


def _graph(path, include_old=True, title="New title"):
    concepts = [{"id": "new", "title": title, "domain": "python", "difficulty": 1}]
    if include_old:
        concepts.append({"id": "old", "title": "Old title", "domain": "web", "difficulty": 2})
    path.write_text(yaml.safe_dump(concepts), encoding="utf-8")


@pytest.mark.parametrize("existing", [False, True], ids=["fresh", "existing-schema"])
def test_schema_and_sync_on_disposable_database(isolated_server, tmp_path, existing):
    async def run():
        async with _database(isolated_server) as pool:
            async with pool.acquire() as conn:
                if existing:
                    baseline = tmp_path / "baseline.sql"
                    legacy, separator, _ = SCHEMA.read_text(encoding="utf-8").partition(
                        "-- Daily Concept is independent"
                    )
                    assert separator, "Daily schema boundary is missing"
                    baseline.write_text(legacy, encoding="utf-8")
                    await _exec_sql_file(conn, baseline)
                    async with conn.cursor() as cur:
                        await cur.execute("INSERT INTO terms (name, slug, definition) VALUES ('Existing', 'existing', 'Keep this')")
                        await cur.execute("INSERT INTO articles (title, slug, body, summary) VALUES ('Existing', 'existing', 'Keep body', 'Keep summary')")
                        await cur.execute("INSERT INTO term_reviews (term_id, reps) SELECT id, 3 FROM terms WHERE slug = 'existing'")
                await _exec_sql_file(conn, SCHEMA)
                await _exec_sql_file(conn, SCHEMA)

            streak = await _rows(pool, "SELECT * FROM streaks")
            assert len(streak) == 1 and streak[0]["current"] == 0
            if existing:
                assert (await _rows(pool, "SELECT definition FROM terms WHERE slug = 'existing'"))[0]["definition"] == "Keep this"
                assert (await _rows(pool, "SELECT body FROM articles WHERE slug = 'existing'"))[0]["body"] == "Keep body"
                assert (await _rows(pool, "SELECT reps FROM term_reviews"))[0]["reps"] == 3

            path = tmp_path / "concepts.yaml"
            _graph(path)
            assert await sync_concepts(pool, path) == 2
            assert await sync_concepts(pool, path) == 2
            assert len(await _rows(pool, "SELECT id FROM concepts")) == 2
            assert json.loads((await _rows(pool, "SELECT tags FROM concepts LIMIT 1"))[0]["tags"]) == []

            async with pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("INSERT INTO daily_lessons (concept_id, scheduled_date, title, domain) VALUES ('old', '2026-11-02', 'Snapshot', 'web')")
                    lesson_id = cur.lastrowid
                    for sql in (
                        "INSERT INTO daily_lessons (concept_id, scheduled_date, title, domain) VALUES ('old', '2026-11-03', 'Duplicate concept', 'web')",
                        "INSERT INTO daily_lessons (concept_id, scheduled_date, title, domain) VALUES ('new', '2026-11-02', 'Duplicate date', 'python')",
                    ):
                        with pytest.raises(aiomysql.IntegrityError):
                            await cur.execute(sql)
                    await cur.execute("INSERT INTO quiz_responses (lesson_id, item_index, selected_index, correct) VALUES (%s, 0, 1, 1)", (lesson_id,))
                    with pytest.raises(aiomysql.IntegrityError):
                        await cur.execute("INSERT INTO quiz_responses (lesson_id, item_index, selected_index, correct) VALUES (%s, 0, 2, 0)", (lesson_id,))
                    for _ in range(2):
                        await cur.execute("INSERT INTO quiz_responses (lesson_id, item_index, selected_index, correct, source) VALUES (%s, 0, 1, 1, 'review')", (lesson_id,))

            _graph(path, include_old=False, title="Edited title")
            assert await sync_concepts(pool, path) == 1
            concepts = await _rows(pool, "SELECT id, title, active FROM concepts ORDER BY id")
            assert concepts == [
                {"id": "new", "title": "Edited title", "active": 1},
                {"id": "old", "title": "Old title", "active": 0},
            ]
            assert (await _rows(pool, "SELECT title FROM daily_lessons"))[0]["title"] == "Snapshot"
            assert len(await _rows(pool, "SELECT id FROM quiz_responses")) == 3

            path.write_text("[]", encoding="utf-8")
            with pytest.raises(GraphValidationError):
                await sync_concepts(pool, path)
            assert await _rows(pool, "SELECT id, title, active FROM concepts ORDER BY id") == concepts

    asyncio.run(run())


def test_generation_claim_recovery_on_disposable_database(isolated_server):
    from datetime import date
    from zoneinfo import ZoneInfo

    from daily_concept.graph import load_graph
    from daily_concept.generate import generate_dates
    from daily_concept.providers import MockProvider
    from daily_concept.store import MariaDBLessonStore

    async def run():
        async with _database(isolated_server) as pool:
            async with pool.acquire() as conn:
                await _exec_sql_file(conn, SCHEMA)
            await sync_concepts(pool)
            graph, day, tz = load_graph(), date(2026, 11, 2), ZoneInfo("America/New_York")
            store = MariaDBLessonStore(pool)
            first = await store.claim(day, graph, tz, False, "mock-integration")
            assert first.outcome == "claimed"
            assert (await store.claim(day, graph, tz, True, "mock-integration")).outcome == "busy"
            async with pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("UPDATE daily_lessons SET claim_expires_at = UTC_TIMESTAMP(6) - INTERVAL 1 SECOND WHERE scheduled_date = %s", (day,))
            second = await store.claim(day, graph, tz, False, "mock-integration")
            assert second.claim.concept.id == first.claim.concept.id
            assert not await store.finish(first.claim, "{}", None, 1)
            assert await store.finish(second.claim, None, "invalid", 3)
            assert await generate_dates(store, MockProvider("invalid-then-valid"), graph, [day], tz, "mock-integration") == 0
            rows = await _rows(pool, "SELECT * FROM daily_lessons")
            assert rows[0]["status"] == "ready" and rows[0]["attempts"] == 2
            assert rows[0]["concept_id"] == first.claim.concept.id
            assert json.loads(rows[0]["payload"])["concept_id"] == first.claim.concept.id
            assert rows[0]["claim_token"] is None
            assert (await store.claim(day, graph, tz, False, "mock-integration")).outcome == "ready"

            async with pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("UPDATE daily_lessons SET status = 'completed', completed_at = UTC_TIMESTAMP(6) WHERE scheduled_date = %s", (day,))
            with pytest.raises(ValueError, match="completed"):
                await store.claim(day, graph, tz, True, "mock-integration")

    asyncio.run(run())
