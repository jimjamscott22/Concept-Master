# Daily Concept integration notes

Date: 2026-11-02

Status: Phase 0 committed as `fd8577e`, Phase 1 as `6e90d2e`. Phases 2 and 3 are
approved and implemented, with offline checks passing; isolated MariaDB,
container execution, and real-provider validation remain outstanding. Phase 2/3
implementation is paused at this commit checkpoint at the user's request.
Phase 4 is not approved.

These notes reconcile `docs/feature/SPEC.md` and `IMPLEMENTATION_PLAN.md`
with the current source. Decisions below govern later phases; only the graph
loader, validator, seed curriculum, CLI, and tests are in Phase 1. No database
data is changed by Phase 1. The user subsequently approved Phases 2 and 3;
later phases require further approval.

## 1. Source review and graph status

Reviewed `CLAUDE.md`, `README.md`, `pyproject.toml`, backend startup, schema,
database dependencies, term and review routers, test setup, frontend entry point,
API client, study UI, Markdown/code rendering, theme variables, and package scripts.

The newly generated `.graphify/GRAPH_REPORT.md` records commit `fd8577e`, matching
HEAD at review: 398 included files from 428 candidates, 627 nodes, 1,380 edges,
39 communities, and 19 inferred edges. Branch metadata reports `stale: false`.
The report's UTC date is November 3 (November 2 locally). The expected
`.graphify/.graphify_runtime.json` proof file is absent, so TypeScript runtime
provenance is not confirmed. The graph provides orientation, not independent
proof of behavior; relevant persistence, startup, navigation, and rendering
decisions were checked against source. No inferred edge is relied on unverified.
The generated `.graphify/` directory is ignored and stays local. This graph is a
Phase 0 snapshot; it does not include the subsequent Phase 1 changes.

## 2. Stack and active client

- Backend: Python 3.12+, FastAPI, Pydantic 2, uv.
- Persistence: MariaDB/MySQL through `aiomysql`, with asynchronous direct SQL.
- Frontend: React 19, TypeScript, Vite, Tailwind CSS, SWR.
- Active client in this checkout: the web app under `frontend/`. No Expo client
  was identified in the reviewed project structure.

Use a root-level `daily_concept/` Python package, preserving the documented CLI
paths, and `frontend/src/daily/` for feature components and data hooks. Shared API
interfaces belong in `frontend/src/types/index.ts` by project convention.

## 3. Persistence and schema changes

`backend/database.py` loads root `.env`, creates an `aiomysql` pool, and exposes
`get_db` as a FastAPI dependency. The pool currently uses autocommit. Backend
routers use parameterized `%s` placeholders, not SQLite `?` placeholders.

There is no ORM or versioned migration tool identified. `backend/schema.sql`
contains idempotent creation statements and is applied by
`uv run python -m backend.database`. Pydantic API models live in
`backend/models.py`; SQL, rather than Python ORM classes, defines stored entities.

Recommendation: add the four MVP tables (`concepts`, `daily_lessons`,
`quiz_responses`, `streaks`) through additive SQL following the existing schema
initialization pattern. Keep v2 `review_cards` separate until Phase 6. Validate
initialization twice against an isolated fresh database and against an isolated
database containing the existing schema and representative data. Do not use the
personal development database as a migration test fixture.

Daily completion must use an explicit transaction and row locking so retries or
concurrent requests cannot duplicate responses or increment a streak twice.
Generation also needs a unique date constraint and a claim/update strategy to
prevent overlapping scheduled jobs from overwriting each other's lessons.
Use an expiring generation claim with an ownership token. Reserve the date and
concept atomically, release the transaction before calling the provider, and
conditionally save only if the claim is still owned and unexpired. Recovery
reclaims expired jobs; failed-date retries retain their concept reservation.
Prevent two dates from reserving the same concept. Force regeneration reuses
the uncompleted lesson's concept and cannot overwrite a completed lesson.

Validate the entire answer list before writes. Lock the lesson and singleton
streak row in a consistent order, then persist responses, completion, and streak
in one transaction. Add a unique daily response key on lesson/item. Re-completion
returns the original recorded grading and current streak without replacing
answers. Different lessons must also serialize updates to the streak row.

## 4. Reuse, extend, or add

