"""Spaced-repetition review endpoints.

Implements an SM-2 lite scheduler:
- Each term has a row in ``term_reviews`` once it's been reviewed at least once.
- A term with no row is treated as "new, due now".
- Ratings: ``again`` (lapse), ``hard``, ``good``, ``easy``.
- Intervals grow by ``ease`` (clamped to >= 1.3); ``again`` resets the term.

Daily session counts live in ``review_sessions`` and power the streak/heatmap.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import List

import aiomysql
from fastapi import APIRouter, Depends, HTTPException, Query

from ..database import get_db
from ..models import (
    HeatmapDay,
    ReviewCard,
    ReviewQueueResponse,
    ReviewRating,
    ReviewState,
    StreakResponse,
)

router = APIRouter()

DAILY_GOAL = 10
HEATMAP_DAYS = 84  # 12 weeks


# ── Scheduling math ──────────────────────────────────────────────────────────


def _next_state(
    rating: str,
    ease: float,
    interval_days: int,
    reps: int,
    lapses: int,
) -> tuple[float, int, int, int]:
    """Return (new_ease, new_interval_days, new_reps, new_lapses).

    SM-2-inspired but simplified:
      - again: reset reps to 0, interval to 0 (due in ~10 minutes -> next session),
               ease -= 0.20, lapses += 1
      - hard:  ease -= 0.15, interval *= 1.2 (min 1)
      - good:  ease unchanged, interval *= ease (or 1 / 6 for first two reps)
      - easy:  ease += 0.15, interval *= ease * 1.3
    Ease is clamped to [1.3, 3.0]. Interval clamped to [0, 365].
    """
    if rating == "again":
        return max(1.3, ease - 0.20), 0, 0, lapses + 1

    if rating == "hard":
        ease = max(1.3, ease - 0.15)
        new_interval = max(1, int(round(max(interval_days, 1) * 1.2)))
    elif rating == "good":
        if reps == 0:
            new_interval = 1
        elif reps == 1:
            new_interval = 6
        else:
            new_interval = max(1, int(round(max(interval_days, 1) * ease)))
    elif rating == "easy":
        ease = min(3.0, ease + 0.15)
        if reps == 0:
            new_interval = 4
        else:
            new_interval = max(1, int(round(max(interval_days, 1) * ease * 1.3)))
    else:  # pragma: no cover -- validated by Pydantic
        raise ValueError(f"unknown rating: {rating}")

    return ease, min(365, new_interval), reps + 1, lapses


# ── DB helpers ───────────────────────────────────────────────────────────────


async def _get_review_row(conn: aiomysql.Connection, term_id: int) -> dict | None:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            "SELECT * FROM term_reviews WHERE term_id = %s", (term_id,)
        )
        return await cur.fetchone()


async def _upsert_review(
    conn: aiomysql.Connection,
    term_id: int,
    ease: float,
    interval_days: int,
    reps: int,
    lapses: int,
    due_at: datetime,
    rating: str,
    now: datetime,
) -> None:
    async with conn.cursor() as cur:
        await cur.execute(
            """
            INSERT INTO term_reviews
                (term_id, ease, interval_days, reps, lapses, due_at,
                 last_rating, last_reviewed_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                ease=VALUES(ease),
                interval_days=VALUES(interval_days),
                reps=VALUES(reps),
                lapses=VALUES(lapses),
                due_at=VALUES(due_at),
                last_rating=VALUES(last_rating),
                last_reviewed_at=VALUES(last_reviewed_at)
            """,
            (term_id, ease, interval_days, reps, lapses, due_at, rating, now),
        )


async def _bump_session(
    conn: aiomysql.Connection, today: date, correct: bool
) -> None:
    async with conn.cursor() as cur:
        await cur.execute(
            """
            INSERT INTO review_sessions (session_date, reviewed_count, correct_count)
            VALUES (%s, 1, %s)
            ON DUPLICATE KEY UPDATE
                reviewed_count = reviewed_count + 1,
                correct_count  = correct_count  + VALUES(correct_count)
            """,
            (today, 1 if correct else 0),
        )


async def _get_term_categories(conn: aiomysql.Connection, term_id: int) -> list:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            """
            SELECT c.id, c.name, c.slug, 0 AS term_count
            FROM categories c
            JOIN term_categories tc ON c.id = tc.category_id
            WHERE tc.term_id = %s
            """,
            (term_id,),
        )
        return await cur.fetchall()


async def _get_term_tags(conn: aiomysql.Connection, term_id: int) -> list:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            """
            SELECT t.id, t.name, 0 AS term_count
            FROM tags t
            JOIN term_tags tt ON t.id = tt.tag_id
            WHERE tt.term_id = %s
            """,
            (term_id,),
        )
        return await cur.fetchall()


async def _get_related_terms(conn: aiomysql.Connection, term_id: int) -> list:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            """
            SELECT t.id, t.name, t.slug
            FROM terms t
            JOIN related_terms rt ON (rt.term_a = t.id OR rt.term_b = t.id)
            WHERE (rt.term_a = %s OR rt.term_b = %s) AND t.id != %s
            """,
            (term_id, term_id, term_id),
        )
        return await cur.fetchall()


async def _to_review_card(conn: aiomysql.Connection, row: dict) -> dict:
    """Merge a term row + its review state + associations into a ReviewCard dict."""
    row["is_favorite"] = bool(row.get("is_favorite"))
    row["categories"] = await _get_term_categories(conn, row["id"])
    row["tags"] = await _get_term_tags(conn, row["id"])
    row["related_terms"] = await _get_related_terms(conn, row["id"])
    # Normalize review fields (term may have no review row yet)
    row.setdefault("ease", 2.5)
    row.setdefault("interval_days", 0)
    row.setdefault("reps", 0)
    row.setdefault("lapses", 0)
    row.setdefault("due_at", None)
    row.setdefault("last_rating", None)
    row.setdefault("last_reviewed_at", None)
    if row.get("ease") is None:
        row["ease"] = 2.5
    if row.get("interval_days") is None:
        row["interval_days"] = 0
    if row.get("reps") is None:
        row["reps"] = 0
    if row.get("lapses") is None:
        row["lapses"] = 0
    return row


# ── Endpoints ────────────────────────────────────────────────────────────────


@router.get("/queue", response_model=ReviewQueueResponse)
async def get_queue(
    limit: int = Query(default=20, ge=1, le=200),
    conn: aiomysql.Connection = Depends(get_db),
):
    """Return terms due for review (new terms first, then earliest-due)."""
    now = datetime.now()
    async with conn.cursor(aiomysql.DictCursor) as cur:
        # Total due: new terms + terms whose due_at <= now
        await cur.execute(
            """
            SELECT COUNT(*) AS cnt
            FROM terms t
            LEFT JOIN term_reviews r ON r.term_id = t.id
            WHERE r.term_id IS NULL OR r.due_at <= %s
            """,
            (now,),
        )
        due_count = (await cur.fetchone())["cnt"]

        await cur.execute(
            "SELECT COUNT(*) AS cnt FROM terms t LEFT JOIN term_reviews r ON r.term_id = t.id WHERE r.term_id IS NULL"
        )
        new_count = (await cur.fetchone())["cnt"]

        # Queue: new (random-ish via t.id) first, then by due_at asc
        await cur.execute(
            """
            SELECT
                t.*,
                r.ease,
                r.interval_days,
                r.reps,
                r.lapses,
                r.due_at,
                r.last_rating,
                r.last_reviewed_at,
                (r.term_id IS NULL) AS is_new
            FROM terms t
            LEFT JOIN term_reviews r ON r.term_id = t.id
            WHERE r.term_id IS NULL OR r.due_at <= %s
            ORDER BY is_new DESC, r.due_at ASC, t.id ASC
            LIMIT %s
            """,
            (now, limit),
        )
        rows = await cur.fetchall()

    queue = [await _to_review_card(conn, row) for row in rows]
    return {"due_count": due_count, "new_count": new_count, "queue": queue}


@router.post("/{slug}", response_model=ReviewState)
async def submit_rating(
    slug: str,
    body: ReviewRating,
    conn: aiomysql.Connection = Depends(get_db),
):
    """Apply a rating to a term and return its new scheduling state."""
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT id FROM terms WHERE slug = %s", (slug,))
        term = await cur.fetchone()
    if not term:
        raise HTTPException(status_code=404, detail=f"Term '{slug}' not found")
    term_id = term["id"]

    existing = await _get_review_row(conn, term_id)
    ease = float(existing["ease"]) if existing else 2.5
    interval_days = int(existing["interval_days"]) if existing else 0
    reps = int(existing["reps"]) if existing else 0
    lapses = int(existing["lapses"]) if existing else 0

    new_ease, new_interval, new_reps, new_lapses = _next_state(
        body.rating, ease, interval_days, reps, lapses
    )

    now = datetime.now()
    if body.rating == "again":
        # Re-show in the same session: due in ~10 minutes
        due_at = now + timedelta(minutes=10)
    else:
        due_at = now + timedelta(days=new_interval)

    await _upsert_review(
        conn, term_id, new_ease, new_interval, new_reps, new_lapses,
        due_at, body.rating, now,
    )
    await _bump_session(conn, now.date(), correct=(body.rating != "again"))

    return ReviewState(
        term_id=term_id,
        ease=new_ease,
        interval_days=new_interval,
        reps=new_reps,
        lapses=new_lapses,
        due_at=due_at,
        last_rating=body.rating,
        last_reviewed_at=now,
    )


@router.get("/streak", response_model=StreakResponse)
async def get_streak(conn: aiomysql.Connection = Depends(get_db)):
    """Streak counters + 12-week heatmap of review activity."""
    now = datetime.now()
    today = now.date()
    start = today - timedelta(days=HEATMAP_DAYS - 1)

    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            """
            SELECT session_date, reviewed_count, correct_count
            FROM review_sessions
            WHERE session_date >= %s
            ORDER BY session_date ASC
            """,
            (start,),
        )
        recent_rows = await cur.fetchall()

        # All session dates ever -> for longest streak
        await cur.execute(
            "SELECT session_date FROM review_sessions WHERE reviewed_count > 0 ORDER BY session_date ASC"
        )
        all_dates_rows = await cur.fetchall()

        # Today's due count (mirror of /queue's due_count, no LIMIT applied)
        await cur.execute(
            """
            SELECT COUNT(*) AS cnt
            FROM terms t
            LEFT JOIN term_reviews r ON r.term_id = t.id
            WHERE r.term_id IS NULL OR r.due_at <= %s
            """,
            (now,),
        )
        today_due = (await cur.fetchone())["cnt"]

    # Build heatmap (fill in zero-days)
    by_date: dict[date, dict] = {
        r["session_date"]: r for r in recent_rows
    }
    heatmap: List[HeatmapDay] = []
    for i in range(HEATMAP_DAYS):
        d = start + timedelta(days=i)
        row = by_date.get(d)
        heatmap.append(
            HeatmapDay(
                date=d.isoformat(),
                reviewed_count=int(row["reviewed_count"]) if row else 0,
                correct_count=int(row["correct_count"]) if row else 0,
            )
        )

    today_reviewed = int(by_date[today]["reviewed_count"]) if today in by_date else 0

    # Compute streaks (only days with reviewed_count > 0 count)
    active_dates = sorted({r["session_date"] for r in all_dates_rows})

    longest = 0
    run = 0
    prev: date | None = None
    for d in active_dates:
        if prev is not None and d == prev + timedelta(days=1):
            run += 1
        else:
            run = 1
        longest = max(longest, run)
        prev = d

    # Current streak: count back from today (or yesterday if not yet studied today)
    active_set = set(active_dates)
    current = 0
    cursor_day = today
    if cursor_day not in active_set:
        cursor_day = today - timedelta(days=1)
    while cursor_day in active_set:
        current += 1
        cursor_day -= timedelta(days=1)

    return StreakResponse(
        current_streak=current,
        longest_streak=longest,
        today_reviewed=today_reviewed,
        today_due=today_due,
        daily_goal=DAILY_GOAL,
        heatmap=heatmap,
    )
