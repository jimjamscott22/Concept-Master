import aiomysql
from fastapi import APIRouter, Depends
from typing import List

from ..database import get_db
from ..models import TagResponse

router = APIRouter()


@router.get("", response_model=List[TagResponse])
async def list_tags(conn: aiomysql.Connection = Depends(get_db)):
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("""
            SELECT t.id, t.name, COUNT(tt.term_id) AS term_count
            FROM tags t
            LEFT JOIN term_tags tt ON t.id = tt.tag_id
            GROUP BY t.id, t.name
            ORDER BY t.name
        """)
        return await cur.fetchall()