| Existing entity | Role | Daily Concept decision |
| --- | --- | --- |
| `terms`, categories, tags, related terms | Editable glossary backed by Markdown files | Preserve; curated daily graph has stable IDs and prerequisites with different semantics |
| `articles` and joins | Long-form reference content | Preserve; no scheduling, validated lesson payload, or quiz lifecycle |
| `term_reviews` | Per-term flashcard scheduling | Preserve; foreign keys require glossary terms, and the algorithm is SM-2 lite |
| `review_sessions` | Counts, streak/heatmap for glossary review | Preserve; daily quiz completion has separate timezone and streak rules |

Add daily-specific tables instead of changing the meaning of existing records.
There are study quiz components, but no stored daily lesson or quiz-response
entity in the reviewed schema. Avoid automatically creating glossary terms from
daily concepts: similar titles do not establish identical content or identity.

YAML remains authoritative for the curated graph. Generated lessons and personal
progress are database state, unlike the rebuildable glossary index; deployment
docs must identify those tables as data to back up. Removed graph nodes become
inactive while lesson history remains intact.
Snapshot title and domain with generated lessons so YAML edits do not rewrite
historical metadata; stored lesson payloads already preserve lesson text.

## 5. Users and authorization

The reviewed schema has no user table, and the registered routers have no
authentication dependency. Treat this as the current single-user application;
do not invent a multi-user account system or `user_id` columns.

Reuse `get_db` and normal FastAPI error responses. Gate daily functionality with
`DAILY_CONCEPT_ENABLED`, default false. The frontend needs a small server-provided
capability response to discover the runtime flag; a build-time Vite flag alone
cannot track backend configuration. When disabled, hide daily navigation, skip
daily startup sync, and leave daily endpoints unavailable. The capability
response must expose no provider credentials.

For v2 admin routes, `DAILY_ADMIN_ENABLED` is necessary but not authentication.
Use an actual loopback-only guard in addition to both flags for the local app,
and document reverse-proxy limitations. Do not enable admin routes on a public
deployment based solely on an environment flag.

## 6. Design system and reusable UI

`frontend/src/styles/globals.css` defines theme variables. Tailwind tokens include
`bg`, `bg2`, `bg3`, `line`, `fg`, `fg2`, `fg3`, `accent`, `accent2`, `codeBg`, and
tag colors. `useUiPrefs` selects midnight, paper, sepia, ocean, and contrast themes
and hybrid/mono typography. Use existing tokens and fonts throughout.

- `Layout`, `Sidebar`, and existing panels provide navigation/layout patterns.
- `StudyPanel` provides one-question-at-a-time state and feedback patterns, but
  grades locally; its grading logic cannot be reused for generated lessons.
- `TermDetail` uses `react-markdown` with `remark-gfm`, and a local `CodeCard`
  backed by `prism-react-renderer` and `conceptMasterPrismTheme`.
- `Flashcard`, `ReviewPanel`, and `EmptyState` provide useful interaction and
  loading/empty-state patterns. There is no existing five-step lesson stepper.
- No Mermaid or Cytoscape dependency exists in `frontend/package.json`.
- `DiagramPage` already groups glossary terms as category chips. Reuse its visual
  patterns in v2, but retain its existing glossary semantics; it does not model
  daily prerequisites or learned/available/locked curriculum state.

Build a small daily stepper and reuse the renderer patterns. Markdown must omit
raw HTML passthrough. Mermaid needs strict security settings and sanitization of
its resulting SVG before insertion. Code is displayed only. Extract a shared
code component only if it reduces real duplication without a broad refactor.

## 7. Routing and API contracts

`backend/main.py` registers `APIRouter` instances under `/api/...`.
Add daily routes under `/api/daily` using the same dependency conventions.

`frontend/src/App.tsx` navigates using a `View` union and component state; there
is no React Router dependency. Extend that navigation for today/history and,
later, the knowledge map. Keep the feature implementation in its own folder.
Use the existing `/api` client pattern and SWR/custom hooks for fetching.

Before completion, redact answers and explanations from every lesson-serving
path, including lesson replay and review questions. Restrict replay to dates
that have arrived; future ready lessons and approval-pending lessons must not be
exposed through guessed IDs. Completed replay may include grading feedback.
Allow first completion of an unfinished past lesson; completed replay is
read-only. Late completion never changes today's streak.

## 8. Testing and CI

- Backend: `uv run pytest`, configured in `pyproject.toml`.
- `tests/conftest.py` uses FastAPI `TestClient`; its client fixture runs the app
  lifespan and expects a separate MariaDB database. `DB_NAME` is set with
  `setdefault`, so isolation must be checked explicitly rather than assumed.
