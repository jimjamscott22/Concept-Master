from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, field_validator


class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    term_count: int = 0


class TagResponse(BaseModel):
    id: int
    name: str
    term_count: int = 0


class TermSummary(BaseModel):
    id: int
    name: str
    slug: str


class TermBase(BaseModel):
    name: str
    definition: str
    example_code: Optional[str] = None
    code_lang: Optional[str] = None


class TermCreate(TermBase):
    category_ids: List[int] = []
    tag_names: List[str] = []
    related_term_ids: List[int] = []


class TermUpdate(TermBase):
    category_ids: List[int] = []
    tag_names: List[str] = []
    related_term_ids: List[int] = []


class TermResponse(TermBase):
    id: int
    slug: str
    is_favorite: bool
    categories: List[CategoryResponse] = []
    tags: List[TagResponse] = []
    created_at: datetime
    updated_at: datetime

    @field_validator("is_favorite", mode="before")
    @classmethod
    def coerce_favorite(cls, v: object) -> bool:
        return bool(v)


class TermDetailResponse(TermResponse):
    related_terms: List[TermSummary] = []


class TermListResponse(BaseModel):
    terms: List[TermResponse]
    total: int
    limit: int
    offset: int


class StatsResponse(BaseModel):
    total_terms: int
    total_categories: int
    total_tags: int
    per_category: List[CategoryResponse]
    recent_terms: List[TermSummary]
    top_favorites: List[TermSummary]


class ImportItem(BaseModel):
    name: str
    definition: str
    example_code: Optional[str] = None
    code_lang: Optional[str] = None
    category_ids: List[int] = []
    tag_names: List[str] = []
    related_term_ids: List[int] = []


# ── Review / spaced-repetition models ────────────────────────────────────────


class ReviewCard(TermDetailResponse):
    """A term scheduled for review, with its current SM-2 state."""
    ease: float = 2.5
    interval_days: int = 0
    reps: int = 0
    lapses: int = 0
    due_at: Optional[datetime] = None
    last_rating: Optional[str] = None
    last_reviewed_at: Optional[datetime] = None


class ReviewQueueResponse(BaseModel):
    due_count: int           # total terms currently due (including new)
    new_count: int           # of those, how many have never been reviewed
    queue: List[ReviewCard]  # capped by `limit`


class ReviewRating(BaseModel):
    rating: str              # "again" | "hard" | "good" | "easy"

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in {"again", "hard", "good", "easy"}:
            raise ValueError("rating must be one of: again, hard, good, easy")
        return v


class ReviewState(BaseModel):
    term_id: int
    ease: float
    interval_days: int
    reps: int
    lapses: int
    due_at: datetime
    last_rating: Optional[str]
    last_reviewed_at: Optional[datetime]


class HeatmapDay(BaseModel):
    date: str                # ISO YYYY-MM-DD
    reviewed_count: int
    correct_count: int


class StreakResponse(BaseModel):
    current_streak: int      # consecutive days up to and including today/yesterday
    longest_streak: int
    today_reviewed: int
    today_due: int
    daily_goal: int
    heatmap: List[HeatmapDay]  # last 84 days (12 weeks)
