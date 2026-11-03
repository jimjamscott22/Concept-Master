"""Transactional YAML-to-MariaDB curriculum reconciliation."""
from pathlib import Path
import json

import aiomysql

from .graph import DEFAULT_GRAPH_PATH, load_graph


async def sync_concepts(pool: aiomysql.Pool, path: Path = DEFAULT_GRAPH_PATH) -> int:
    """Validate before acquiring a connection; retain removed concepts as inactive.

    Returns the active concept count. History and lesson snapshots are untouched.
    The caller owns the pool; no provider calls or schema initialization occur.
    """
    concepts = load_graph(path)
    rows = [
        (
            concept.id, concept.title, concept.domain.value,
            json.dumps(concept.tags),
            concept.difficulty,
            json.dumps(concept.prerequisites),
            json.dumps(concept.related),
            concept.angle,
        )
        for concept in concepts
    ]
    async with pool.acquire() as conn:
        await conn.begin()
        try:
            async with conn.cursor() as cur:
                # Lock existing rows consistently before upserting the new snapshot.
                await cur.execute("UPDATE concepts SET active = 0, synced_at = UTC_TIMESTAMP(6)")
                await cur.executemany(
                    "INSERT INTO concepts "
                    "(id, title, domain, tags, difficulty, prerequisites, related, angle, active, synced_at) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 1, UTC_TIMESTAMP(6)) "
                    "ON DUPLICATE KEY UPDATE title = VALUES(title), domain = VALUES(domain), "
                    "tags = VALUES(tags), difficulty = VALUES(difficulty), "
                    "prerequisites = VALUES(prerequisites), related = VALUES(related), "
                    "angle = VALUES(angle), active = 1, synced_at = VALUES(synced_at)",
                    rows,
                )
            await conn.commit()
        except BaseException:
            await conn.rollback()
            raise
    return len(concepts)
