import aiomysql
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from slugify import slugify

from ..content_loader_articles import ArticleFile, _extract_summary, _reading_time
from ..content_writer_articles import delete_article as delete_article_file, write_article
from ..database import PROJECT_ROOT, get_db
from ..models import (
    ArticleCreate, ArticleUpdate, ArticleResponse, ArticleDetailResponse,
    ArticleListResponse, ArticleSummary, ArticleImportItem,
)


CONTENT_ROOT = PROJECT_ROOT / "content"


# ── Private helpers ───────────────────────────────────────────────────────────

async def _get_article_categories(conn: aiomysql.Connection, article_id: int) -> list:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("""
            SELECT c.id, c.name, c.slug, 0 AS term_count
            FROM categories c
            JOIN article_categories ac ON c.id = ac.category_id
            WHERE ac.article_id = %s
        """, (article_id,))
        return await cur.fetchall()


async def _get_article_tags(conn: aiomysql.Connection, article_id: int) -> list:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("""
            SELECT t.id, t.name, 0 AS term_count
            FROM tags t
            JOIN article_tags at_ ON t.id = at_.tag_id
            WHERE at_.article_id = %s
        """, (article_id,))
        return await cur.fetchall()


async def _get_article_related_terms(conn: aiomysql.Connection, article_id: int) -> list:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("""
            SELECT t.id, t.name, t.slug
            FROM terms t
            JOIN article_related_terms art ON t.id = art.term_id
            WHERE art.article_id = %s
        """, (article_id,))
        return await cur.fetchall()


async def _get_article_related_articles(conn: aiomysql.Connection, article_id: int) -> list:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("""
            SELECT a.id, a.title, a.slug
            FROM articles a
            JOIN article_related_articles ara
              ON (ara.article_a = a.id OR ara.article_b = a.id)
            WHERE (ara.article_a = %s OR ara.article_b = %s) AND a.id != %s
        """, (article_id, article_id, article_id))
        return await cur.fetchall()


async def _enrich_article(conn: aiomysql.Connection, row: dict) -> dict:
    row["is_published"] = bool(row["is_published"])
    row["categories"] = await _get_article_categories(conn, row["id"])
    row["tags"] = await _get_article_tags(conn, row["id"])
    return row


async def _get_article_row(conn: aiomysql.Connection, slug: str) -> dict:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            "SELECT * FROM articles WHERE slug = %s", (slug,)
        )
        row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Article '{slug}' not found")
    return row


async def _upsert_tags(conn: aiomysql.Connection, tag_names: List[str]) -> List[int]:
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


async def _sync_article_associations(
    conn: aiomysql.Connection,
    article_id: int,
    category_ids: List[int],
    tag_names: List[str],
    related_term_ids: List[int],
    related_article_ids: List[int],
) -> None:
    async with conn.cursor() as cur:
        await cur.execute("DELETE FROM article_categories WHERE article_id = %s", (article_id,))
        await cur.execute("DELETE FROM article_tags WHERE article_id = %s", (article_id,))
        await cur.execute("DELETE FROM article_related_terms WHERE article_id = %s", (article_id,))
        await cur.execute(
            "DELETE FROM article_related_articles WHERE article_a = %s OR article_b = %s",
            (article_id, article_id),
        )

        for cat_id in category_ids:
            await cur.execute(
                "INSERT IGNORE INTO article_categories (article_id, category_id) VALUES (%s, %s)",
                (article_id, cat_id),
            )

        tag_ids = await _upsert_tags(conn, tag_names)
        for tag_id in tag_ids:
            await cur.execute(
                "INSERT IGNORE INTO article_tags (article_id, tag_id) VALUES (%s, %s)",
                (article_id, tag_id),
            )

        for term_id in related_term_ids:
            await cur.execute(
                "INSERT IGNORE INTO article_related_terms (article_id, term_id) VALUES (%s, %s)",
                (article_id, term_id),
            )

        for other_id in related_article_ids:
            if other_id == article_id:
                continue
            a, b = (article_id, other_id) if article_id < other_id else (other_id, article_id)
            await cur.execute(
                "INSERT IGNORE INTO article_related_articles (article_a, article_b) VALUES (%s, %s)",
                (a, b),
            )


