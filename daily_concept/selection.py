"""Deterministic curriculum selection; no database, clock, or provider access."""
from dataclasses import dataclass
from datetime import date, timedelta
import hashlib
import logging
import random
from collections.abc import Collection, Sequence

from .graph import ConceptDef, Domain


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class RecentLesson:
    concept_id: str
    scheduled_date: date
    domain: Domain
    difficulty: int
    completed_date: date | None = None


def select_concept(
    date: date,
    taught: Collection[str],
    reserved: Collection[str],
    recent_lessons: Sequence[RecentLesson],
    graph: Sequence[ConceptDef],
) -> str | None:
    """Select from the active YAML graph; taught means actually completed.

    The caller provides all lesson metadata needed for this date. Difficulty uses
    the last seven scheduled lessons before it; relation scoring uses actual
    completion dates in the preceding seven days. Future lessons are not taught.
    No candidate returns None, with distinct exhausted/saturated log messages.
    """
    taught = set(taught)
    reserved = set(reserved)
    untaught = [concept for concept in graph if concept.id not in taught]
    if not untaught:
        logger.info("graph exhausted")
        return None
    remaining = [concept for concept in untaught if concept.id not in reserved]
    if not remaining:
        logger.info("concept reservations saturated for %s", date)
        return None

    candidates = [concept for concept in remaining if set(concept.prerequisites) <= taught]
    rng = random.Random(int.from_bytes(hashlib.sha256(date.isoformat().encode("ascii")).digest()))
    if not candidates:
        logger.warning("prerequisite fallback for %s", date)
        lowest = min(concept.difficulty for concept in remaining)
        return rng.choice(sorted(concept.id for concept in remaining if concept.difficulty == lowest))

    previous = sorted(
        (lesson for lesson in recent_lessons if lesson.scheduled_date < date),
        key=lambda lesson: (lesson.scheduled_date, lesson.concept_id),
    )
    last_seven = previous[-7:]
    average = sum(lesson.difficulty for lesson in last_seven) / len(last_seven) if last_seven else 2
    last_domains = {
        lesson.domain for lesson in previous
        if date - timedelta(days=2) <= lesson.scheduled_date
    }
    recently_taught = {
        lesson.concept_id for lesson in recent_lessons
        if lesson.concept_id in taught and lesson.completed_date is not None
        and date - timedelta(days=7) <= lesson.completed_date < date
    }

    def score(concept: ConceptDef) -> int:
        return (
            3 * (concept.domain not in last_domains)
            + 2 * (abs(concept.difficulty - average) <= 1)
            + bool(set(concept.related) & recently_taught)
        )

    best = max(score(concept) for concept in candidates)
    return rng.choice(sorted(concept.id for concept in candidates if score(concept) == best))
