# SPEC — Daily Concept (feature for Concept-Master)

## 1. Summary

Add a **Daily Concept** feature to the existing Concept-Master app. Each day the user gets exactly one well-built lesson on a single concept (initial focus: tech, AI, coding), delivered as a ~5-minute flow: **Hook → Concept → See It → Check → Link**. Lessons are generated ahead of time by an LLM from a curated **concept graph**, validated against a strict schema, and cached. Streaks and spaced repetition keep the user coming back; a knowledge map shows progress.

This is a **bolt-on**, not a rewrite. It reuses Concept-Master's existing stack, design system, lesson/quiz UI, persistence layer, and conventions wherever they exist.

## 2. Guiding principles

1. **Integrate, don't duplicate.** If Concept-Master already has a concept, lesson, quiz, or progress entity, extend or map onto it. Only add new models where nothing fits. Integration decisions are recorded in `docs/daily-concept/INTEGRATION_NOTES.md` (created in Phase 0).
2. **Curated "what," generated "how."** The human-maintained concept graph decides *what* is taught and in what order. The LLM decides only *how* to teach a given concept.
3. **Never generate live.** Lessons are generated ahead of time by a scheduled job. Opening the app never waits on an LLM call.
4. **Schema or it didn't happen.** Every generated lesson is validated against a Pydantic schema before storage. Invalid output is retried, then rejected. Nothing unvalidated reaches the UI.
5. **Additive and reversible.** The whole feature sits behind a `DAILY_CONCEPT_ENABLED` flag and lives in its own module(s). Removing the flag restores the old app.
6. **Match the existing look.** Use Concept-Master's existing design tokens and components. Do not introduce a new palette or font.

## 3. Assumptions (verify in Phase 0)

- Backend is Python (likely FastAPI) and frontend is React. If the stack differs (for example, the Expo/React Native port has become the main client), adapt the file layout and keep the contracts in this spec.
- Python dependencies are managed with **uv** (`uv add ...`, `uv run ...`). Do not use pip or poetry.
- The database is SQLite unless Concept-Master already uses something else, in which case use that and its existing migration tooling.
- The app may be single-user. If it has a user model, key all per-user tables below by `user_id`.

## 4. Scope

### In scope (MVP)
- Concept graph file format, loader, and validator
- Seed set of ~30 concepts across tech, AI, and coding
- Daily concept selection algorithm
- Lesson schema and LLM generation pipeline (with a mock provider for tests)
- CLI entrypoint for generation, plus a documented scheduling option
- API endpoints for today's lesson, completion, history, and streak
- Frontend daily flow (5 steps) and completion screen
- Streak tracking

### In scope (v2, phases 6–7)
- Spaced repetition (SM-2) review questions
- Knowledge map view (Cytoscape.js)
- Admin regenerate and approve controls

### Out of scope
- Executing user or generated code in the browser
- Multi-user social features or leaderboards
- Push notifications (a later PWA or Expo concern)
- Topics outside tech, AI, and coding (the graph format supports them; content comes later)

## 5. Concept graph

### 5.1 Location and format
`content/daily_concepts/concepts.yaml`, one file, human-edited, version-controlled.

```yaml
- id: dns-resolution            # kebab-case slug, unique, stable forever
  title: How DNS resolution works
  domain: networking            # see 5.2
  tags: [dns, protocols, internet]
  difficulty: 2                 # 1 (intro) … 5 (advanced)
  prerequisites: [ip-addresses] # ids that must be taught first
  related: [tcp-handshake]      # soft links, used by the "Link" step
  angle: "Why typing a URL triggers a small worldwide scavenger hunt"  # optional hook seed
```

### 5.2 Domains (initial)
`networking`, `systems`, `security`, `ai-ml`, `python`, `web`, `data`, `software-engineering`, `hardware`. Keep this as an enum in code, and make adding a domain a one-line change.

