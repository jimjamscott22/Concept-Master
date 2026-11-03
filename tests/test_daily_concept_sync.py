import asyncio
import json
from unittest.mock import AsyncMock, MagicMock

import pytest
import yaml

from backend import main as backend_main
from daily_concept import sync
from daily_concept.graph import GraphValidationError


def _pool():
    cursor = AsyncMock()
    conn = AsyncMock()
    conn.cursor = MagicMock()
    conn.cursor.return_value.__aenter__.return_value = cursor
    pool = MagicMock()
    pool.acquire.return_value.__aenter__.return_value = conn
    pool.wait_closed = AsyncMock()
    return pool, conn, cursor


def test_invalid_graph_never_acquires_database(tmp_path):
    path = tmp_path / "concepts.yaml"
    path.write_text("[]", encoding="utf-8")
    pool, _, _ = _pool()
    with pytest.raises(GraphValidationError):
        asyncio.run(sync.sync_concepts(pool, path))
    pool.acquire.assert_not_called()


def test_sync_serializes_json_and_commits_snapshot(tmp_path):
    path = tmp_path / "concepts.yaml"
    path.write_text(yaml.safe_dump([{
        "id": "test", "title": "Unicode: café", "domain": "python", "difficulty": 2,
        "tags": ["testing"], "angle": "Why?",
    }]), encoding="utf-8")
    pool, conn, cur = _pool()
    assert asyncio.run(sync.sync_concepts(pool, path)) == 1
    conn.begin.assert_awaited_once()
    conn.commit.assert_awaited_once()
    conn.rollback.assert_not_awaited()
    row = cur.executemany.call_args.args[1][0]
    assert row[:3] == ("test", "Unicode: café", "python")
    assert json.loads(row[3]) == ["testing"]
    assert row[4] == 2 and json.loads(row[5]) == [] and json.loads(row[6]) == []
    assert row[7] == "Why?"


def test_sync_failure_rolls_back():
    pool, conn, cur = _pool()
    cur.executemany.side_effect = RuntimeError("write failed")
    with pytest.raises(RuntimeError, match="write failed"):
        asyncio.run(sync.sync_concepts(pool))
    conn.rollback.assert_awaited_once()
    conn.commit.assert_not_awaited()


@pytest.mark.parametrize("enabled", [None, "false", "0", "true", "1", " YES "])
def test_startup_sync_is_independent_of_glossary_flag(monkeypatch, enabled):
    pool, _, _ = _pool()
    monkeypatch.setattr(backend_main, "create_pool", AsyncMock(return_value=pool))
    daily_sync = AsyncMock(return_value=30)
    monkeypatch.setattr(sync, "sync_concepts", daily_sync)
    monkeypatch.delenv("SYNC_ON_START", raising=False)
    if enabled is None:
        monkeypatch.delenv("DAILY_CONCEPT_ENABLED", raising=False)
    else:
        monkeypatch.setenv("DAILY_CONCEPT_ENABLED", enabled)

    async def run():
        async with backend_main.lifespan(backend_main.app):
            assert backend_main.app.state.pool is pool

    asyncio.run(run())
    assert daily_sync.await_count == (1 if enabled in {"true", "1", " YES "} else 0)
    pool.close.assert_called_once()
    pool.wait_closed.assert_awaited_once()


def test_startup_failure_closes_pool(monkeypatch):
    pool, _, _ = _pool()
    monkeypatch.setattr(backend_main, "create_pool", AsyncMock(return_value=pool))
    monkeypatch.setenv("DAILY_CONCEPT_ENABLED", "true")
    monkeypatch.delenv("SYNC_ON_START", raising=False)
    monkeypatch.setattr(sync, "sync_concepts", AsyncMock(side_effect=RuntimeError("bad graph")))

    async def run():
        async with backend_main.lifespan(backend_main.app):
            pytest.fail("Invalid graph should prevent startup")

    with pytest.raises(RuntimeError, match="bad graph"):
        asyncio.run(run())
    pool.close.assert_called_once()
    pool.wait_closed.assert_awaited_once()
