# Daily Concept generation and operations

Phase 3 provides generation and persistence, not the daily API or UI (Phases 4–5).
Phase 2/3 MariaDB checks, container execution, and real-provider quality review
must pass before deployment is considered verified.

## Offline checks

From the repository root, install locked dependencies with `uv sync`, then run:

```powershell
uv run python -m daily_concept.graph validate
uv run python -m daily_concept.generate --provider mock --dry-run --days-ahead 3
uv run python -m daily_concept.generate --provider mock --dry-run --mock-scenario invalid-then-valid
uv run python -m daily_concept.generate --provider mock --dry-run --mock-scenario always-invalid
```

The last command deliberately exits 1. Mock generation uses disposable memory,
requires no MariaDB or provider key, and writes no lessons. Fixtures are contract
examples, not accurate curriculum lessons for every selected concept. For that
reason `--provider mock` requires `--dry-run`, and paid dry runs are rejected.
In restricted Windows environments, use `uv --cache-dir .venv/uv-cache run ...`
if uv's normal interpreter cache is inaccessible.

## Persistent generation and manual quality check

Use the repository-root `.env` (or process environment), following `.env.example`:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`: the intended MariaDB database.
- `DAILY_CONCEPT_ENABLED=true`: explicit opt-in to startup sync and persistent generation.
- `DAILY_TIMEZONE=America/New_York`: IANA timezone; `tzdata` supports Windows too.
- `DAILY_LLM_MODEL`: required; choose a model enabled for your provider account.
- `ANTHROPIC_API_KEY`: backend-only secret, never passed in prompt text.
- `DAILY_REQUIRE_APPROVAL=false`, `DAILY_ADMIN_ENABLED=false`: v2 support is deferred.

The example `claude-sonnet-5-5` was verified against the
[official Anthropic model list](https://platform.claude.com/docs/en/models/overview).
It is an explicit example, not a silently selected default or a guarantee of
account access. Requests use the [official Python SDK](https://platform.claude.com/docs/en/api/sdks/python),
with transport retries disabled and a bounded three-attempt generation loop.

Initialize the additive schema deliberately against your chosen database before
enabling the feature. This changes schema and adds the singleton streak row:

```powershell
uv run python -m backend.database
uv run python -m daily_concept.generate --days-ahead 3
```

The second command makes paid provider calls. Do not run it as an offline test.
It fills today, tomorrow, and the following day according to `DAILY_TIMEZONE`.
Existing valid lessons are skipped. Failures retain the selected concept for a
later retry. A non-zero exit means at least one requested date lacks a valid
lesson, including exhaustion, saturation, or another worker owning the date.

Review the three stored `ready` payloads for accuracy, pacing, analogies, code,
quiz correctness, and contextual links. Schema validation checks structure,
counts, references, and conditional fields; it cannot prove factual accuracy,
that an analogy is concrete, or that a hook is surprising. Hook sentence counting
is punctuation-based; Markdown word counting uses whitespace-delimited tokens.

```powershell
uv run python -m daily_concept.generate --date 2026-11-02 --force
```

Force requires a date, retains that lesson's concept, and rejects completed
lessons. It clears the old uncompleted payload while regenerating, so a failed
replacement is a failed lesson rather than an old lesson marked ready. The CLI
supports 1–30 buffer days and refuses unsupported approval configuration.
`ready` is written only after validation; later API reads will handle publication
by date, and quiz completion belongs to Phase 4.

## Claims, failures, and retention

Reservation transactions take the singleton streak lock before lesson locks.
Future completion code must use this same lock order. Date/concept uniqueness
prevents duplicate curriculum reservations. Transactions end before provider
requests. Each claim lasts five minutes, covering three attempts of at most 65
seconds each; the SDK request timeout is 60 seconds. Crashed jobs are reclaimable
after expiry. A replaced or expired owner cannot save either success or failure.
After a crash, rerun the CLI once the claim expires; do not clear claims manually.

Failures store only the final redacted invalid output, if one exists. Provider
exception bodies and credentials are not logged or stored. Retry feedback omits
the validation input. Prompt version, model, and attempts are retained per lesson.
Disabling the feature skips daily startup sync and refuses persistent generation;
it does not remove data. The disposable mock CLI remains available.

## Container packaging

The backend image includes `daily_concept/`, its versioned prompt, and offline
lesson fixtures. Compose passes the daily settings and mounts the daily source
alongside the existing backend/content development mounts. When Docker is
available, rebuild and verify offline behavior before any real generation:

```sh
docker compose build backend
docker compose run --rm --no-deps backend python -m daily_concept.generate --provider mock --dry-run --days-ahead 3
```

This override bypasses Compose's normal schema-initialization command; the dry
run makes no database connection. Persistent generation uses the normal backend
database environment. Verify the target before running it.

## Scheduling options (examples only; nothing is installed or activated)

Choose one scheduler on a Linux deployment. These examples assume the machine's
timezone equals `DAILY_TIMEZONE` and run at 02:00 local time. Confirm the host
timezone, service account, repository location, and absolute uv path first.
Example paths below assume `/opt/concept-master` and `/usr/local/bin/uv`; replace
them with the actual paths (`command -v uv`). Windows development uses the CLI
directly, not systemd.

Example `/etc/systemd/system/daily-concept-generate.service`:

```ini
[Unit]
Description=Generate buffered Daily Concept lessons
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
User=YOUR_SERVICE_USER
WorkingDirectory=/opt/concept-master
EnvironmentFile=/opt/concept-master/.env
ExecStart=/usr/local/bin/uv run --frozen python -m daily_concept.generate --days-ahead 3
```

Example `/etc/systemd/system/daily-concept-generate.timer`:

```ini
[Unit]
Description=Generate Daily Concept lessons nightly

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true
Unit=daily-concept-generate.service

