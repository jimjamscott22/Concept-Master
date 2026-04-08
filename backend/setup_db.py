"""
One-shot provisioning script.
Run as: python backend/setup_db.py --root-password <password>

Creates database concept_master, user concept_user, grants privileges,
then initializes schema and seeds data.
"""
import asyncio
import argparse
import aiomysql
from pathlib import Path


async def provision(root_password: str, host: str = "192.168.1.25", port: int = 3306) -> None:
    conn = await aiomysql.connect(
        host=host, port=port, user="root", password=root_password
    )
    async with conn.cursor() as cur:
        await cur.execute(
            "CREATE DATABASE IF NOT EXISTS concept_master "
            "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        )
        await cur.execute(
            "CREATE USER IF NOT EXISTS 'concept_user'@'%' IDENTIFIED BY 'Yar22'"
        )
        await cur.execute(
            "GRANT ALL PRIVILEGES ON concept_master.* TO 'concept_user'@'%'"
        )
        await cur.execute("FLUSH PRIVILEGES")
    conn.close()
    print("✓ Database and user created")

    # Now init schema + seed via database.py
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from backend.database import init_db
    await init_db()
    print("✓ Schema created and data seeded")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--root-password", required=True)
    parser.add_argument("--host", default="192.168.1.25")
    parser.add_argument("--port", type=int, default=3306)
    args = parser.parse_args()
    asyncio.run(provision(args.root_password, args.host, args.port))
