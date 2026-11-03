# IMPLEMENTATION PLAN — Daily Concept (Concept-Master bolt-on)

Read `SPEC.md` first, then `docs/daily-concept/INTEGRATION_NOTES.md` for approved integration decisions. Every phase ends in a reviewable state with its checks reported. Don't start a phase until the previous one's checks pass and its scope is approved. Current approval covers the documentation revisions and Phase 1 only. Work sequentially; implement first, then add focused tests.

Conventions:
- Python dependencies: `uv add <pkg>`, and run everything through `uv run ...`. Never use pip.
- Branch creation and commits require explicit authorization; do not create a branch, commit, or push solely because this plan mentions them. Suggested commit messages: `daily-concept: phase N — <summary>`.
- New backend code lives in a `daily_concept/` package, or wherever Phase 0 decides it fits better. New frontend code lives in a `daily/` feature folder that follows the existing structure.
- When the spec and the existing codebase conflict, the **existing codebase conventions win**. Record the deviation in `INTEGRATION_NOTES.md`.

---

## Phase 0 — Recon and integration notes (NO feature code)

**Goal:** understand Concept-Master well enough to integrate cleanly.

1. Read `.graphify/GRAPH_REPORT.md` when available, compare its source commit with HEAD, and use `graph.json` for targeted questions. The Phase 0 snapshot matches `fd8577e`; runtime proof is absent. Keep `.graphify/` ignored and verify graph claims against source. Do not regenerate the graph without an approved scope.
2. Read `CLAUDE.md`, `README`, and any existing `SPEC.md`, and skim the most-connected concepts ("god nodes") in the report.
3. Treat edges tagged INFERRED as hints. Open the actual file before relying on them.
4. Create `docs/daily-concept/INTEGRATION_NOTES.md` and answer:
   - What are the backend framework, frontend framework, and active client (web vs. Expo)?
   - How is persistence set up: DB, ORM, migration tool, and where models live?
   - Are there existing concept, lesson, quiz, or progress entities? Should Daily Concept **reuse, extend, or add** tables? Give a recommendation and reasoning.
   - Is there a user or auth model? Is the app single-user?
   - What are the design tokens and component library, and which existing components can render the stepper, quiz, code blocks, and Markdown?
   - How does routing work (backend routers, frontend routes)?
   - What test frameworks and commands are used, and is there CI?
   - Does anything already schedule background work?
   - Any deviations from `SPEC.md` you plan to make, and why.
5. **STOP.** Summarize the notes for the user and wait for approval before Phase 1.

**Done when:** `INTEGRATION_NOTES.md` exists and the user has approved it.

---

## Phase 1 — Concept graph

1. Reuse the existing Pydantic and PyYAML dependencies; no new dependency is needed.
2. Create `content/daily_concepts/concepts.yaml` with ~30 seed concepts (SPEC §5.4):
   - Cover every domain in §5.2.
   - Include several difficulty-1 roots and chains 3–4 deep.
   - Give each concept a good `angle`.
3. Implement the loader and a Pydantic `ConceptDef` model, plus a validator covering unique ids, reference existence, DAG check with the cycle path reported, and enums/ranges (SPEC §5.3).
4. Keep Phase 1 independent of database/startup code. Defer all concept persistence and sync implementation to Phase 2 alongside its tables.
5. Add a CLI: `uv run python -m daily_concept.graph validate`, which prints a summary of counts per domain and difficulty, and the roots.
6. Write tests for a valid graph, duplicate ids, a missing prerequisite, and a cycle (asserting the path appears in the error).

**Done when:** `validate` passes on the seed file and all graph tests pass.

---

## Phase 2 — Data model and selection

1. Add the tables from SPEC §9 (MVP set: `concepts`, `daily_lessons`, `quiz_responses`, `streaks`) through additive MariaDB SQL in `backend/schema.sql`, following the Phase 0 decisions. Include date/concept reservation uniqueness, expiring claim ownership, daily response uniqueness, and historical title/domain snapshots.
2. Implement concept upsert and soft deletion, then wire sync on app startup guarded by `DAILY_CONCEPT_ENABLED`.
3. Implement selection as a pure function: `select_concept(date, taught, reserved, recent_lessons, graph) -> concept_id | None`. Exclude reservations in fallback too, and distinguish all-taught exhaustion from reservation saturation.
4. Write tests for:
   - Determinism for the same inputs
   - Domain rotation
   - The difficulty ramp
   - Prerequisite gating
   - The fallback path
   - Graph exhaustion

**Done when:** schema initialization succeeds twice on isolated fresh and existing-schema databases with representative data, sync and selection tests pass. Never use the personal development database as a test fixture. Report database checks as blocked if isolation or MariaDB is unavailable.

---

## Phase 3 — Lesson schema and generator

1. Implement the `DailyLesson` Pydantic models (SPEC §7), including every length, count, and conditional validator.
2. Write `prompts/lesson_v1.md` and the `PROMPT_VERSION` constant (SPEC §8.3). Embed the JSON Schema generated from the model.
3. Implement the `LLMProvider` protocol, `MockProvider`, and `AnthropicProvider`. Run `uv add anthropic`; the model and key come from env (SPEC §8.2).
4. Implement the generator: buffer fill, selection, generation, validation, the retry loop with error feedback, and the status transitions (SPEC §8.1, §8.4, §8.5).
5. Add the CLI: `uv run python -m daily_concept.generate --days-ahead N [--date D --force] [--provider mock|anthropic]`.
6. Add fixtures to `tests/fixtures/lessons/` covering valid, invalid-then-valid, and always-invalid cases.
7. Write tests: schema validators, the generator with `MockProvider` (all three fixture paths), and the non-zero exit code on failure.
8. Manual check (user runs this with a real key): generate 3 days and eyeball the quality. Tune the prompt if needed, and bump `PROMPT_VERSION` if it changes.
9. Cover today through today + N - 1. Claim a date/concept in a short transaction, then release it before any provider call. Use expiring ownership tokens, recover stale claims, reject stale writes, and retain failed-date reservations for retries. Reject force regeneration of completed lessons.
10. Copy `daily_concept/` and prompts into `backend/Dockerfile`. Add MVP scheduling instructions (systemd and cron, without activating jobs), relevant `.env.example` entries, and backup/restore guidance. Verify the generator and prompt files are available in the image.