### 5.3 Validation rules (enforced at load time and in tests)
- `id` is unique and matches `^[a-z0-9]+(-[a-z0-9]+)*$`
- Every `prerequisites` and `related` id exists
- The prerequisite edges form a DAG (no cycles); report the cycle path on failure
- `difficulty` is an integer from 1 to 5
- `domain` is a known enum value

On app start, the graph is synced into the `concepts` table: an upsert by `id`. Concepts removed from YAML are soft-deleted, never hard-deleted, because history references them.

### 5.4 Seed content
Phase 1 includes writing ~30 seed concepts, spread across all domains, with a sensible prerequisite structure: some roots at difficulty 1, and chains 3–4 deep.

## 6. Daily selection algorithm

Run once per date by the generator. The selection must be deterministic for a given date and state.

1. **Eligible** = active concepts that are not yet scheduled or taught, **and** whose prerequisites have all been taught.
2. **Score** each eligible concept:
   - +3 if its domain differs from both of the previous 2 days' domains
   - +2 if its difficulty is within ±1 of the user's recent average (the last 7 lessons; default 2)
   - +1 if it is `related` to something taught in the last 7 days
3. Choose the highest score. Break ties with a seeded RNG, where `seed = hash(date)`.
4. **Fallback:** if no concept is eligible, pick the lowest-difficulty untaught concept, ignoring prerequisites, and log a warning. If every concept has been taught, log "graph exhausted" and skip generation. The UI then shows a review-only day.

## 7. Lesson schema

Pydantic model `DailyLesson`, stored as JSON. Field limits are enforced by validators.

| Field | Type | Rules |
|---|---|---|
| `concept_id` | str | must exist |
| `hook` | str | 1–2 sentences, ≤ 280 chars, a question or surprising fact |
| `concept_md` | str | Markdown, 150–250 words |
| `analogy` | str | ≤ 400 chars, one concrete analogy |
| `see_it` | `SeeIt` | see below |
| `check` | list[`QuizItem`] | 2–3 items |
| `link` | `Link` | see below |
| `fun_fact` | str \| null | optional, ≤ 200 chars |

**`SeeIt`**
- `kind`: `code` \| `diagram` \| `table`
- `language`: str \| null, required when `kind=code`
- `content`: str. For code, ≤ 40 lines. For a diagram, Mermaid source. For a table, Markdown.
- `caption`: str, ≤ 200 chars

**`QuizItem`**
- `kind`: `mcq` \| `predict_output` \| `spot_the_bug`
- `prompt`: str
- `code`: str \| null, required for `predict_output` and `spot_the_bug`
- `options`: list[str], 3–4 items, unique
- `answer_index`: int, a valid index into `options`
- `explanation`: str, ≤ 400 chars, explains why the answer is right

Each lesson must include at least one item that is **not** `mcq`, provided the concept is coding-adjacent. The generator is told this, and a validator checks it when `domain in {python, web, software-engineering, data}`.

**`Link`**
- `previous_concept_id`: str \| null. Must be a concept already taught, if set.
- `connection`: str, ≤ 300 chars, explains how today's concept relates to that one
- `tomorrow_teaser`: str \| null, ≤ 160 chars. It is filled in only when tomorrow's concept is already selected, and set to null otherwise.

## 8. Generation pipeline

### 8.1 Entrypoint
```
uv run python -m daily_concept.generate --days-ahead 3
uv run python -m daily_concept.generate --date 2026-10-01 --force
```
- Keeps a buffer of `--days-ahead` scheduled lessons (default 3), running selection for each missing date.
- `--force` regenerates the lesson for a specific date.
- Exits non-zero if any date ends without a valid lesson.

### 8.2 Provider abstraction
- Define an `LLMProvider` protocol with a single method: `generate_lesson(concept, context) -> str (raw JSON)`.
- **`AnthropicProvider`**: the default. The model comes from the `DAILY_LLM_MODEL` env var (for example `claude-sonnet-5`; confirm the current model string in the Anthropic docs). The API key comes from `ANTHROPIC_API_KEY`.
- **`MockProvider`**: returns fixtures from `tests/fixtures/lessons/`, including deliberately invalid ones.
- If an Ollama or LM Studio provider is added later, it plugs into the same protocol. This is a nice-to-have, not MVP.