async def _article_to_file(conn: aiomysql.Connection, row: dict) -> ArticleFile:
    cats = await _get_article_categories(conn, row["id"])
    tags = await _get_article_tags(conn, row["id"])
    related_terms = await _get_article_related_terms(conn, row["id"])
    related_articles = await _get_article_related_articles(conn, row["id"])
    return ArticleFile(
        slug=row["slug"],
        title=row["title"],
        subtitle=row.get("subtitle"),
        body=(row.get("body") or "").strip() + "\n",
        is_published=bool(row.get("is_published", True)),
        categories=sorted(c["slug"] for c in cats),
        tags=sorted(t["name"] for t in tags),
        related_terms=sorted(t["slug"] for t in related_terms),
        related_articles=sorted(a["slug"] for a in related_articles),
    )


async def _persist_to_disk(conn: aiomysql.Connection, slug: str) -> None:
    row = await _get_article_row(conn, slug)
    article_file = await _article_to_file(conn, row)
    write_article(article_file, CONTENT_ROOT)


router = APIRouter()


# ── Read endpoints ─────────────────────────────────────────────────────────────

@router.get("", response_model=ArticleListResponse)
async def list_articles(
    q: Optional[str] = None,
    category: Optional[str] = None,
    tag: Optional[str] = None,
    published_only: bool = False,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    conn: aiomysql.Connection = Depends(get_db),
):
    joins, conditions, params = "", [], []

    if category:
        joins += " JOIN article_categories ac ON a.id = ac.article_id JOIN categories c ON ac.category_id = c.id"
        conditions.append("c.slug = %s")
        params.append(category)
    if tag:
        joins += " JOIN article_tags at_ ON a.id = at_.article_id JOIN tags tg ON at_.tag_id = tg.id"
        conditions.append("tg.name = %s")
        params.append(tag)
    if q:
        conditions.append("(a.title LIKE %s OR a.body LIKE %s)")
        params.extend([f"%{q}%", f"%{q}%"])
    if published_only:
        conditions.append("a.is_published = 1")

    where = (" WHERE " + " AND ".join(conditions)) if conditions else ""

    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            f"SELECT COUNT(DISTINCT a.id) AS total FROM articles a{joins}{where}", params
        )
        total = (await cur.fetchone())["total"]

        await cur.execute(
            f"SELECT DISTINCT a.* FROM articles a{joins}{where} ORDER BY a.created_at DESC LIMIT %s OFFSET %s",
            params + [limit, offset],
        )
        rows = await cur.fetchall()

    articles = [await _enrich_article(conn, row) for row in rows]
    return {"articles": articles, "total": total, "limit": limit, "offset": offset}


@router.get("/export")
async def export_articles(conn: aiomysql.Connection = Depends(get_db)):
    """Export all articles as a JSON array."""
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT * FROM articles ORDER BY title")
        rows = await cur.fetchall()

    result = []
    for row in rows:
        row = await _enrich_article(conn, row)
        row["related_terms"] = await _get_article_related_terms(conn, row["id"])
        row["related_articles"] = await _get_article_related_articles(conn, row["id"])
        result.append(row)
    return result


@router.get("/summaries", response_model=List[ArticleSummary])
async def list_article_summaries(conn: aiomysql.Connection = Depends(get_db)):
    """Lightweight article records for relationship selectors."""
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT id, title, slug FROM articles ORDER BY title")
        return await cur.fetchall()


@router.post("/import", status_code=201)
async def import_articles(
    items: List[ArticleImportItem], conn: aiomysql.Connection = Depends(get_db)
):
    """Bulk import articles. Skips duplicates by title."""
    imported, skipped = 0, 0
    for item in items:
        slug = slugify(item.title)
        summary = _extract_summary(item.body)
        reading_time = _reading_time(item.body)
        async with conn.cursor(aiomysql.DictCursor) as cur:
            try:
                await cur.execute(
                    """INSERT INTO articles (title, slug, subtitle, body, summary, reading_time_minutes)
                       VALUES (%s, %s, %s, %s, %s, %s)""",
                    (item.title, slug, item.subtitle, item.body, summary, reading_time),
                )
                article_id = cur.lastrowid
            except aiomysql.IntegrityError:
                skipped += 1
                continue
        await _sync_article_associations(
            conn, article_id, item.category_ids, item.tag_names,
            item.related_term_ids, item.related_article_ids,
        )
        imported += 1
    return {"imported": imported, "skipped": skipped}


@router.get("/{slug}", response_model=ArticleDetailResponse)
async def get_article(slug: str, conn: aiomysql.Connection = Depends(get_db)):
    row = await _get_article_row(conn, slug)
    row = await _enrich_article(conn, row)
    row["related_terms"] = await _get_article_related_terms(conn, row["id"])
    row["related_articles"] = await _get_article_related_articles(conn, row["id"])
    return row


# ── Write endpoints ───────────────────────────────────────────────────────────

