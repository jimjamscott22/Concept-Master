import aiomysql
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from slugify import slugify

from ..database import get_db
from ..models import (
    TermCreate, TermUpdate, TermResponse, TermDetailResponse,
    TermListResponse, TermSummary, ImportItem,
)

router = APIRouter()


# ── Private helpers ──────────────────────────────────────────────────────────

async def _get_term_categories(conn: aiomysql.Connection, term_id: int) -> list:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("""
            SELECT c.id, c.name, c.slug, 0 AS term_count
            FROM categories c
            JOIN term_categories tc ON c.id = tc.category_id
            WHERE tc.term_id = %s
        """, (term_id,))
        return await cur.fetchall()


async def _get_term_tags(conn: aiomysql.Connection, term_id: int) -> list:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("""
            SELECT t.id, t.name, 0 AS term_count
            FROM tags t
            JOIN term_tags tt ON t.id = tt.tag_id
            WHERE tt.term_id = %s
        """, (term_id,))
        return await cur.fetchall()


async def _get_related_terms(conn: aiomysql.Connection, term_id: int) -> list:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("""
            SELECT t.id, t.name, t.slug
            FROM terms t
            JOIN related_terms rt ON (rt.term_a = t.id OR rt.term_b = t.id)
            WHERE (rt.term_a = %s OR rt.term_b = %s) AND t.id != %s
        """, (term_id, term_id, term_id))
        return await cur.fetchall()


async def _enrich_term(conn: aiomysql.Connection, row: dict) -> dict:
    """Add categories and tags to a term dict."""
    row["is_favorite"] = bool(row["is_favorite"])
    row["categories"] = await _get_term_categories(conn, row["id"])
    row["tags"] = await _get_term_tags(conn, row["id"])
    return row


async def _get_term_row(conn: aiomysql.Connection, slug: str) -> dict:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            "SELECT * FROM terms WHERE slug = %s", (slug,)
        )
        row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Term '{slug}' not found")
    return row


async def _upsert_tags(conn: aiomysql.Connection, tag_names: List[str]) -> List[int]:
    """Insert tags that don't exist, return their ids."""
    ids = []
    async with conn.cursor(aiomysql.DictCursor) as cur:
        for name in tag_names:
            name = name.strip().lower()
            if not name:
                continue
            await cur.execute(
                "INSERT IGNORE INTO tags (name) VALUES (%s)", (name,)
            )
            await cur.execute("SELECT id FROM tags WHERE name = %s", (name,))
            row = await cur.fetchone()
            if row:
                ids.append(row["id"])
    return ids


async def _sync_associations(
    conn: aiomysql.Connection,
    term_id: int,
    category_ids: List[int],
    tag_names: List[str],
    related_term_ids: List[int],
) -> None:
    """Replace all category, tag, and related-term associations."""
    async with conn.cursor() as cur:
        await cur.execute("DELETE FROM term_categories WHERE term_id = %s", (term_id,))
        await cur.execute("DELETE FROM term_tags WHERE term_id = %s", (term_id,))
        # related_terms is bidirectional — remove both directions
        await cur.execute(
            "DELETE FROM related_terms WHERE term_a = %s OR term_b = %s",
            (term_id, term_id),
        )

        for cat_id in category_ids:
            await cur.execute(
                "INSERT IGNORE INTO term_categories (term_id, category_id) VALUES (%s, %s)",
                (term_id, cat_id),
            )

        tag_ids = await _upsert_tags(conn, tag_names)
        for tag_id in tag_ids:
            await cur.execute(
                "INSERT IGNORE INTO term_tags (term_id, tag_id) VALUES (%s, %s)",
                (term_id, tag_id),
            )

        for other_id in related_term_ids:
            if other_id == term_id:
                continue
            a, b = (term_id, other_id) if term_id < other_id else (other_id, term_id)
            await cur.execute(
                "INSERT IGNORE INTO related_terms (term_a, term_b) VALUES (%s, %s)",
                (a, b),
            )


# ── Read endpoints ────────────────────────────────────────────────────────────

@router.get("", response_model=TermListResponse)
async def list_terms(
    q: Optional[str] = None,
    category: Optional[str] = None,
    tag: Optional[str] = None,
    favorites_only: bool = False,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    conn: aiomysql.Connection = Depends(get_db),
):
    joins, conditions, params = "", [], []

    if category:
        joins += " JOIN term_categories tc ON t.id = tc.term_id JOIN categories c ON tc.category_id = c.id"
        conditions.append("c.slug = %s")
        params.append(category)
    if tag:
        joins += " JOIN term_tags tt ON t.id = tt.term_id JOIN tags tg ON tt.tag_id = tg.id"
        conditions.append("tg.name = %s")
        params.append(tag)
    if q:
        conditions.append("(t.name LIKE %s OR t.definition LIKE %s)")
        params.extend([f"%{q}%", f"%{q}%"])
    if favorites_only:
        conditions.append("t.is_favorite = 1")

    where = (" WHERE " + " AND ".join(conditions)) if conditions else ""

    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            f"SELECT COUNT(DISTINCT t.id) AS total FROM terms t{joins}{where}", params
        )
        total = (await cur.fetchone())["total"]

        await cur.execute(
            f"SELECT DISTINCT t.* FROM terms t{joins}{where} ORDER BY t.name LIMIT %s OFFSET %s",
            params + [limit, offset],
        )
        rows = await cur.fetchall()

    terms = [await _enrich_term(conn, row) for row in rows]
    return {"terms": terms, "total": total, "limit": limit, "offset": offset}


