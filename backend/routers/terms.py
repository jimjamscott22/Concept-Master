import aiomysql
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from slugify import slugify

from ..content_loader import TermFile
from ..content_writer import delete_term as delete_term_file, write_term
from ..database import PROJECT_ROOT, get_db
from ..models import (
    TermCreate, TermUpdate, TermResponse, TermDetailResponse,
    TermListResponse, TermSummary, ImportItem,
)


CONTENT_ROOT = PROJECT_ROOT / "content"


async def _term_to_file(conn: aiomysql.Connection, row: dict) -> TermFile:
    """Build a :class:`TermFile` snapshot of a DB term for on-disk persistence."""
    cats = await _get_term_categories(conn, row["id"])
    tags = await _get_term_tags(conn, row["id"])
    related = await _get_related_terms(conn, row["id"])
    return TermFile(
        slug=row["slug"],
        name=row["name"],
        definition=(row.get("definition") or "").strip(),
        example_code=row.get("example_code"),
        code_lang=row.get("code_lang"),
        is_favorite=bool(row.get("is_favorite")),
        categories=sorted(c["slug"] for c in cats),
        tags=sorted(t["name"] for t in tags),
        related=sorted({r["slug"] for r in related}),
    )


async def _persist_to_disk(conn: aiomysql.Connection, slug: str) -> None:
    """Write the current DB state of a term back to its ``.md`` file."""
    row = await _get_term_row(conn, slug)
    term_file = await _term_to_file(conn, row)
    write_term(term_file, CONTENT_ROOT)

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


async def _batch_get_categories(conn: aiomysql.Connection, term_ids: list) -> defaultdict:
    """Return {term_id: [category_dict, ...]} for all given term IDs in 1 query."""
    result: defaultdict = defaultdict(list)
    if not term_ids:
        return result
    ph = ",".join(["%s"] * len(term_ids))
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(f"""
            SELECT tc.term_id, c.id, c.name, c.slug, 0 AS term_count
            FROM term_categories tc
            JOIN categories c ON tc.category_id = c.id
            WHERE tc.term_id IN ({ph})
        """, term_ids)
        for r in await cur.fetchall():
            tid = r["term_id"]
            result[tid].append({"id": r["id"], "name": r["name"], "slug": r["slug"], "term_count": 0})
    return result


async def _batch_get_tags(conn: aiomysql.Connection, term_ids: list) -> defaultdict:
    """Return {term_id: [tag_dict, ...]} for all given term IDs in 1 query."""
    result: defaultdict = defaultdict(list)
    if not term_ids:
        return result
    ph = ",".join(["%s"] * len(term_ids))
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(f"""
            SELECT tt.term_id, t.id, t.name, 0 AS term_count
            FROM term_tags tt
            JOIN tags t ON tt.tag_id = t.id
            WHERE tt.term_id IN ({ph})
        """, term_ids)
        for r in await cur.fetchall():
            tid = r["term_id"]
            result[tid].append({"id": r["id"], "name": r["name"], "term_count": 0})
    return result


async def _batch_get_related(conn: aiomysql.Connection, term_ids: list) -> defaultdict:
    """Return {term_id: [related_dict, ...]} for all given term IDs in 1 query."""
    result: defaultdict = defaultdict(list)
    if not term_ids:
        return result
    ph = ",".join(["%s"] * len(term_ids))
    async with conn.cursor(aiomysql.DictCursor) as cur:
        # related_terms stores (term_a, term_b) with term_a < term_b; cover both directions
        await cur.execute(f"""
            SELECT rt.term_a AS owner_id, t.id, t.name, t.slug
            FROM related_terms rt JOIN terms t ON t.id = rt.term_b
            WHERE rt.term_a IN ({ph})
            UNION ALL
            SELECT rt.term_b AS owner_id, t.id, t.name, t.slug
            FROM related_terms rt JOIN terms t ON t.id = rt.term_a
            WHERE rt.term_b IN ({ph})
        """, term_ids + term_ids)
        for r in await cur.fetchall():
            tid = r["owner_id"]
            result[tid].append({"id": r["id"], "name": r["name"], "slug": r["slug"]})
    return result


async def _upsert_tags(conn: aiomysql.Connection, tag_names: List[str]) -> List[int]:
    """Insert tags that don't exist, return their ids."""
    names = [n.strip().lower() for n in tag_names if n.strip()]
    if not names:
        return []
    async with conn.cursor(aiomysql.DictCursor) as cur:
        ph_vals = ",".join(["(%s)"] * len(names))
        await cur.execute(f"INSERT IGNORE INTO tags (name) VALUES {ph_vals}", names)
        ph_in = ",".join(["%s"] * len(names))
        await cur.execute(f"SELECT id FROM tags WHERE name IN ({ph_in})", names)
        return [r["id"] for r in await cur.fetchall()]


