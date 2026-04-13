import os
import asyncio
from pathlib import Path
from typing import Optional

import aiomysql
import sqlparse
from dotenv import load_dotenv
from fastapi import Request

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")


def _require_value(name: str, value: Optional[str]) -> str:
    if not value:
        raise RuntimeError(
            f"Missing required environment variable: {name}. "
            "Set it in the repository root .env file."
        )
    return value


DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME", "concept_master")


async def create_pool(
    host: str = DB_HOST,
    port: int = DB_PORT,
    user: Optional[str] = DB_USER,
    password: Optional[str] = DB_PASS,
    db_name: str = DB_NAME,
) -> aiomysql.Pool:
    resolved_user = _require_value("DB_USER", user)
    resolved_password = _require_value("DB_PASS", password)
    return await aiomysql.create_pool(
        host=host,
        port=port,
        user=resolved_user,
        password=resolved_password,
        db=db_name,
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


async def init_db(
    host: str = DB_HOST,
    port: int = DB_PORT,
    user: Optional[str] = DB_USER,
    password: Optional[str] = DB_PASS,
    db_name: str = DB_NAME,
) -> None:
    """Create schema and seed data. Safe to re-run (IF NOT EXISTS guards)."""
    pool = await create_pool(
        host=host,
        port=port,
        user=user,
        password=password,
        db_name=db_name,
    )
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
