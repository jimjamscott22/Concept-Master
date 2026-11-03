"""Generate buffered lessons explicitly; web requests never import this CLI."""
from __future__ import annotations

import argparse
import asyncio
from dataclasses import replace
from datetime import date, datetime, timedelta
import json
import logging
import os
from zoneinfo import ZoneInfo

from dotenv import load_dotenv
from pydantic import ValidationError

from .graph import DEFAULT_GRAPH_PATH, ConceptDef, load_graph
from .lesson import parse_lesson
from .providers import AnthropicProvider, LLMProvider, MockProvider, redact
from .store import LessonStore, MariaDBLessonStore, MemoryLessonStore


logger = logging.getLogger(__name__)


async def generate_dates(store: LessonStore, provider: LLMProvider, graph: list[ConceptDef],
                         days: list[date], tz: ZoneInfo, model: str, force: bool = False) -> int:
    """Return non-zero if any requested date lacks a ready/completed lesson."""
    failures = 0
    for day in days:
        try:
            reservation = await store.claim(day, graph, tz, force, model)
        except (ValueError, RuntimeError):
            logger.error("%s: reservation failed; check configuration and curriculum", day)
            failures += 1
            continue
        if reservation.outcome == "ready":
            logger.info("%s: already ready", day)
            continue
        if not reservation.claim:
            logger.warning("%s: %s", day, reservation.outcome)
            failures += 1
            continue
        claim = reservation.claim
        context = claim.context
        payload = None
        raw = None
        for attempt in range(1, 4):
            try:
                raw = None
                output = await asyncio.wait_for(provider.generate_lesson(claim.concept, context), timeout=65)
                raw = redact(output)
                lesson = parse_lesson(raw, context.validation(claim.concept))
                payload = redact(lesson.model_dump_json())
                break
            except ValidationError as exc:
                # Validation inputs can contain secrets or large untrusted text.
                errors = json.dumps(exc.errors(include_input=False, include_context=False, include_url=False))
                context = replace(context, errors=(*context.errors, redact(errors)))
            except Exception:
                # Never log/store SDK exceptions: their bodies may contain headers.
                context = replace(context, errors=(*context.errors, "Provider call failed or timed out; return complete lesson JSON."))
        saved = await store.finish(claim, payload, raw if payload is None else None, attempt)
        if payload is None or not saved:
            logger.error("%s: %s", day, "failed validation/generation" if saved else "claim expired or was replaced")
            failures += 1
        else:
            logger.info("%s: ready (%s, %s attempts)", day, claim.concept.id, attempt)
    return int(failures > 0)


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--days-ahead", type=int, default=3)
    parser.add_argument("--date", type=date.fromisoformat)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--provider", choices=("mock", "anthropic"), default="anthropic")
    parser.add_argument("--mock-scenario", choices=("valid", "invalid-then-valid", "always-invalid"), default="valid")
    parser.add_argument("--dry-run", action="store_true", help="Mock-only disposable state; no database or paid calls")
    return parser


async def _run(args: argparse.Namespace) -> int:
    # Load configuration, never display it. No database/provider construction
    # occurs until all command/configuration guards have passed.
    load_dotenv(DEFAULT_GRAPH_PATH.parents[2] / ".env")
    if args.days_ahead < 1 or args.days_ahead > 30:
        raise ValueError("--days-ahead must be between 1 and 30")
    if args.force and not args.date:
        raise ValueError("--force requires --date")
    if args.provider == "mock" and not args.dry_run:
        raise ValueError("--provider mock requires --dry-run; fixtures must not be published")
    if args.dry_run and args.provider != "mock":
        raise ValueError("--dry-run requires --provider mock; no paid dry runs")
    if os.getenv("DAILY_REQUIRE_APPROVAL", "false").strip().lower() in {"1", "true", "yes", "on"}:
        raise ValueError("DAILY_REQUIRE_APPROVAL requires v2 approval support")
    tz = ZoneInfo(os.getenv("DAILY_TIMEZONE", "America/New_York"))
    start = args.date or datetime.now(tz).date()
    days = [start] if args.date else [start + timedelta(days=offset) for offset in range(args.days_ahead)]
    graph = load_graph()
    if args.dry_run:
        logger.info("Disposable mock run: no lessons will be persisted")
        return await generate_dates(MemoryLessonStore(), MockProvider(args.mock_scenario), graph, days, tz, "mock-fixture")
    if os.getenv("DAILY_CONCEPT_ENABLED", "false").strip().lower() not in {"1", "true", "yes", "on"}:
        raise ValueError("Set DAILY_CONCEPT_ENABLED=true for persistent generation")
    model = os.getenv("DAILY_LLM_MODEL", "").strip()
    key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if not model or not key:
        raise ValueError("Set DAILY_LLM_MODEL and ANTHROPIC_API_KEY for Anthropic generation")

    from backend.database import create_pool
    from .sync import sync_concepts

    provider = AnthropicProvider(model, key)
    pool = None
    try:
        pool = await create_pool()
        await sync_concepts(pool)
        return await generate_dates(MariaDBLessonStore(pool), provider, graph, days, tz, model, args.force)
    finally:
        if pool is not None:
            pool.close()
            await pool.wait_closed()
        await provider.close()


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    try:
        return asyncio.run(_run(args))
    except (ValueError, KeyError):
        logger.error("Invalid generation settings; check flags, timezone, model/key, and approval configuration")
    except Exception:
        logger.error("Generation failed; verify database initialization, connectivity, and provider configuration")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
