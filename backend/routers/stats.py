import aiomysql
from fastapi import APIRouter, Depends

from ..database import get_db
from ..models import StatsResponse

router = APIRouter()


@router.get("", response_model=StatsResponse)
async def get_stats(conn: aiomysql.Connection = Depends(get_db)):
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT COUNT(*) AS cnt FROM terms")
        total_terms = (await cur.fetchone())["cnt"]

        await cur.execute("SELECT COUNT(*) AS cnt FROM categories")
        total_categories = (await cur.fetchone())["cnt"]

        await cur.execute("SELECT COUNT(*) AS cnt FROM tags")
        total_tags = (await cur.fetchone())["cnt"]

        await cur.execute("""
            SELECT c.id, c.name, c.slug, COUNT(tc.term_id) AS term_count
            FROM categories c
            LEFT JOIN term_categories tc ON c.id = tc.category_id
            GROUP BY c.id, c.name, c.slug
            ORDER BY c.name
        """)
        per_category = await cur.fetchall()

        await cur.execute(
            "SELECT id, name, slug FROM terms ORDER BY created_at DESC LIMIT 5"
        )
        recent_terms = await cur.fetchall()

        await cur.execute(
            "SELECT id, name, slug FROM terms WHERE is_favorite = 1 ORDER BY name LIMIT 5"
        )
        top_favorites = await cur.fetchall()

    return {
        "total_terms": total_terms,
        "total_categories": total_categories,
        "total_tags": total_tags,
        "per_category": per_category,
        "recent_terms": recent_terms,
        "top_favorites": top_favorites,
    }