### 8.3 Prompt
Store the prompt in `daily_concept/prompts/lesson_v1.md`, and version it with a `PROMPT_VERSION` constant saved on every lesson. The prompt must:
- State the audience: a technically literate adult with an IT background who wants depth, not hand-holding.
- Set the tone: fun, clever, quick humor where it fits, and never cringe or padded.
- Pass in the concept's title, domain, tags, difficulty, `angle`, the titles of prerequisites already taught, and the related concepts taught recently. This lets the model write the Link step.
- Require **JSON only**, matching the schema, which is embedded as a JSON Schema generated from the Pydantic model.
- Tell the model to prefer accuracy over cleverness, avoid version-specific claims that may go stale, and never invent APIs.

### 8.4 Validation and retry
1. Parse the raw output, stripping any code fences first.
2. Validate it against `DailyLesson`.
3. If validation fails, retry up to 2 more times. Each retry appends the validation errors to the prompt ("Your previous output failed validation: …").
4. If it still fails, store a row with `status=failed` and the raw output for debugging, log an error, and continue with the other dates.

### 8.5 Lesson status
`scheduled` → `ready` → `published` → `completed`, with `failed` as a side state.
- `ready`: the lesson passed validation.
- `published`: the lesson's date is today or earlier. Set this lazily on read.
- Optional review gate: if `DAILY_REQUIRE_APPROVAL=true`, lessons stop at `pending_review` until approved through the admin endpoint. The default is false.

### 8.6 Scheduling
The pipeline is only a CLI. Document two deployment options in the README, and don't embed a scheduler in the web process unless Concept-Master already has one:
- A systemd timer + service unit (homelab), running nightly at 02:00 local time
- A cron line

## 9. Data model

Adapt names and types to the existing ORM and migration tooling. Add `user_id` to the per-user tables if the app has users.

- **`concepts`**: `id` (pk, slug), `title`, `domain`, `tags` (json), `difficulty`, `prerequisites` (json), `related` (json), `angle`, `active` (bool), `synced_at`
- **`daily_lessons`**: `id`, `concept_id` (fk), `scheduled_date` (date, unique), `status`, `payload` (json, nullable), `raw_output` (text, nullable), `prompt_version`, `model`, `attempts`, `created_at`, `completed_at`
- **`quiz_responses`**: `id`, `lesson_id` (fk), `item_index`, `selected_index`, `correct` (bool), `answered_at`, `source` (`daily` \| `review`)
- **`streaks`**: a single row (or one per user) with `current`, `longest`, `last_completed_date`
- **`review_cards`** (v2): `id`, `concept_id` (fk, unique per user), `easiness` (float, default 2.5), `interval_days` (int), `repetitions` (int), `due_date` (date), `last_reviewed_at`

## 10. Streaks

- A day counts as complete when the user submits answers to the Check step, regardless of score.
- The streak uses the local date from a `DAILY_TIMEZONE` setting (IANA, for example `America/New_York`). It never uses UTC.
- Completing on date D when `last_completed_date` is D−1 increments `current`. When it is D, nothing changes. Otherwise `current` resets to 1.
- `longest` equals `max(longest, current)`.
- Late completion is allowed: finishing a past lesson from history does **not** repair the streak. Streak freezes are v2+.

## 11. Spaced repetition (v2)

- Completing a daily lesson creates a `review_card` for its concept.
- **Quality score from the daily quiz:**
  - All correct: 5
  - One wrong: 3
  - More than half wrong: 1
- Update the card with standard SM-2, using `easiness` with a minimum of 1.3.
- **Each day, up to 3 due cards** appear as bonus review questions after the daily lesson. Each question is drawn from that concept's stored quiz items, rotating through them.
- Review answers are recorded with `source=review` and update the card. They do not affect the streak.

## 12. API

Prefix `/api/daily`, following the existing router and auth conventions.

