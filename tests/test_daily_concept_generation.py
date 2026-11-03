import asyncio
from copy import deepcopy
from datetime import date, timedelta
import json
import logging
from types import SimpleNamespace
from unittest.mock import AsyncMock
from zoneinfo import ZoneInfo

import pytest
from pydantic import ValidationError

from daily_concept.generate import generate_dates, main
from daily_concept.graph import ConceptDef, load_graph
from daily_concept.lesson import DailyLesson, parse_lesson
from daily_concept.providers import (
    AnthropicProvider, FIXTURE_ROOT, GenerationContext, MockProvider, build_prompt,
)
from daily_concept.store import MemoryLessonStore


DAY = date(2026, 11, 2)
TZ = ZoneInfo("America/New_York")
CONCEPT = ConceptDef(id="python-values", title="Python names", domain="python", difficulty=1)


@pytest.fixture
def payload():
    return json.loads((FIXTURE_ROOT / "valid.json").read_text(encoding="utf-8"))


def parse(data, context=None):
    return parse_lesson(json.dumps(data), context or GenerationContext().validation(CONCEPT))


def test_valid_fixture_and_code_fence(payload):
    assert parse(payload).concept_id == CONCEPT.id
    assert parse_lesson("```json\n" + json.dumps(payload) + "\n```",
                        GenerationContext().validation(CONCEPT)).check[0].answer_index == 0


@pytest.mark.parametrize("field,value", [
    ("concept_id", "unknown"), ("hook", "x" * 281), ("hook", "One. Two. Three."),
    ("hook", " "), ("concept_md", "word " * 149), ("concept_md", "word " * 251),
    ("analogy", "x" * 401), ("fun_fact", "x" * 201), ("extra", "unexpected"),
    ("check", []),
])
def test_top_level_schema_rejections(payload, field, value):
    payload[field] = value
    with pytest.raises(ValidationError):
        parse(payload)


@pytest.mark.parametrize("words", [150, 250])
def test_word_count_boundaries(payload, words):
    payload["concept_md"] = "word " * words
    assert parse(payload)


@pytest.mark.parametrize("changes", [
    {"language": None}, {"language": " "}, {"content": "line\n" * 41},
    {"caption": "x" * 201}, {"kind": "executable"},
])
def test_see_it_rejections(payload, changes):
    payload["see_it"].update(changes)
    with pytest.raises(ValidationError):
        parse(payload)


@pytest.mark.parametrize("kind", ["diagram", "table"])
def test_noncode_visuals_accept_null_language(payload, kind):
    payload["see_it"].update(kind=kind, language=None)
    assert parse(payload).see_it.kind == kind


@pytest.mark.parametrize("changes", [
    {"options": ["a", "b"]}, {"options": ["a", "b", "c", "d", "e"]},
    {"options": ["a", " a ", "b"]}, {"answer_index": -1}, {"answer_index": 3},
    {"answer_index": True}, {"answer_index": "0"}, {"code": None},
    {"kind": "spot_the_bug", "code": " "}, {"explanation": "x" * 401},
])
def test_quiz_rejections(payload, changes):
    payload["check"][0].update(changes)
    with pytest.raises(ValidationError):
        parse(payload)


def test_coding_domain_requires_non_mcq(payload):
    payload["check"][0]["kind"] = "mcq"
    with pytest.raises(ValidationError, match="non-mcq"):
        parse(payload)
    security = ConceptDef(id=CONCEPT.id, title="Security", domain="security", difficulty=1)
    assert parse(payload, GenerationContext().validation(security))


@pytest.mark.parametrize("changes", [
    {"previous_concept_id": "untaught"}, {"connection": "x" * 301},
    {"tomorrow_teaser": "x" * 161}, {"tomorrow_teaser": "An unselected concept"},
])
def test_link_rejections(payload, changes):
    payload["link"].update(changes)
    with pytest.raises(ValidationError):
        parse(payload)


def test_contextual_link_and_prompt(payload):
    context = GenerationContext(taught={"old": "An old lesson"},
                                recent_related={"old": "An old lesson"}, tomorrow="Next lesson",
                                errors=("Missing hook",))
    payload["link"].update(previous_concept_id="old", tomorrow_teaser="Next lesson")
    assert parse(payload, context.validation(CONCEPT))
    prompt = build_prompt(CONCEPT, context)
    assert "Missing hook" in prompt and "An old lesson" in prompt and "Next lesson" in prompt
    assert '"answer_index"' in prompt and "Required JSON Schema" in prompt


def test_validation_requires_context(payload):
    with pytest.raises(ValidationError, match="curriculum context"):
        DailyLesson.model_validate(payload)