@router.post("", response_model=ArticleDetailResponse, status_code=201)
async def create_article(body: ArticleCreate, conn: aiomysql.Connection = Depends(get_db)):
    slug = slugify(body.title)
    summary = _extract_summary(body.body)
    reading_time = _reading_time(body.body)
    async with conn.cursor(aiomysql.DictCursor) as cur:
        try:
            await cur.execute(
                """INSERT INTO articles (title, slug, subtitle, body, summary, reading_time_minutes)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (body.title, slug, body.subtitle, body.body, summary, reading_time),
            )
            article_id = cur.lastrowid
        except aiomysql.IntegrityError:
            raise HTTPException(status_code=409, detail=f"Article '{body.title}' already exists")

    await _sync_article_associations(
        conn, article_id, body.category_ids, body.tag_names,
        body.related_term_ids, body.related_article_ids,
    )
    try:
        await _persist_to_disk(conn, slug)
    except Exception:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM articles WHERE id = %s", (article_id,))
        raise
    row = await _get_article_row(conn, slug)
    row = await _enrich_article(conn, row)
    row["related_terms"] = await _get_article_related_terms(conn, row["id"])
    row["related_articles"] = await _get_article_related_articles(conn, row["id"])
    return row


@router.put("/{slug}", response_model=ArticleDetailResponse)
async def update_article(
    slug: str, body: ArticleUpdate, conn: aiomysql.Connection = Depends(get_db)
):
    row = await _get_article_row(conn, slug)
    new_slug = slugify(body.title)
    summary = _extract_summary(body.body)
    reading_time = _reading_time(body.body)
    async with conn.cursor() as cur:
        try:
            await cur.execute(
                """UPDATE articles
                   SET title=%s, slug=%s, subtitle=%s, body=%s,
                       summary=%s, reading_time_minutes=%s, updated_at=NOW()
                   WHERE id=%s""",
                (body.title, new_slug, body.subtitle, body.body, summary, reading_time, row["id"]),
            )
        except aiomysql.IntegrityError:
            raise HTTPException(status_code=409, detail=f"Title '{body.title}' is already taken")

    await _sync_article_associations(
        conn, row["id"], body.category_ids, body.tag_names,
        body.related_term_ids, body.related_article_ids,
    )
    await _persist_to_disk(conn, new_slug)
    if new_slug != slug:
        delete_article_file(slug, CONTENT_ROOT)
    updated = await _get_article_row(conn, new_slug)
    updated = await _enrich_article(conn, updated)
    updated["related_terms"] = await _get_article_related_terms(conn, updated["id"])
    updated["related_articles"] = await _get_article_related_articles(conn, updated["id"])
    return updated


@router.delete("/{slug}", status_code=204)
async def delete_article(slug: str, conn: aiomysql.Connection = Depends(get_db)):
    row = await _get_article_row(conn, slug)
    async with conn.cursor() as cur:
        await cur.execute("DELETE FROM articles WHERE id = %s", (row["id"],))
    delete_article_file(slug, CONTENT_ROOT)


@router.patch("/{slug}/publish", response_model=ArticleResponse)
async def toggle_publish(slug: str, conn: aiomysql.Connection = Depends(get_db)):
    row = await _get_article_row(conn, slug)
    new_val = 0 if row["is_published"] else 1
    async with conn.cursor() as cur:
        await cur.execute(
            "UPDATE articles SET is_published = %s WHERE id = %s", (new_val, row["id"])
        )
    await _persist_to_disk(conn, slug)
    updated = await _get_article_row(conn, slug)
    return await _enrich_article(conn, updated)


# ── Bulk import ───────────────────────────────────────────────────────────────

@router.post("/import", status_code=201)
async def import_articles(
    items: List[ArticleImportItem], conn: aiomysql.Connection = Depends(get_db)
):
    """Bulk import articles. Skips duplicates by title."""
    imported, skipped = 0, 0
    for item in items:
        slug = slugify(item.title)
        summary = _extract_summary(item.body)
        reading_time = _reading_time(item.body)
        async with conn.cursor(aiomysql.DictCursor) as cur:
            try:
                await cur.execute(
                    """INSERT INTO articles (title, slug, subtitle, body, summary, reading_time_minutes)
                       VALUES (%s, %s, %s, %s, %s, %s)""",
                    (item.title, slug, item.subtitle, item.body, summary, reading_time),
                )
                article_id = cur.lastrowid
            except aiomysql.IntegrityError:
                skipped += 1
                continue
        await _sync_article_associations(
            conn, article_id, item.category_ids, item.tag_names,
            item.related_term_ids, item.related_article_ids,
        )
        imported += 1
    return {"imported": imported, "skipped": skipped}
