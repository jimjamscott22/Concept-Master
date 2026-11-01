# Daily Concept integration notes

Date: 2026-11-01

Status: Phase 0 source review complete; awaiting approval before Phase 1.

These notes reconcile `docs/feature/SPEC.md` and `IMPLEMENTATION_PLAN.md`
with the current source. They describe proposed implementation decisions, not
completed feature work. No application code or database data was changed.

## 1. Source review and graph status

Reviewed `CLAUDE.md`, `README.md`, `pyproject.toml`, backend startup, schema,
database dependencies, term and review routers, test setup, frontend entry point,
API client, study UI, Markdown/code rendering, theme variables, and package scripts.

Neither `graphify-out/GRAPH_REPORT.md` nor `.graphify/GRAPH_REPORT.md` exists.
`graphify scope inspect . --scope auto` resolved to 427 committed files, with
10,420 ignored files excluded. A graph refresh was not run: this exceeds the
Graphify skill's 200-file threshold for selecting a narrower scope. No graph
edges were used as evidence. Direct source inspection is the basis for these
notes. A narrower backend/frontend graph can be generated separately if useful;
it is not required to implement the feature.

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

## 10. Specification ambiguities and proposed resolutions

1. **Determinism:** use a stable date-derived seed and sorted candidates. Python's
   built-in string hash is randomized between processes and does not meet the
   specified deterministic selection requirement.
2. **Buffer and prerequisites:** scheduled concepts are reserved and excluded
   from all selection paths, including fallback. Only completed concepts count
   as taught. Generating future dates does not mark prerequisites as learned.
   Log prerequisite fallback explicitly; never duplicate a reserved concept when
   the remaining graph is only scheduled.
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
- Defer full Graphify generation; use verified source files for integration.
- Branch creation and per-phase commits described by the attached plan are not
  treated as separate user authorization. This phase leaves a reviewable document
  in the current checkout; no branch, commit, or push was performed.
- Stop after these notes for review. Proposed next approval covers Phases 1–5
  (MVP), with phase-specific validation. Phases 6–7 remain explicitly deferred
  unless approved. Real-provider quality review and two nights of unattended
  scheduling cannot be claimed from offline/local checks.