def run_generation(store, provider, days=None, force=False):
    return asyncio.run(generate_dates(store, provider, load_graph(), days or [DAY], TZ, "mock", force))


@pytest.mark.parametrize("scenario,exit_code,attempts,status", [
    ("valid", 0, 1, "ready"), ("invalid-then-valid", 0, 2, "ready"),
    ("always-invalid", 1, 3, "failed"),
])
def test_generation_retry_scenarios(scenario, exit_code, attempts, status):
    store = MemoryLessonStore()
    assert run_generation(store, MockProvider(scenario)) == exit_code
    assert store.rows[0]["status"] == status and store.rows[0]["attempts"] == attempts
    assert bool(store.rows[0]["payload"]) == (status == "ready")
    assert bool(store.rows[0]["raw_output"]) == (status == "failed")
    assert store.rows[0]["claim_token"] is None


def test_three_day_buffer_never_duplicates_a_reservation():
    store = MemoryLessonStore()
    days = [DAY + timedelta(days=i) for i in range(3)]
    assert run_generation(store, MockProvider(), days) == 0
    assert {row["scheduled_date"] for row in store.rows} == set(days)
    assert len({row["concept_id"] for row in store.rows}) == 3


def test_ready_dates_do_not_call_provider_again():
    store = MemoryLessonStore()
    assert run_generation(store, MockProvider()) == 0
    provider = SimpleNamespace(generate_lesson=AsyncMock(side_effect=AssertionError("must not call")))
    assert run_generation(store, provider) == 0
    provider.generate_lesson.assert_not_awaited()


def test_failed_date_retry_retains_concept():
    store = MemoryLessonStore()
    assert run_generation(store, MockProvider("always-invalid")) == 1
    concept = store.rows[0]["concept_id"]
    assert run_generation(store, MockProvider()) == 0
    assert store.rows[0]["concept_id"] == concept


def test_completed_force_is_rejected():
    store = MemoryLessonStore()
    run_generation(store, MockProvider())
    store.rows[0]["status"] = "completed"
    before = deepcopy(store.rows)
    assert run_generation(store, MockProvider(), force=True) == 1
    assert store.rows == before


def test_live_claim_busy_expired_claim_recovered_and_old_owner_rejected():
    async def run():
        store = MemoryLessonStore()
        first = await store.claim(DAY, load_graph(), TZ, False, "mock")
        assert (await store.claim(DAY, load_graph(), TZ, True, "mock")).outcome == "busy"
        store.rows[0]["claim_expires_at"] = store.now() - timedelta(seconds=1)
        second = await store.claim(DAY, load_graph(), TZ, False, "mock")
        assert second.claim.concept.id == first.claim.concept.id
        assert not await store.finish(first.claim, "{}", None, 1)
        assert await store.finish(second.claim, "{}", None, 1)
    asyncio.run(run())


def test_expired_claim_cannot_save_even_without_replacement():
    async def run():
        store = MemoryLessonStore()
        reservation = await store.claim(DAY, load_graph(), TZ, False, "mock")
        store.rows[0]["claim_expires_at"] = store.now() - timedelta(seconds=1)
        assert not await store.finish(reservation.claim, "{}", None, 1)
    asyncio.run(run())


def test_failures_continue_to_other_dates():
    class OneBadConcept(MockProvider):
        first_id = None

        async def generate_lesson(self, concept, context):
            self.first_id = self.first_id or concept.id
            self.scenario = "always-invalid" if concept.id == self.first_id else "valid"
            return await super().generate_lesson(concept, context)

    store = MemoryLessonStore()
    assert run_generation(store, OneBadConcept(), [DAY, DAY + timedelta(days=1)]) == 1
    assert [row["status"] for row in store.rows] == ["failed", "ready"]


def test_secrets_in_invalid_output_and_provider_exceptions_are_not_logged_or_stored(monkeypatch, caplog):
    secret = "private-test-key"
    monkeypatch.setenv("ANTHROPIC_API_KEY", secret)
    provider = SimpleNamespace(generate_lesson=AsyncMock(side_effect=[
        secret, RuntimeError(secret), secret,
    ]))
    store = MemoryLessonStore()
    with caplog.at_level(logging.INFO):
        assert run_generation(store, provider) == 1
    assert secret not in repr(store.rows) and secret not in caplog.text
    assert "[REDACTED]" in store.rows[0]["raw_output"]


