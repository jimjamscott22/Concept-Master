# Markdown-as-Source-of-Truth for Glossary Content

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "edit `seed.sql` and re-seed" workflow with a content directory of one Markdown file per term. Files are the authoritative source; the MariaDB database becomes a rebuildable search index. Adding a term = creating a file; editing = editing the file; git tracks history.

**Non-goals:** Does not remove the CRUD API. POST/PUT/DELETE endpoints keep working for in-app editing, but writes also persist back to the corresponding `.md` file so files and DB stay coherent.

---

## Design Overview

### Content directory layout

```
content/
├── terms/
│   ├── abstract-data-type.md
│   ├── binary-search-tree.md
│   └── …
├── categories.yml           # canonical category list (name + slug)
└── tags.yml                 # canonical tag list (optional; tags can also be implicit)
```

Filename is the slug. One file per term.

### Term file format

```markdown
---
name: Abstract Data Type (ADT)
categories: [data-structures, java]
tags: [exam-review, interview-prep]
related: [stack, queue, linked-list]
code_lang: java
is_favorite: false
---

An abstract data type defines a data model and the operations allowed on it…

Example ADTs include List, Stack, Queue, Set, and Map.

```java
import java.util.ArrayList;
import java.util.List;

List<Integer> numbers = new ArrayList<>();
numbers.add(10);
```
```

**Rules:**
- YAML frontmatter is metadata. Markdown body is the `definition`.
- The **first fenced code block** in the body becomes `example_code`; `code_lang` comes from frontmatter (or the fence info-string as fallback).
- `related` references other files by slug. Missing slugs are logged as warnings, not errors.
- `categories` and `tags` are slug lists. Unknown categories = error (must exist in `categories.yml`); unknown tags = auto-created.

### Sync semantics

A single command `sync_content` performs a full reconciliation:

1. Read all files under `content/`.
2. Upsert categories from `categories.yml` (name + slug).
3. For each term file:
   - Parse frontmatter + body.
   - Upsert into `terms` by slug (INSERT … ON DUPLICATE KEY UPDATE).
   - Replace `term_categories`, `term_tags`, `related_terms` for that term.
4. Delete terms whose slug no longer has a file (opt-in flag `--prune`, default off for safety).
5. Print a summary: N inserted, M updated, K deleted, W warnings.

Idempotent. Safe to run repeatedly. No DB drop needed.

### Write-back (keep CRUD API working)

When `POST/PUT/DELETE /api/terms` succeeds, the router writes the corresponding `.md` file to disk (create / overwrite / delete). This keeps the file tree in sync with in-app edits, so git-diffing after a session shows what changed. If file write fails, the DB change is rolled back (transaction + fs write in one try block).

### Startup behavior

`main.py` lifespan runs `sync_content()` once at boot in dev mode (gated by env var `SYNC_ON_START=1`). Prod/manual mode: run `uv run python -m backend.sync_content` explicitly.

---

## File Map

### Backend (new)
| Path | Purpose |
|------|---------|
| `backend/content_loader.py` | Parse `.md` files → dataclass; slug from filename; extract first fenced code block |
| `backend/content_writer.py` | Serialize a term record back to `.md` with canonical frontmatter ordering |
| `backend/sync_content.py` | CLI entrypoint + `sync_content()` async function; full reconciliation logic |
| `content/categories.yml` | Canonical category list |
| `content/terms/*.md` | One file per term (migrated from `seed.sql`) |
| `scripts/migrate_seed_to_content.py` | One-shot: read current DB or `seed.sql`, emit `.md` files into `content/terms/` |

### Backend (modify)
| Path | Change |
|------|--------|
| `backend/requirements.txt` | Add `python-frontmatter`, `pyyaml` |
| `backend/main.py` | Lifespan calls `sync_content()` when `SYNC_ON_START=1` |
| `backend/routers/terms.py` | After each mutating endpoint succeeds, call `content_writer` to persist the `.md` file; on delete, unlink the file |
| `backend/database.py` | Keep `init_db` (schema only); remove seed.sql execution from init path |
| `backend/seed.sql` | Delete (or keep as historical reference, marked deprecated in a header comment) |

### Tests (new)
| Path | Purpose |
|------|---------|
| `tests/test_content_loader.py` | Parses valid files, rejects bad frontmatter, extracts code blocks correctly |
| `tests/test_content_writer.py` | Round-trips: load → write → load produces identical record |
| `tests/test_sync_content.py` | Fresh DB + content dir → correct rows; re-run is idempotent; `--prune` removes orphans; warnings for missing `related` slugs |
| `tests/test_terms_writeback.py` | POST/PUT/DELETE via API writes/updates/removes the `.md` file |

