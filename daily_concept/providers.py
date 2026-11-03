"""Only explicit CLI generation invokes a provider; mock operation is offline."""
from dataclasses import dataclass, field
import json
import os
from pathlib import Path
from typing import Protocol

from .graph import ConceptDef
from .lesson import DailyLesson


PROMPT_VERSION = "lesson_v1"
PROMPT_PATH = Path(__file__).resolve().parent / "prompts/lesson_v1.md"
FIXTURE_ROOT = Path(__file__).resolve().parent.parent / "tests/fixtures/lessons"


@dataclass(frozen=True)
class GenerationContext:
    taught: dict[str, str] = field(default_factory=dict)
    recent_related: dict[str, str] = field(default_factory=dict)
    tomorrow: str | None = None
    errors: tuple[str, ...] = ()

    def validation(self, concept: ConceptDef) -> dict:
        return {"concept": concept, "taught": self.taught, "tomorrow": self.tomorrow}


def build_prompt(concept: ConceptDef, context: GenerationContext) -> str:
    data = {
        "concept": concept.model_dump(mode="json"),
        "taught_prerequisites": {id: context.taught[id] for id in concept.prerequisites if id in context.taught},
        "recently_taught_related": context.recent_related,
        "allowed_previous_concepts": context.taught,
        "tomorrow_selected_title": context.tomorrow,
    }
    prompt = PROMPT_PATH.read_text(encoding="utf-8")
    prompt += "\n\nCurriculum context:\n" + json.dumps(data, ensure_ascii=False)
    prompt += "\n\nRequired JSON Schema:\n" + json.dumps(DailyLesson.model_json_schema())
    for error in context.errors:
        prompt += "\nYour previous output failed validation: " + error
    return prompt


class LLMProvider(Protocol):
    async def generate_lesson(self, concept: ConceptDef, context: GenerationContext) -> str: ...


class AnthropicProvider:
    def __init__(self, model: str, api_key: str):
        from anthropic import AsyncAnthropic

        if not model.strip() or not api_key.strip():
            raise ValueError("Anthropic generation requires DAILY_LLM_MODEL and ANTHROPIC_API_KEY")
        self.model = model
        # Keep provider transport retries inside the generator's three-attempt cap.
        self.client = AsyncAnthropic(api_key=api_key, timeout=60.0, max_retries=0)

    async def generate_lesson(self, concept: ConceptDef, context: GenerationContext) -> str:
        response = await self.client.messages.create(
            model=self.model, max_tokens=4096,
            messages=[{"role": "user", "content": build_prompt(concept, context)}],
        )
        if response.stop_reason != "end_turn":
            raise RuntimeError("Provider did not finish a complete response")
        return "".join(block.text for block in response.content if block.type == "text")

    async def close(self) -> None:
        await self.client.close()


class MockProvider:
    """Read fixtures, adapting only their test identity to the selected concept.

    Fixture lessons exercise contracts, not curriculum accuracy. Never use mock
    content as a real daily lesson; the CLI requires --dry-run with this provider.
    """
    def __init__(self, scenario: str = "valid", fixture_root: Path = FIXTURE_ROOT):
        self.scenario = scenario
        self.fixture_root = fixture_root

    async def generate_lesson(self, concept: ConceptDef, context: GenerationContext) -> str:
        invalid = self.scenario == "always-invalid" or (
            self.scenario == "invalid-then-valid" and not context.errors
        )
        filename = "invalid.json" if invalid else "valid.json"
        data = json.loads((self.fixture_root / filename).read_text(encoding="utf-8"))
        data["concept_id"] = concept.id
        return json.dumps(data, ensure_ascii=False)


def redact(text: str) -> str:
    """Provider credentials never enter payloads, debugging output, or retry feedback."""
    secret = os.getenv("ANTHROPIC_API_KEY", "").strip()
    return text.replace(secret, "[REDACTED]") if secret else text