def test_anthropic_request_is_bounded_and_contains_no_key(monkeypatch):
    client = SimpleNamespace(messages=SimpleNamespace(create=AsyncMock(return_value=SimpleNamespace(
        stop_reason="end_turn", content=[SimpleNamespace(type="text", text="{}")],
    ))), close=AsyncMock())
    import anthropic
    constructor = lambda **kwargs: client
    monkeypatch.setattr(anthropic, "AsyncAnthropic", constructor)
    provider = AnthropicProvider("explicit-model", "private-test-key")
    assert asyncio.run(provider.generate_lesson(CONCEPT, GenerationContext())) == "{}"
    request = client.messages.create.call_args.kwargs
    assert request["model"] == "explicit-model" and request["max_tokens"] == 4096
    assert "private-test-key" not in repr(request)
    asyncio.run(provider.close())
    client.close.assert_awaited_once()


@pytest.mark.parametrize("argv", [
    ["--provider", "mock"], ["--dry-run"], ["--force"], ["--days-ahead", "0"],
    ["--days-ahead", "31"],
])
def test_cli_guards_exit_nonzero_before_io(argv):
    assert main(argv) == 1


def test_offline_cli_valid_and_invalid_exit_codes(monkeypatch):
    monkeypatch.setenv("DAILY_REQUIRE_APPROVAL", "false")
    monkeypatch.setenv("DAILY_TIMEZONE", "America/New_York")
    assert main(["--provider", "mock", "--dry-run", "--days-ahead", "3"]) == 0
    assert main(["--provider", "mock", "--dry-run", "--mock-scenario", "always-invalid"]) == 1


def test_approval_configuration_rejected(monkeypatch):
    monkeypatch.setenv("DAILY_REQUIRE_APPROVAL", "true")
    assert main(["--provider", "mock", "--dry-run"]) == 1


def test_disabled_and_missing_credentials_rejected_before_pool_creation(monkeypatch):
    from backend import database

    create_pool = AsyncMock(side_effect=AssertionError("No database access permitted"))
    monkeypatch.setattr(database, "create_pool", create_pool)
    monkeypatch.setenv("DAILY_REQUIRE_APPROVAL", "false")
    monkeypatch.setenv("DAILY_CONCEPT_ENABLED", "false")
    assert main([]) == 1
    monkeypatch.setenv("DAILY_CONCEPT_ENABLED", "true")
    monkeypatch.setenv("DAILY_LLM_MODEL", "")
    assert main([]) == 1
    create_pool.assert_not_awaited()


def test_persistent_startup_failure_closes_pool_and_provider(monkeypatch):
    from unittest.mock import MagicMock
    from backend import database
    from daily_concept import generate, sync

    monkeypatch.setenv("DAILY_REQUIRE_APPROVAL", "false")
    monkeypatch.setenv("DAILY_CONCEPT_ENABLED", "true")
    monkeypatch.setenv("DAILY_LLM_MODEL", "test-model")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")
    pool = SimpleNamespace(close=MagicMock(), wait_closed=AsyncMock())
    provider = SimpleNamespace(close=AsyncMock(), generate_lesson=AsyncMock())
    monkeypatch.setattr(database, "create_pool", AsyncMock(return_value=pool))
    monkeypatch.setattr(generate, "AnthropicProvider", lambda *args: provider)
    monkeypatch.setattr(sync, "sync_concepts", AsyncMock(side_effect=RuntimeError("schema missing")))
    assert main([]) == 1
    pool.close.assert_called_once()
    pool.wait_closed.assert_awaited_once()
    provider.close.assert_awaited_once()
    provider.generate_lesson.assert_not_awaited()


def test_secret_in_valid_payload_is_redacted_after_json_decoding(monkeypatch, payload):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "secret-test-key")
    payload["hook"] = "secret-test-key"
    # Escaped provider output is decoded during schema validation.
    escaped = json.dumps(payload).replace("secret-test-key", "".join(f"\\u{ord(c):04x}" for c in "secret-test-key"))

    class Provider:
        async def generate_lesson(self, concept, context):
            data = json.loads(escaped)
            data["concept_id"] = concept.id
            return json.dumps(data).replace("secret-test-key", "".join(f"\\u{ord(c):04x}" for c in "secret-test-key"))

    store = MemoryLessonStore()
    assert run_generation(store, Provider()) == 0
    assert "secret-test-key" not in store.rows[0]["payload"]


def test_schema_feedback_excludes_untrusted_input():
    class Provider(MockProvider):
        contexts = []

        async def generate_lesson(self, concept, context):
            self.contexts.append(context)
            if not context.errors:
                return '{"untrusted_input": "must-not-be-in-feedback"}'
            return await super().generate_lesson(concept, context)

    provider, store = Provider(), MemoryLessonStore()
    assert run_generation(store, provider) == 0
    assert provider.contexts[1].errors
    assert "must-not-be-in-feedback" not in repr(provider.contexts[1].errors)