### Docs (modify)
| Path | Change |
|------|--------|
| `CLAUDE.md` | Update "Phase Build Order" and Development Commands to mention `sync_content`; note that `content/` is the source of truth |
| `README.md` | Replace the "initialize DB" step with: `uv run python -m backend.sync_content` |

---

## Task Breakdown

### Phase 1 — Content loader + writer (no DB yet)

- [ ] Add `python-frontmatter` and `pyyaml` to `backend/requirements.txt`; `uv sync --group dev`
- [ ] Implement `backend/content_loader.py`:
  - [ ] `@dataclass TermFile` with fields matching the terms table + `categories: list[str]`, `tags: list[str]`, `related: list[str]`
  - [ ] `load_term(path: Path) -> TermFile` — parses frontmatter, pulls body as `definition`, extracts first fenced code block into `example_code`
  - [ ] `load_all_terms(root: Path) -> list[TermFile]`
  - [ ] `load_categories(path: Path) -> list[Category]`
- [ ] Implement `backend/content_writer.py`:
  - [ ] `write_term(term: TermFile, root: Path)` — writes `<root>/terms/<slug>.md` with canonical frontmatter field order
  - [ ] `delete_term(slug: str, root: Path)` — `unlink(missing_ok=True)`
- [ ] Tests: `tests/test_content_loader.py`, `tests/test_content_writer.py` (round-trip)

### Phase 2 — Sync command

- [ ] Implement `backend/sync_content.py`:
  - [ ] `async def sync_content(pool, content_root: Path, prune: bool = False) -> SyncReport`
  - [ ] Upsert categories from `categories.yml`
  - [ ] For each term file: upsert term row, replace join-table rows in a single transaction
  - [ ] Resolve `related` slugs → ids; skip + warn on unknown
  - [ ] If `--prune`: delete DB terms whose slug has no file
  - [ ] `if __name__ == "__main__"`: argparse `--prune`, print `SyncReport`
- [ ] Tests: `tests/test_sync_content.py` — fresh DB, re-run idempotency, prune behavior, missing-related warnings

### Phase 3 — Migrate existing seed data

- [ ] Write `scripts/migrate_seed_to_content.py`:
  - [ ] Reads current MariaDB (or parses `seed.sql`)
  - [ ] Emits one `.md` per term into `content/terms/`
  - [ ] Emits `content/categories.yml`
- [ ] Run it once; commit `content/` to the repo
- [ ] Manually spot-check 3–5 files — frontmatter correct, code blocks preserved, related slugs resolve

### Phase 4 — Wire into the app

- [ ] `backend/main.py`: if `SYNC_ON_START=1`, call `sync_content()` in lifespan startup
- [ ] `backend/routers/terms.py`:
  - [ ] After successful POST: call `content_writer.write_term(...)` inside the same try-block; rollback DB on fs failure
  - [ ] After successful PUT: same
  - [ ] After successful DELETE: `content_writer.delete_term(slug, ...)`
  - [ ] PATCH /favorite: also rewrites the file (toggles `is_favorite` in frontmatter)
- [ ] Tests: `tests/test_terms_writeback.py`
- [ ] Remove `seed.sql` invocation from `init_db` (keep schema-only init)

### Phase 5 — Docs + cleanup

- [ ] Update `CLAUDE.md`: new "Content" section explaining the file-based source of truth; update Development Commands
- [ ] Update `README.md`: replace init-db line with `uv run python -m backend.sync_content`
- [ ] Add `.env` var `SYNC_ON_START` documentation
- [ ] Delete `backend/seed.sql` (or archive with deprecation header)

---

## Open Questions

- **Related-term symmetry:** `related_terms` has `CHECK(term_a < term_b)`. Loader needs to canonicalize pairs before insert. Confirm whether `related:` in frontmatter should be duplicated on both sides of a pair, or declared once and mirrored automatically. Recommendation: declare once, mirror automatically.
- **Code block extraction:** If a term file has multiple fenced blocks in the body, do we want the first one, or a designated `example` block marked somehow? Recommendation: first fenced block wins; good enough for 95% of entries.
- **File watching for live dev:** Out of scope for this plan. Run `sync_content` manually or let startup sync handle it.

---

## Success Criteria

- [ ] `content/terms/*.md` contains one file per current glossary term
- [ ] `uv run python -m backend.sync_content` rebuilds the DB from files without data loss
- [ ] Adding a new term = create a file + run sync (or restart dev server). No SQL touched.
- [ ] Editing a term in the UI updates the corresponding file on disk; `git status` shows the change
- [ ] All existing tests still pass; new tests cover loader, writer, sync, and write-back
