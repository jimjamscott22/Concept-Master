"""
One-shot provisioning script.
Run as: python backend/setup_db.py --root-password <password>

Creates database concept_master, user concept_user, grants privileges,
then initializes schema and seeds data.
"""
import asyncio
import argparse
import os
import re
import aiomysql
from pathlib import Path
from dotenv import load_dotenv


PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")


def _validate_mysql_username(username: str) -> str:
    if not re.fullmatch(r"[A-Za-z0-9_]+", username):
        raise ValueError(
            "DB_USER may only contain letters, numbers, and underscores "
            "(for safe setup script provisioning)."
        )
    return username


async def provision(root_password: str, host: str = "127.0.0.1", port: int = 3306) -> None:
    app_user = _validate_mysql_username(os.getenv("DB_USER", "concept_user"))
    app_password = os.getenv("DB_PASS")
    if not app_password:
        raise RuntimeError(
            "Missing DB_PASS. Set DB_PASS in the repository root .env before running setup_db.py."
        )

    conn = await aiomysql.connect(
        host=host, port=port, user="root", password=root_password
    )
    async with conn.cursor() as cur:
        await cur.execute(
            "CREATE DATABASE IF NOT EXISTS concept_master "
            "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        )
        await cur.execute(
            f"CREATE USER IF NOT EXISTS '{app_user}'@'%' IDENTIFIED BY %s",
            (app_password,),
        )
        await cur.execute(
            f"GRANT ALL PRIVILEGES ON concept_master.* TO '{app_user}'@'%'"
        )
        await cur.execute("FLUSH PRIVILEGES")
    conn.close()
    print("✓ Database and user created")

    # Now init schema + seed via database.py
    import sys

    sys.path.insert(0, str(Path(__file__).parent.parent))
    from backend.database import init_db
    await init_db(
        host=host,
        port=port,
        user=app_user,
        password=app_password,
        db_name=os.getenv("DB_NAME", "concept_master"),
    )
    print("✓ Schema created and data seeded")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--root-password", required=True)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=3306)
    args = parser.parse_args()
    asyncio.run(provision(args.root_password, args.host, args.port))
