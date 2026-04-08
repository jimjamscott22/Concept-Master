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