async def _sync_associations(
    conn: aiomysql.Connection,
    term_id: int,
    category_ids: List[int],
    tag_names: List[str],
    related_term_ids: List[int],
) -> None:
    """Replace all category, tag, and related-term associations."""
    # Resolve tags first (opens its own cursor) before entering the main cursor block.
    tag_ids = await _upsert_tags(conn, tag_names)

    async with conn.cursor() as cur:
        await cur.execute("DELETE FROM term_categories WHERE term_id = %s", (term_id,))
        await cur.execute("DELETE FROM term_tags WHERE term_id = %s", (term_id,))
        # related_terms is bidirectional — remove both directions
        await cur.execute(
            "DELETE FROM related_terms WHERE term_a = %s OR term_b = %s",
            (term_id, term_id),
        )

        if category_ids:
            ph = ",".join(["(%s,%s)"] * len(category_ids))
            vals = [v for cat_id in category_ids for v in (term_id, cat_id)]
            await cur.execute(
                f"INSERT IGNORE INTO term_categories (term_id, category_id) VALUES {ph}", vals
            )

        if tag_ids:
            ph = ",".join(["(%s,%s)"] * len(tag_ids))
            vals = [v for tag_id in tag_ids for v in (term_id, tag_id)]
            await cur.execute(
                f"INSERT IGNORE INTO term_tags (term_id, tag_id) VALUES {ph}", vals
            )

        pairs = [
            (term_id, other_id) if term_id < other_id else (other_id, term_id)
            for other_id in related_term_ids
            if other_id != term_id
        ]
        if pairs:
            ph = ",".join(["(%s,%s)"] * len(pairs))
            vals = [v for a, b in pairs for v in (a, b)]
            await cur.execute(
                f"INSERT IGNORE INTO related_terms (term_a, term_b) VALUES {ph}", vals
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

    ids = [r["id"] for r in rows]
    cats_by_term = await _batch_get_categories(conn, ids)
    tags_by_term = await _batch_get_tags(conn, ids)
    terms = []
    for row in rows:
        row["is_favorite"] = bool(row["is_favorite"])
        row["categories"] = cats_by_term[row["id"]]
        row["tags"] = tags_by_term[row["id"]]
        terms.append(row)
    return {"terms": terms, "total": total, "limit": limit, "offset": offset}


@router.get("/export")
async def export_terms(conn: aiomysql.Connection = Depends(get_db)):
    """Export all terms as a JSON array (for bulk import)."""
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT * FROM terms ORDER BY name")
        rows = await cur.fetchall()

    ids = [r["id"] for r in rows]
    cats_by_term = await _batch_get_categories(conn, ids)
    tags_by_term = await _batch_get_tags(conn, ids)
    related_by_term = await _batch_get_related(conn, ids)
    for row in rows:
        row["is_favorite"] = bool(row["is_favorite"])
        row["categories"] = cats_by_term[row["id"]]
        row["tags"] = tags_by_term[row["id"]]
        row["related_terms"] = related_by_term[row["id"]]
    return rows


@router.get("/summaries", response_model=List[TermSummary])
async def list_term_summaries(conn: aiomysql.Connection = Depends(get_db)):
    """Return lightweight term records for selectors and relationship editors."""
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT id, name, slug FROM terms ORDER BY name")
        return await cur.fetchall()


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
    try:
        await _persist_to_disk(conn, slug)
    except Exception:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM terms WHERE id = %s", (term_id,))
        raise
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
    await _persist_to_disk(conn, new_slug)
    if new_slug != slug:
        delete_term_file(slug, CONTENT_ROOT)
    updated = await _get_term_row(conn, new_slug)
    updated = await _enrich_term(conn, updated)
    updated["related_terms"] = await _get_related_terms(conn, updated["id"])
    return updated


@router.delete("/{slug}", status_code=204)
async def delete_term(slug: str, conn: aiomysql.Connection = Depends(get_db)):
    row = await _get_term_row(conn, slug)
    async with conn.cursor() as cur:
        await cur.execute("DELETE FROM terms WHERE id = %s", (row["id"],))
    delete_term_file(slug, CONTENT_ROOT)


@router.patch("/{slug}/favorite", response_model=TermResponse)
async def toggle_favorite(slug: str, conn: aiomysql.Connection = Depends(get_db)):
    row = await _get_term_row(conn, slug)
    new_val = 0 if row["is_favorite"] else 1
    async with conn.cursor() as cur:
        await cur.execute(
            "UPDATE terms SET is_favorite = %s WHERE id = %s", (new_val, row["id"])
        )
    await _persist_to_disk(conn, slug)
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
