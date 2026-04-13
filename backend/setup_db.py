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


def _validate_mysql_safe_token(value: str, env_name: str) -> str:
    if not re.fullmatch(r"[A-Za-z0-9_]+", value):
        raise ValueError(
            f"{env_name} may only contain letters, numbers, and underscores."
        )
    return value


async def provision(root_password: str, host: str = "127.0.0.1", port: int = 3306) -> None:
    app_user = _validate_mysql_safe_token(os.getenv("DB_USER", "concept_user"), "DB_USER")
    app_password = os.getenv("DB_PASS")
    db_name = _validate_mysql_safe_token(
        os.getenv("DB_NAME", "concept_master"), "DB_NAME"
    )
    if not app_password:
        raise RuntimeError(
            "Missing DB_PASS. Set DB_PASS in the repository root .env before running setup_db.py."
        )

    conn = await aiomysql.connect(
        host=host, port=port, user="root", password=root_password
    )
    async with conn.cursor() as cur:
        # MySQL identifiers cannot be parameterized with placeholders, so we
        # restrict db_name to [A-Za-z0-9_] before interpolating it below.
        await cur.execute(
            f"CREATE DATABASE IF NOT EXISTS `{db_name}` "
            "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        )
        await cur.execute(
            "CREATE USER IF NOT EXISTS %s@'%%' IDENTIFIED BY %s",
            (app_user, app_password),
        )
        await cur.execute(
            f"GRANT ALL PRIVILEGES ON `{db_name}`.* TO %s@'%%'",
            (app_user,),
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
        db_name=db_name,
    )
    print("✓ Schema created and data seeded")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--root-password", required=True)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=3306)
    args = parser.parse_args()
    asyncio.run(provision(args.root_password, args.host, args.port))