- Pure graph, selection, schema, and streak tests should not require a database.
- API/migration checks require an available isolated MariaDB instance. Report
  them as blocked if unavailable; mocks do not prove SQL compatibility.
- Frontend currently has build and lint scripts, but no test runner. Add Vitest,
  React Testing Library, and a DOM environment for the required component tests.
- Run `npm run build`, `npm run lint`, component tests, and browser checks of the
  full daily flow at desktop and 380px widths when frontend work is implemented.
- `git ls-files .github` returned no tracked files; no GitHub Actions workflow
  was identified. Do not add unrelated CI infrastructure during this feature.

Phase 0 is documentation-only: no runtime tests were run, and database or real
LLM connectivity has not been verified. Implement first, then add focused tests;
do not introduce test-first or parallel-agent workflows.

## 9. Background work and deployment

No background scheduler was identified in the inspected backend. Startup can
sync glossary/articles when `SYNC_ON_START=1`; this is not a generation schedule.
Daily generation remains a CLI, never a web-request LLM call. Document systemd
and cron as deployment options; do not install or activate scheduled jobs as part
of implementation. Hosting is not confirmed. Default lesson timezone to
`America/New_York` and allow explicit override through `DAILY_TIMEZONE`.

Windows development may require the `tzdata` dependency for IANA timezone data.
Systemd units are Linux deployment artifacts, not local Windows services.
Scheduling instructions, environment examples, backup/restore guidance, and
disabled-feature behavior are MVP documentation, completed across Phases 3–5.
Add `daily_concept/`, including prompt files, to `backend/Dockerfile` in Phase 3:
the current image copies only `backend/` and `content/`. Do not change the image
in Phase 1, before the generator exists.

## 10. Specification ambiguities and proposed resolutions

1. **Determinism:** use a stable date-derived seed and sorted candidates. Python's
   built-in string hash is randomized between processes and does not meet the
   specified deterministic selection requirement.
2. **Buffer and prerequisites:** scheduled concepts are reserved and excluded
   from all selection paths, including fallback. Only completed concepts count
   as taught. Generating future dates does not mark prerequisites as learned.
   Log prerequisite fallback explicitly; never duplicate a reserved concept when
   the remaining graph is only scheduled.
   Pass `reserved` explicitly to selection. The default three-day buffer covers
   today through today + 2 in `DAILY_TIMEZONE`. Distinguish all-taught exhaustion
   from temporary reservation saturation. With daily reviews deferred, MVP's
   exhausted state offers history rather than promising a review-only feature.
3. **Late completion:** record answers and completion for history, but change
   streak state only when the lesson's scheduled date equals today's date in
   `DAILY_TIMEZONE`. A late lesson neither repairs nor starts today's streak.
4. **Quiz feedback:** collect answers one question per screen, then submit the
   complete quiz once to the specified completion endpoint. Show per-question
   feedback after that submission; this avoids adding an unplanned grading API
   or exposing answers in advance. Block Link until successful completion.
5. **Stale streak display:** when the last completion precedes yesterday, report
   an effective current streak of zero; retain longest and last completion.
6. **Generation safety:** default to no implicit paid calls during tests or app
   startup. Real generation is a separate manual check using the user's key.
   Resolve a supported Anthropic model from official documentation during
   provider implementation rather than adopting the spec's example model name.
7. **Force regeneration:** reject overwriting completed lessons so quiz history
   continues to correspond to the stored questions. Regeneration of uncompleted
   dates preserves the one-lesson-per-date constraint.
8. **Approval gate:** while v2 admin approval is deferred, reject an unsupported
   approval configuration explicitly rather than silently publishing lessons.
9. **v2 quality mapping:** apply “more than half wrong” before “one wrong” when
   determining SM-2 quality, then all-correct=5 and otherwise=3. This yields an
   unambiguous result for every two- or three-question quiz.
10. **Entry card:** show today's title up front in a Today card within the current
    browse shell; no new dashboard or surprise interaction is necessary.

## 11. Deviations and approval boundary

- Use existing MariaDB/direct SQL and schema initialization instead of SQLite,
  an ORM, or a newly introduced migration framework.
- Reuse UI/rendering patterns, but keep daily progress distinct from glossary
  flashcard progress because their identities and rules differ.
- Add a minimal runtime capability contract and frontend test setup because
  neither currently exists for this feature.
- Use the existing Phase 0 Graphify snapshot with source verification; do not
  regenerate or commit local graph output as part of Phase 1.
