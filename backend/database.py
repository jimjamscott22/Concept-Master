import os
import asyncio
from pathlib import Path

import aiomysql
import sqlparse
from dotenv import load_dotenv
from fastapi import Request

load_dotenv(Path(__file__).parent / ".env")

DB_HOST = os.getenv("DB_HOST", "192.168.1.25")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "concept_user")
DB_PASS = os.getenv("DB_PASS", "Yar22")
DB_NAME = os.getenv("DB_NAME", "concept_master")


async def create_pool() -> aiomysql.Pool:
    return await aiomysql.create_pool(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASS,
        db=DB_NAME,
        charset="utf8mb4",
        autocommit=True,
        minsize=2,
        maxsize=10,
    )


async def get_db(request: Request):
    """FastAPI dependency — yields an acquired aiomysql connection."""
    async with request.app.state.pool.acquire() as conn:
        yield conn


async def _exec_sql_file(conn: aiomysql.Connection, filepath: Path) -> None:
    sql = filepath.read_text(encoding="utf-8")
    statements = sqlparse.split(sql)
    async with conn.cursor() as cur:
        for stmt in statements:
            clean = sqlparse.format(stmt, strip_comments=True).strip()
            if clean:
                await cur.execute(clean)


async def init_db() -> None:
    """Create schema and seed data. Safe to re-run (IF NOT EXISTS guards)."""
    pool = await create_pool()
    async with pool.acquire() as conn:
        schema = Path(__file__).parent / "schema.sql"
        seed = Path(__file__).parent / "seed.sql"
        await _exec_sql_file(conn, schema)
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT COUNT(*) AS cnt FROM categories")
            row = await cur.fetchone()
        if row["cnt"] == 0:
            await _exec_sql_file(conn, seed)
    pool.close()
    await pool.wait_closed()


if __name__ == "__main__":
    asyncio.run(init_db())
