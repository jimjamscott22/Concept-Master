"""Short generation transactions; no database locks survive a provider call."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from typing import Protocol
from uuid import uuid4
from zoneinfo import ZoneInfo

import aiomysql

from .graph import ConceptDef, Domain
from .providers import GenerationContext, PROMPT_VERSION
from .selection import RecentLesson, select_concept


LEASE_SECONDS = 300  # Three bounded 60-second attempts fit inside one claim.
VALID_STATUSES = {"ready", "published", "completed"}


@dataclass(frozen=True)
class Claim:
    day: date
    concept: ConceptDef
    token: str
    expires_at: datetime
    context: GenerationContext


@dataclass(frozen=True)
class Reservation:
    outcome: str  # claimed, ready, busy, exhausted, saturated
    claim: Claim | None = None


class LessonStore(Protocol):
    async def claim(self, day: date, graph: list[ConceptDef], tz: ZoneInfo, force: bool, model: str) -> Reservation: ...
    async def finish(self, claim: Claim, payload: str | None, raw: str | None, attempts: int) -> bool: ...


def prepare_claim(rows: list[dict], day: date, graph: list[ConceptDef], tz: ZoneInfo,
                  force: bool, now: datetime) -> Reservation:
    existing = next((row for row in rows if row["scheduled_date"] == day), None)
    if existing:
        if force and existing["status"] == "completed":
            raise ValueError("Cannot regenerate a completed lesson")
        expiry = existing.get("claim_expires_at")
        if expiry and expiry > now:
            return Reservation("busy")
        if existing["status"] in VALID_STATUSES and not force:
            return Reservation("ready")
        if existing["status"] == "pending_review":
            raise ValueError("Approval-pending lessons require v2 approval support")

    taught = {row["concept_id"]: row["title"] for row in rows if row["status"] == "completed"}
    recent = []
    for row in rows:
        if row["status"] not in VALID_STATUSES:
            continue
        completed = row.get("completed_at")
        completed_date = completed.replace(tzinfo=timezone.utc).astimezone(tz).date() if completed else None
        recent.append(RecentLesson(row["concept_id"], row["scheduled_date"],
                                  Domain(row["domain"]), row["difficulty"], completed_date))
    reserved = {row["concept_id"] for row in rows}
    concept_id = existing["concept_id"] if existing else select_concept(day, taught, reserved, recent, graph)
    if concept_id is None:
        exhausted = all(concept.id in taught for concept in graph)
        return Reservation("exhausted" if exhausted else "saturated")
    concept = next((concept for concept in graph if concept.id == concept_id), None)
    if concept is None:
        raise ValueError("Reserved concept is absent from the active YAML graph")
    related_ids = {
        lesson.concept_id for lesson in recent
        if lesson.concept_id in taught and lesson.completed_date
        and day - timedelta(days=7) <= lesson.completed_date < day
    }
    tomorrow = next((row["title"] for row in rows if row["scheduled_date"] == day + timedelta(days=1)), None)
    context = GenerationContext(
        taught=taught,
        recent_related={id: taught[id] for id in concept.related if id in related_ids},
        tomorrow=tomorrow,
    )
    return Reservation("claimed", Claim(day, concept, str(uuid4()), now + timedelta(seconds=LEASE_SECONDS), context))


class MariaDBLessonStore:
    def __init__(self, pool: aiomysql.Pool):
        self.pool = pool

    async def claim(self, day: date, graph: list[ConceptDef], tz: ZoneInfo,
                    force: bool, model: str) -> Reservation:
        async with self.pool.acquire() as conn:
            await conn.begin()
            try:
                async with conn.cursor(aiomysql.DictCursor) as cur:
                    # All generation claims serialize on the singleton. Phase 4
                    # completion must take this lock BEFORE its lesson lock too.
                    await cur.execute("SELECT id FROM streaks WHERE id = 1 FOR UPDATE")
                    if not await cur.fetchone():
                        raise RuntimeError("Initialize backend/schema.sql before generating")
                    await cur.execute("SELECT UTC_TIMESTAMP(6) AS now")
                    now = (await cur.fetchone())["now"]
                    await cur.execute(
                        "SELECT l.*, c.difficulty FROM daily_lessons l "
                        "JOIN concepts c ON c.id = l.concept_id ORDER BY l.scheduled_date FOR UPDATE"
                    )
                    rows = list(await cur.fetchall())
                    reservation = prepare_claim(rows, day, graph, tz, force, now)
                    if reservation.claim:
                        claim = reservation.claim
                        if any(row["scheduled_date"] == day for row in rows):
                            await cur.execute(
                                "UPDATE daily_lessons SET status = 'scheduled', payload = NULL, raw_output = NULL, "
                                "attempts = 0, claim_token = %s, claim_expires_at = %s, prompt_version = %s, "
                                "model = %s, title = %s, domain = %s WHERE scheduled_date = %s",
                                (claim.token, claim.expires_at, PROMPT_VERSION, model,
                                 claim.concept.title, claim.concept.domain.value, day),
                            )
                        else:
                            await cur.execute(
                                "INSERT INTO daily_lessons (concept_id, scheduled_date, title, domain, "
                                "claim_token, claim_expires_at, prompt_version, model) "
                                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                                (claim.concept.id, day, claim.concept.title, claim.concept.domain.value,
                                 claim.token, claim.expires_at, PROMPT_VERSION, model),
                            )
                await conn.commit()
                return reservation
            except BaseException:
                await conn.rollback()
                raise

    async def finish(self, claim: Claim, payload: str | None, raw: str | None, attempts: int) -> bool:
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    "UPDATE daily_lessons SET status = %s, payload = %s, raw_output = %s, attempts = %s, "
                    "claim_token = NULL, claim_expires_at = NULL "
                    "WHERE scheduled_date = %s AND concept_id = %s AND claim_token = %s "
                    "AND claim_expires_at > UTC_TIMESTAMP(6) AND status = 'scheduled'",
                    ("ready" if payload else "failed", payload, raw, attempts,
                     claim.day, claim.concept.id, claim.token),
                )
                return cur.rowcount == 1


class MemoryLessonStore:
    """Disposable CLI dry-run/test state, never a second persistence backend."""
    def __init__(self):
        self.rows: list[dict] = []

    def now(self) -> datetime:
        return datetime.now(timezone.utc).replace(tzinfo=None)

    async def claim(self, day: date, graph: list[ConceptDef], tz: ZoneInfo,
                    force: bool, model: str) -> Reservation:
        result = prepare_claim(self.rows, day, graph, tz, force, self.now())
        if result.claim:
            claim = result.claim
            self.rows[:] = [row for row in self.rows if row["scheduled_date"] != day]
            self.rows.append({
                "scheduled_date": day, "concept_id": claim.concept.id, "title": claim.concept.title,
                "domain": claim.concept.domain.value, "difficulty": claim.concept.difficulty,
                "status": "scheduled", "claim_token": claim.token, "claim_expires_at": claim.expires_at,
                "completed_at": None, "prompt_version": PROMPT_VERSION, "model": model,
            })
        return result

    async def finish(self, claim: Claim, payload: str | None, raw: str | None, attempts: int) -> bool:
        for row in self.rows:
            if row["scheduled_date"] == claim.day and row.get("claim_token") == claim.token:
                if row["claim_expires_at"] <= self.now() or row["status"] != "scheduled":
                    return False
                row.update(status="ready" if payload else "failed", payload=payload, raw_output=raw,
                           attempts=attempts, claim_token=None, claim_expires_at=None)
                return True
        return False