- Branch creation and per-phase commits described by the attached plan are not
  treated as separate user authorization. This phase leaves a reviewable document
  in the current checkout; no branch, commit, or push was performed.
- Initial approval covered these revisions and Phase 1 only. Implement graph validation
  and the CLI first, then focused tests; Pydantic and PyYAML already exist.
  Database sync moves entirely to Phase 2 alongside its tables. Stop after Phase
  1 validation and report results before requesting the next phase. Phases 6–7
  remain deferred. Real-provider quality review and two nights of unattended
  scheduling cannot be claimed from offline/local checks.

The user subsequently requested committing Phase 1 and beginning Phase 2. This
authorized Phase 2 implementation. The later request to continue Phase 3 approved
generation implementation while carrying the unresolved database gate forward.
No paid provider call or production database mutation was performed in this work.

## 12. Phase 1 implementation and verification

- Added `daily_concept/graph.py`: `ConceptDef`, domain enum, YAML loading,
  ID/reference validation, prerequisite DAG checks with cycle paths, and a
  `validate` CLI. It imports neither database code nor provider code.
- Added 30 seeds in `content/daily_concepts/concepts.yaml`, covering all nine
  domains with seven introductory roots and prerequisite chains four concepts
  deep. Related links may form cycles; prerequisite links may not.
- The CLI reports domain/difficulty counts and sorted roots. A custom file may
  be checked with `uv run python -m daily_concept.graph validate --path FILE`;
  malformed input or missing files return exit code 1 with a readable error.
- Validation passed on the seed file. All 32 graph tests passed, including
  duplicate IDs, missing prerequisite/related references, cycles, invalid fields,
  malformed YAML, CLI failures, and a working-directory-independent default path.
- The graph tests plus existing term/article content loader/writer tests passed:
  59 tests total. `git diff --check` passed and `git check-ignore` confirmed the
  local `.graphify/GRAPH_REPORT.md` is ignored.
- This sandbox denied writes to uv's default interpreter cache. Checks used
  `uv --cache-dir .venv/uv-cache run ...`, keeping the cache in ignored `.venv/`.
- No full database-backed suite, schema initialization, browser, container, or
  real-provider checks were run. No database access, startup wiring, generation,
  frontend changes, dependency additions, or Phase 2 implementation occurred.

## 13. Phase 2 implementation and validation boundary

- Added four additive tables to `backend/schema.sql`: concepts, daily lessons,
  quiz responses, and a singleton streak row. The schema defines date/concept
  uniqueness, claim token/expiry metadata, historical title/domain snapshots, and
  unique daily answers. Repeated v2 review attempts can coexist via a nullable
  generated daily-item key. Claim acquisition/recovery belongs to Phase 3;
  response grading and streak updates belong to Phase 4.
- `daily_concept/sync.py` validates the full YAML before database acquisition,
  reconciles concepts in a transaction, rolls back failures, and soft-deletes
  removed nodes. Lesson snapshots and progress are never rewritten by sync.
  IDs now have a 255-character maximum matching the stored key.
- Startup calls sync only when `DAILY_CONCEPT_ENABLED` is true (also accepting
  1/yes/on), independently of `SYNC_ON_START`. It defaults off. The daily import
  is lazy, preserving disabled startup before Phase 3 container packaging.
  Pool cleanup now runs even when startup sync raises an error.
- `daily_concept/selection.py` is a pure function over the current active graph,
  taught IDs, reserved IDs, and lesson metadata. SHA-256 of the date seeds local
  RNG tie-breaking over sorted IDs. Difficulty uses the last seven lessons
  scheduled before the target date; domain rotation checks the preceding two
  calendar dates. Relation scoring uses actual completion dates in the preceding
  seven days, including late completions of older lessons. Callers must supply
  valid lesson metadata (excluding failed generation rows).
- Both normal and fallback paths exclude reservations. Exhaustion and temporary
  reservation saturation have different log messages. No lesson is marked taught
  by scheduling it; prerequisite fallback is logged explicitly.
- Offline tests cover selection/scoring, reservation fallback, sync transaction
  handling, flag gating, and startup-failure pool cleanup. Mocked sync/startup
  checks do not establish MariaDB SQL compatibility.
  The daily tests plus existing term/article loader/writer regression tests report
  84 passed and 2 skipped. Seed validation and `git diff --check` also pass.
