import asyncio
import aiomysql
from fastapi import APIRouter
from starlette.requests import Request

from ..models import StatsResponse

router = APIRouter()


@router.get("", response_model=StatsResponse)
async def get_stats(request: Request):
    pool: aiomysql.Pool = request.app.state.pool

    async def q(sql: str) -> list:
        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute(sql)
                return await cur.fetchall()

    counts_rows, per_category, recent_terms, top_favorites = await asyncio.gather(
        q("""SELECT
               (SELECT COUNT(*) FROM terms)      AS total_terms,
               (SELECT COUNT(*) FROM categories) AS total_categories,
               (SELECT COUNT(*) FROM tags)        AS total_tags"""),
        q("""SELECT c.id, c.name, c.slug, COUNT(tc.term_id) AS term_count
             FROM categories c
             LEFT JOIN term_categories tc ON c.id = tc.category_id
             GROUP BY c.id, c.name, c.slug
             ORDER BY c.name"""),
        q("SELECT id, name, slug FROM terms ORDER BY created_at DESC LIMIT 5"),
        q("SELECT id, name, slug FROM terms WHERE is_favorite = 1 ORDER BY name LIMIT 5"),
    )

    counts = counts_rows[0]
    return {
        "total_terms": counts["total_terms"],
        "total_categories": counts["total_categories"],
        "total_tags": counts["total_tags"],
        "per_category": per_category,
        "recent_terms": recent_terms,
        "top_favorites": top_favorites,
    }