| Method & path | Purpose |
|---|---|
| `GET /today` | Today's lesson payload + status + whether completed. 404 with a friendly body if none exists |
| `POST /lessons/{id}/complete` | Body: answers list. Returns per-item correctness, explanations, updated streak |
| `GET /history?limit&offset` | Past lessons (title, date, domain, score) |
| `GET /lessons/{id}` | Any past lesson (read-only replay) |
| `GET /streak` | current, longest, last_completed_date |
| `GET /reviews/due` (v2) | Up to 3 review questions |
| `POST /reviews/{card_id}` (v2) | Submit review answer |
| `GET /graph` (v2) | Nodes + edges + per-node status (`learned` \| `available` \| `locked`) |
| `POST /admin/regenerate/{date}` (v2) | Force regenerate (local-only / admin-guarded) |
| `POST /admin/approve/{id}` (v2) | Approve pending lesson |

Answers are checked **server-side**. The `/today` payload must not include `answer_index` or `explanation` until the lesson is completed.

## 13. Frontend

- **Entry point:** a prominent "Today" card on Concept-Master's home or dashboard, showing the concept title (or a hidden teaser if you prefer the surprise), the domain badge, and the streak count.
- **Daily flow:** a 5-step stepper with the steps **Hook → Concept → See It → Check → Link**.
  - Show progress dots, allow going back, and don't allow skipping ahead past Check.
  - Hook: show it large, and add a "tap to reveal" moment if it fits the design system.
  - See It: code gets syntax highlighting, Mermaid source renders as a diagram, tables render as tables. Nothing is ever executed.
  - Check: one question per screen. After submission, show correctness and the explanation.
  - Link: show the connection text, link to the previous lesson, then show the teaser.
- **Completion screen:** show the streak update with a small, tasteful celebration, then go to the reviews (v2) or back home.
- **History view:** a list of past lessons, each replayable.
- **Knowledge map (v2):** a Cytoscape.js graph. Nodes are colored by status, grouped or colored by domain, and clicking a learned node opens its lesson.
- Reuse existing components and design tokens throughout. Every screen must be usable at a 380px width.

## 14. Security and safety

- The API key lives only in the backend env. It never appears in the frontend bundle, logs, or `raw_output`.
- Rendered Markdown is sanitized, with no raw HTML passthrough.
- Generated code is displayed and never executed.
- Admin endpoints are disabled unless `DAILY_ADMIN_ENABLED=true`.

## 15. Testing

- **Unit:**
  - Graph validation: duplicate ids, missing references, cycles
  - The selection algorithm: determinism, domain rotation, fallback, graph exhaustion
  - Schema validators
  - Streak transitions, including across timezone boundaries
  - SM-2 math
- **Generator:** run with `MockProvider` covering a valid fixture, an invalid-then-valid retry, and all-invalid producing `failed`.
- **API:** the happy path from today → complete → streak. The `/today` payload must not leak answers.
- **Frontend:** use the existing test setup, with at least a render test of the stepper and one quiz interaction.
- CI or a local `uv run pytest` passes before each phase is marked done.

## 16. Acceptance criteria (MVP)

1. `concepts.yaml` with ~30 seeds loads and validates. Introducing a cycle fails loudly with the cycle path.
2. `uv run python -m daily_concept.generate --days-ahead 3` produces 3 `ready` lessons with a real API key, and works fully offline with `MockProvider`.
3. Opening the app shows today's lesson instantly, with no LLM call at request time.
4. Completing the flow records answers, updates the streak correctly, and reveals explanations.
5. History shows past lessons, and each can be replayed.
6. With `DAILY_CONCEPT_ENABLED=false`, the app behaves exactly as it did before the feature.
7. All tests pass.

## 17. Open questions (answer during Phase 0 or leave as a TODO)

- Does Concept-Master already have concept/lesson entities to map onto, or do we need the new tables?
- Is the Expo/React Native port the primary client now, or is it still the web app?
- Hosting target: homelab (systemd timer) or elsewhere?
- Should today's concept title be hidden until opened, as a surprise, or shown up front?