**Done when:** mock generation works offline, tests pass, and one real generation run produces valid lessons.

---

## Phase 4 — API

1. Build a router at `/api/daily` with `GET /today`, `POST /lessons/{id}/complete`, `GET /history`, `GET /lessons/{id}`, and `GET /streak` (SPEC §12).
2. Redact answers and explanations on every uncompleted lesson-serving path, including replay. Reject future, failed, or pending-review lessons.
3. Validate the complete answer list before writing; grade server-side and atomically persist responses, completion, and streak under lesson/streak locks. Re-completion returns original grading without rewriting answers. Allow first completion of past lessons without affecting today's streak; completed replay is read-only.
4. Implement streak logic as a pure, tested function using `DAILY_TIMEZONE` (SPEC §10).
5. Put everything behind the feature flag, using the existing auth or dependency patterns.
   Add a credential-free runtime capability response for the frontend; test disabled endpoints and skipped startup sync. Document disabled behavior in MVP.
6. Write tests:
   - The happy path from today through completion to the streak
   - No answer leakage from `/today`
   - Idempotent re-completion
   - Streak transitions, including the timezone edge

**Done when:** the API tests pass and the endpoints are visible in the existing API docs (for example, FastAPI's `/docs`).

---

## Phase 5 — Frontend daily flow

1. Add the "Today" entry card to the home or dashboard.
2. Build the 5-step stepper (SPEC §13), reusing existing components and tokens:
   - Markdown rendering must be sanitized.
   - Code blocks get syntax highlighting.
   - Mermaid source renders as a diagram (add the library only if nothing existing handles it).
   - The quiz shows one question per screen and displays feedback after submission.
3. Build the completion screen with the streak update, and a history list with replay.
4. Handle loading, no lesson today, graph exhausted (offer history; daily reviews are deferred), already completed, and API error. Gate entry points on runtime capabilities. Collect the complete quiz before submission, show per-question feedback afterward, and unlock Link only after successful completion.
5. Check the layout at a 380px width.
6. Add tests: a render test of the stepper and one quiz interaction.
   Add Vitest, React Testing Library, and a DOM environment because no frontend runner exists. Run build/lint/tests and desktop/380px browser checks. Finish MVP operational and backup documentation before the checkpoint.

**Done when:** the full daily loop works end-to-end locally against generated lessons.

**MVP checkpoint:** verify all acceptance criteria in SPEC §16, and demo to the user.

---

## Phase 6 — Spaced repetition (v2)

1. Add the `review_cards` table.
2. Create a card whenever a daily lesson is completed.
3. Implement SM-2 as a pure function, along with the quality mapping (SPEC §11).
4. Add `GET /reviews/due` and `POST /reviews/{card_id}`.
5. Add a review section after the completion screen, capped at 3 cards.
6. Write tests: the SM-2 math against known reference values, due-card selection, and that reviews don't affect the streak.

**Done when:** a completed concept resurfaces on its due date and the review tests pass.

---

## Phase 7 — Knowledge map and admin (v2)

1. Add `GET /graph`, which returns nodes with a `learned`, `available`, or `locked` status, plus edges.
2. Build the knowledge map view with Cytoscape.js:
   - Use existing tokens for colors.
   - Clicking a learned node opens its lesson.
   - The view stays usable on a narrow screen.
3. Add admin endpoints (regenerate, approve), gated by both daily/admin flags and an actual loopback guard; document reverse-proxy limitations. Add approval support and update the existing MVP environment examples. Until this phase, reject unsupported approval configuration explicitly.
4. Reuse `DiagramPage` styling patterns without changing its glossary meaning. Daily map state represents curriculum prerequisites and learning progress.
5. Validate unattended scheduling for two nights on the approved target. Scheduling instructions, packaging, and backup guidance already belong to MVP Phases 3–5.

**Done when:** the map renders real progress, the timer runs generation unattended for 2+ nights, and the docs are complete.

---

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Existing Concept-Master models don't fit the spec cleanly | Phase 0 decides reuse/extend/add; record it in INTEGRATION_NOTES and adapt |
| LLM output drifts or fails validation | Strict schema, retry with error feedback, `failed` status, 3-day buffer |
| Lessons are confidently wrong | Prompt emphasizes accuracy; optional approval gate; easy `--force` regenerate |
| Lessons get repetitive | Domain rotation, `angle` seeds, prompt versioning so tuning is tracked |
| Streak bugs around midnight or timezones | Pure tested function with an explicit `DAILY_TIMEZONE` |
| Answers leak through the API | Dedicated response model plus a test asserting no leakage |
| Scope creep into a rewrite | Feature flag, isolated modules, and the "existing conventions win" rule |

## Definition of done (whole feature)

- All SPEC §16 criteria are met, and the v2 phases are complete or explicitly deferred.
- `uv run pytest` and the frontend tests pass.
- README section, `.env.example`, and `INTEGRATION_NOTES.md` are up to date.
- The feature flag cleanly disables everything.