[Install]
WantedBy=timers.target
```

Alternatively, a crontab entry for the deployment account:

```cron
0 2 * * * cd /opt/concept-master && /usr/local/bin/uv run --frozen python -m daily_concept.generate --days-ahead 3 >> /opt/concept-master/daily-concept.log 2>&1
```

The CLI loads the root `.env` for cron; the service loads it explicitly too.
Keep the file readable only by the deployment account. Confirm syntax is valid
for both dotenv and systemd, using plain `NAME=value` entries. Schedule behavior
around DST follows the chosen scheduler; the buffer reduces dependence on one
night's run. Checking two unattended nights remains a deployment acceptance task.

## Backup and restore

YAML rebuilds only the curriculum definition. Back up the entire application
database, including `concepts`, `daily_lessons`, `quiz_responses`, and `streaks`;
generated lessons and progress cannot be rebuilt from the glossary. Preserve
the repository's prompt version and schema alongside the database backup.

Example consistent InnoDB dump (password requested interactively):

```sh
mariadb-dump --single-transaction -u YOUR_DB_USER -p YOUR_DB_NAME > concept-master-backup.sql
```

Stop generation and application writes before restoring. First restore the dump
into a new isolated database, check lesson payloads/counts and progress, and then
choose the production cutover deliberately. Example restore into a pre-created
empty verification database:

```sh
mariadb -u YOUR_DB_USER -p RESTORE_VERIFICATION_DB < concept-master-backup.sql
```

Do not test restore against the personal development database. A successful dump
command alone does not verify recovery.

## Isolated database test gate

Set explicit `DAILY_TEST_DB_HOST`, `DAILY_TEST_DB_USER`, `DAILY_TEST_DB_PASS`, and
optionally `DAILY_TEST_DB_PORT` (default 3306), pointing to an isolated MariaDB
server. The test account must create/drop disposable databases. Tests use random
database names and never fall back to the application's DB settings:

```powershell
uv run pytest tests/test_daily_concept_database.py -q
```

These cover fresh/existing schema initialization, sync/history retention, and
generation claims. Missing dedicated settings cause skips, not evidence of SQL
compatibility. Live provider and container checks remain separate.
