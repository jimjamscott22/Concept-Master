"""Structural and curriculum-context validation for generated lessons."""
from __future__ import annotations

import re
from typing import Annotated, Literal, Self

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, ValidationInfo, field_validator, model_validator

from .graph import ConceptId


Text = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


class SeeIt(StrictModel):
    kind: Literal["code", "diagram", "table"]
    language: Text | None = None
    content: Text
    caption: Text = Field(max_length=200)

    @model_validator(mode="after")
    def code_requirements(self) -> Self:
        if self.kind == "code":
            if not self.language:
                raise ValueError("code requires a language")
            if len(self.content.splitlines()) > 40:
                raise ValueError("code must have at most 40 lines")
        return self


class QuizItem(StrictModel):
    kind: Literal["mcq", "predict_output", "spot_the_bug"]
    prompt: Text
    code: Text | None = None
    options: list[Text] = Field(min_length=3, max_length=4)
    answer_index: int = Field(ge=0)
    explanation: Text = Field(max_length=400)

    @model_validator(mode="after")
    def quiz_requirements(self) -> Self:
        if len(set(self.options)) != len(self.options):
            raise ValueError("quiz options must be unique")
        if self.answer_index >= len(self.options):
            raise ValueError("answer_index must index an option")
        if self.kind != "mcq" and not self.code:
            raise ValueError("predict_output and spot_the_bug require code")
        return self


class Link(StrictModel):
    previous_concept_id: ConceptId | None = None
    connection: Text = Field(max_length=300)
    tomorrow_teaser: Text | None = Field(default=None, max_length=160)


class DailyLesson(StrictModel):
    concept_id: ConceptId
    hook: Text = Field(max_length=280)
    concept_md: Text
    analogy: Text = Field(max_length=400)
    see_it: SeeIt
    check: list[QuizItem] = Field(min_length=2, max_length=3)
    link: Link
    fun_fact: Text | None = Field(default=None, max_length=200)

    @field_validator("hook")
    @classmethod
    def sentence_count(cls, value: str) -> str:
        if len(re.split(r"(?<=[.!?])\s+", value)) > 2:
            raise ValueError("hook must have one or two sentences")
        return value

    @field_validator("concept_md")
    @classmethod
    def word_count(cls, value: str) -> str:
        # A word is a whitespace-delimited token, including Markdown tokens.
        if not 150 <= len(value.split()) <= 250:
            raise ValueError("concept_md must have 150 to 250 whitespace-delimited words")
        return value

    @model_validator(mode="after")
    def curriculum_requirements(self, info: ValidationInfo) -> Self:
        if not info.context:
            raise ValueError("lesson validation requires curriculum context")
        concept = info.context["concept"]
        if self.concept_id != concept.id:
            raise ValueError("concept_id must match the selected concept")
        if self.link.previous_concept_id is not None and self.link.previous_concept_id not in info.context["taught"]:
            raise ValueError("previous_concept_id must already be taught")
        if self.link.tomorrow_teaser and not info.context.get("tomorrow"):
            raise ValueError("tomorrow_teaser requires an already selected tomorrow concept")
        if concept.domain.value in {"python", "web", "software-engineering", "data"}:
            if all(item.kind == "mcq" for item in self.check):
                raise ValueError("coding-adjacent lessons require a non-mcq quiz item")
        return self


def parse_lesson(raw: str, context: dict) -> DailyLesson:
    text = raw.strip()
    if text.startswith("```"):
        match = re.fullmatch(r"```(?:json)?\s*\n(.*?)\n```", text, flags=re.DOTALL | re.IGNORECASE)
        if match:
            text = match.group(1)
    return DailyLesson.model_validate_json(text, context=context)