- Opt-in integration tests in `tests/test_daily_concept_database.py` create/drop
  only randomly named disposable databases. They apply schema twice on fresh and
  representative existing-schema databases, check preserved glossary data,
  idempotent sync, soft deletion/history, JSON storage, and uniqueness constraints.
  They require explicit `DAILY_TEST_DB_HOST`, `DAILY_TEST_DB_USER`, and
  `DAILY_TEST_DB_PASS` (optional `DAILY_TEST_DB_PORT`, default 3306), with permission
  to create/drop disposable databases. They never fall back to application DB
  settings. Run with `uv run pytest tests/test_daily_concept_database.py -q`.
- Isolated database checks remain blocked: Docker's Linux engine is not running,
  no native MariaDB executable was found in PATH, and no dedicated test-server
  credentials are configured. The two opt-in cases are skipped. No development
  database was accessed or modified, and Phase 2's database acceptance gate has
  not passed. No generation, provider, frontend, browser, or image checks ran.

## 14. Phase 3 implementation and verification

- Added strict Pydantic lesson/visual/quiz/link models with length, word, sentence,
  option, index, code, coding-domain, taught-link, and teaser-context checks.
  Factual quality and semantic requirements such as a concrete analogy remain
  human-review items; mechanical validation cannot prove them.
- Added `prompts/lesson_v1.md`, JSON Schema/context embedding, and persisted
  `PROMPT_VERSION`. Invalid output receives validation feedback without input
  values, and is retried up to three attempts. Final invalid output is redacted
  before failure storage; provider exception bodies are not retained or logged.
- Added async `LLMProvider`, fixture-backed `MockProvider`, and `AnthropicProvider`
  using the official SDK. `uv add anthropic tzdata` updated dependencies/lockfile.
  The model is explicitly required from `DAILY_LLM_MODEL`. The example model
  `claude-sonnet-5-5` was checked against
  <https://platform.claude.com/docs/en/models/overview>; SDK usage was checked
  against the official Python documentation. No real request was made.
- The CLI fills today through today + N - 1, validates settings before database
  access, syncs the graph, reserves each date/concept, and writes `ready` only
  after validation. Existing valid lessons are skipped. Failed dates keep their
  reservation. Forced replacement retains the concept and rejects completed
  lessons. Exhaustion, saturation, active competing claims, or invalid output
  produce a non-zero exit if a requested date lacks a valid lesson.
- MariaDB claim transactions take the singleton streak lock before lesson locks,
  then end before provider requests. Phase 4 must use the same lock order.
  Five-minute claims and ownership/expiry predicates prevent stale workers from
  saving. Crashed claims can be reclaimed on a later run. Transport retries are
  off; each call is bounded by a 60-second SDK timeout and 65-second async timeout.
- `--provider mock --dry-run` is a deliberate CLI adaptation: it exercises the
  buffer/selection/validation/retry flow in disposable memory without MariaDB or
  paid calls. Mock fixtures are not curriculum-accurate for arbitrary concepts
  and cannot be persisted by the CLI. Paid dry runs are refused.
- Backend Docker packaging now includes the daily package, prompts, and offline
  fixtures. Compose passes daily environment settings and mounts daily source.
  `.dockerignore` excludes the local graph output. Added `.env.example` entries
  and `OPERATIONS.md`, linked from README, with scheduling, backup/restore,
  disabled behavior, container checks, and manual-provider review instructions.
  No schedule or service was installed or activated.
- Verification: 144 focused tests passed and three isolated MariaDB cases skipped.
  The actual CLI passed a three-day offline buffer and invalid-then-valid retry
  (two attempts); always-invalid exited 1 as expected. `uv lock --check`,
  `docker compose config --quiet`, and `git diff --check` passed.
- Docker's Linux engine remains unavailable, so image build/execution was not
  verified. Fresh/existing MariaDB schema tests plus the new SQL claim-recovery
  test require dedicated isolated credentials and remain skipped. Unit tests of
  disposable state do not prove SQL locking/concurrency. No development database
  was accessed. Real generation of three lessons, human quality review, and
  unattended scheduling remain unverified; Phase 3's full acceptance gate is
  therefore still open. No Phase 4 API or frontend work was started.

## 15. Paused checkpoint

The user requested committing the Phase 2/3 work and pausing. Final focused
verification reported 144 passed and three isolated MariaDB cases skipped;
`git diff --check` passed. No paid provider call, development database mutation,
or deployment occurred. Resume from the outstanding MariaDB/container/provider
validation gates documented above before treating Phases 2/3 as fully accepted.
No further implementation is authorized by this pause request.