@router.get("/export")
async def export_terms(conn: aiomysql.Connection = Depends(get_db)):
    """Export all terms as a JSON array (for bulk import)."""
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT * FROM terms ORDER BY name")
        rows = await cur.fetchall()

    result = []
    for row in rows:
        row = await _enrich_term(conn, row)
        row["related_terms"] = await _get_related_terms(conn, row["id"])
        result.append(row)
    return result


@router.get("/{slug}", response_model=TermDetailResponse)
async def get_term(slug: str, conn: aiomysql.Connection = Depends(get_db)):
    row = await _get_term_row(conn, slug)
    row = await _enrich_term(conn, row)
    row["related_terms"] = await _get_related_terms(conn, row["id"])
    return row


# ── Write endpoints ───────────────────────────────────────────────────────────

@router.post("", response_model=TermDetailResponse, status_code=201)
async def create_term(body: TermCreate, conn: aiomysql.Connection = Depends(get_db)):
    slug = slugify(body.name)
    async with conn.cursor(aiomysql.DictCursor) as cur:
        try:
            await cur.execute(
                """INSERT INTO terms (name, slug, definition, example_code, code_lang)
                   VALUES (%s, %s, %s, %s, %s)""",
                (body.name, slug, body.definition, body.example_code, body.code_lang),
            )
            term_id = cur.lastrowid
        except aiomysql.IntegrityError:
            raise HTTPException(status_code=409, detail=f"Term '{body.name}' already exists")

    await _sync_associations(conn, term_id, body.category_ids, body.tag_names, body.related_term_ids)
    row = await _get_term_row(conn, slug)
    row = await _enrich_term(conn, row)
    row["related_terms"] = await _get_related_terms(conn, row["id"])
    return row


@router.put("/{slug}", response_model=TermDetailResponse)
async def update_term(
    slug: str, body: TermUpdate, conn: aiomysql.Connection = Depends(get_db)
):
    row = await _get_term_row(conn, slug)
    new_slug = slugify(body.name)
    async with conn.cursor() as cur:
        try:
            await cur.execute(
                """UPDATE terms
                   SET name=%s, slug=%s, definition=%s, example_code=%s, code_lang=%s,
                       updated_at=NOW()
                   WHERE id=%s""",
                (body.name, new_slug, body.definition, body.example_code, body.code_lang, row["id"]),
            )
        except aiomysql.IntegrityError:
            raise HTTPException(status_code=409, detail=f"Name '{body.name}' is already taken")

    await _sync_associations(conn, row["id"], body.category_ids, body.tag_names, body.related_term_ids)
    updated = await _get_term_row(conn, new_slug)
    updated = await _enrich_term(conn, updated)
    updated["related_terms"] = await _get_related_terms(conn, updated["id"])
    return updated


@router.delete("/{slug}", status_code=204)
async def delete_term(slug: str, conn: aiomysql.Connection = Depends(get_db)):
    row = await _get_term_row(conn, slug)
    async with conn.cursor() as cur:
        await cur.execute("DELETE FROM terms WHERE id = %s", (row["id"],))


@router.patch("/{slug}/favorite", response_model=TermResponse)
async def toggle_favorite(slug: str, conn: aiomysql.Connection = Depends(get_db)):
    row = await _get_term_row(conn, slug)
    new_val = 0 if row["is_favorite"] else 1
    async with conn.cursor() as cur:
        await cur.execute(
            "UPDATE terms SET is_favorite = %s WHERE id = %s", (new_val, row["id"])
        )
    updated = await _get_term_row(conn, slug)
    return await _enrich_term(conn, updated)


# ── Bulk import ───────────────────────────────────────────────────────────────

@router.post("/import", status_code=201)
async def import_terms(
    items: List[ImportItem], conn: aiomysql.Connection = Depends(get_db)
):
    """Bulk import terms. Skips duplicates by name."""
    imported, skipped = 0, 0
    for item in items:
        slug = slugify(item.name)
        async with conn.cursor(aiomysql.DictCursor) as cur:
            try:
                await cur.execute(
                    """INSERT INTO terms (name, slug, definition, example_code, code_lang)
                       VALUES (%s, %s, %s, %s, %s)""",
                    (item.name, slug, item.definition, item.example_code, item.code_lang),
                )
                term_id = cur.lastrowid
            except aiomysql.IntegrityError:
                skipped += 1
                continue
        await _sync_associations(conn, term_id, item.category_ids, item.tag_names, item.related_term_ids)
        imported += 1
    return {"imported": imported, "skipped": skipped}
