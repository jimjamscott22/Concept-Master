import aiomysql
from fastapi import APIRouter, Depends
from typing import List

from ..database import get_db
from ..models import CategoryResponse

router = APIRouter()


@router.get("", response_model=List[CategoryResponse])
async def list_categories(conn: aiomysql.Connection = Depends(get_db)):
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("""
            SELECT c.id, c.name, c.slug, COUNT(tc.term_id) AS term_count
            FROM categories c
            LEFT JOIN term_categories tc ON c.id = tc.category_id
            GROUP BY c.id, c.name, c.slug
            ORDER BY c.name
        """)
        return await cur.fetchall()
