# Concept Master — Full Implementation Design
**Date:** 2026-04-08

---

## Overview

Build the Interactive Glossary of Programming Concepts (Concept Master) as specified in CLAUDE.md, with MariaDB at `192.168.1.25` replacing the originally planned SQLite backend.

---

## Database Setup

**Server:** MariaDB at `192.168.1.25:3306`

**Provisioning SQL (run once as root/admin):**
```sql
CREATE DATABASE IF NOT EXISTS concept_master CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'concept_user'@'%' IDENTIFIED BY 'Yar22';
GRANT ALL PRIVILEGES ON concept_master.* TO 'concept_user'@'%';
FLUSH PRIVILEGES;
```

**Connection config** (constants in `backend/database.py`, no `.env` file):
```
DB_HOST = "192.168.1.25"
DB_PORT = 3306
DB_USER = "concept_user"
DB_PASS = "Yar22"
DB_NAME = "concept_master"
```

---

## Schema Changes (SQLite → MySQL)

| SQLite | MySQL/MariaDB |
|--------|--------------|
| `INTEGER PRIMARY KEY AUTOINCREMENT` | `INT NOT NULL AUTO_INCREMENT PRIMARY KEY` |
| `TEXT` | `TEXT` (kept — MariaDB supports TEXT) |
| `INTEGER NOT NULL DEFAULT 0` | `TINYINT(1) NOT NULL DEFAULT 0` |
| `datetime('now')` | `NOW()` |
| `PRAGMA foreign_keys = ON` | Removed — enforced via `ENGINE=InnoDB` |
| `PRAGMA journal_mode = WAL` | Removed — not applicable |
| Trigger `datetime('now')` | `NOW()` |
| `IF NOT EXISTS` on triggers | MariaDB supports this — kept |
| Single-quoted string escaping `''` | Use `\'` or rewrite seed to avoid embedded quotes |

All tables use `ENGINE=InnoDB` for foreign key support.

---

## Backend Architecture

### `backend/database.py`
- Connection constants at top of file
- `create_pool()` — creates `aiomysql` connection pool (min=2, max=10)
- `init_db()` — provisions DB/user, creates schema, seeds data
- `get_db()` — FastAPI dependency yielding a pool connection
- Pool stored as app state on `app.state.pool`

### `backend/main.py`
- FastAPI app with lifespan context manager
- Creates pool on startup, closes on shutdown
- CORS middleware for `localhost:5173`
- Includes all four routers

### `backend/models.py`
- Pydantic v2 models for all request/response bodies
- `TermCreate`, `TermUpdate`, `TermResponse`, `TermListResponse`
- `CategoryResponse`, `TagResponse`, `StatsResponse`

### `backend/routers/`
- `terms.py` — full CRUD + favorite toggle + export/import
- `categories.py` — list with term counts
- `tags.py` — list with term counts
- `stats.py` — totals, per-category counts, recent 5, top 5 favorites

All DB queries use `%s` placeholders (MySQL parameterized style, not `?`).

---

## Schema SQL (`backend/schema.sql`)

Full MySQL-syntax `CREATE TABLE` statements for:
- `terms`, `categories`, `tags`
- `term_categories`, `term_tags`, `related_terms`
- All indexes from original schema
- `AFTER UPDATE` trigger on `terms` to set `updated_at = NOW()`

---

## Seed SQL (`backend/seed.sql`)

Same 30 terms, 10 categories, 8 tags, and all join-table inserts from the original. Rewritten to avoid embedded single-quote escaping issues (use `\` escaping or rewrite affected strings).

---

## Frontend Architecture

Exactly as specified in CLAUDE.md — no changes. React 18 + Vite + TypeScript + Tailwind CSS.

Phase 2 frontend shell components:
- `Layout.tsx`, `SearchBar.tsx`, `Sidebar.tsx`, `TermCard.tsx`, `TermDetail.tsx`, `EmptyState.tsx`

Phase 3 additions:
- `TermForm.tsx`

Phase 4 additions:
- `StatsPanel.tsx`

Hooks: `useTerms.ts`, `useCategories.ts`, `useTags.ts`, `useDebounce.ts`

Vite proxy: `/api` → `http://localhost:8000`

---

## CLAUDE.md Updates

- Tech stack table: change `SQLite` → `MariaDB 192.168.1.25` and `aiosqlite` → `aiomysql`
- DB schema section: note `TINYINT(1)` for `is_favorite`, `InnoDB` engine
- Dev commands: replace DB init command with the `CREATE DATABASE` / `CREATE USER` provisioning step
- Requirements: `aiomysql>=0.2.0` replaces `aiosqlite`

---

## Phase Build Order

Unchanged from CLAUDE.md:

1. **Phase 1** — MariaDB provisioning, schema, seed data, all API endpoints, curl-tested
2. **Phase 2** — Frontend shell: layout, search, term list, term detail (read-only)
3. **Phase 3** — CRUD forms, favorites, tags, related terms, Markdown preview
4. **Phase 4** — Keyboard nav, Ctrl+K, stats panel, import/export, animations

---

## Out of Scope

- Authentication / access control (single-user app, explicitly excluded in CLAUDE.md)
- Environment variable / `.env` file management (connection constants live in `database.py`)
- ORM or migration tooling (raw SQL only, as per CLAUDE.md)
- Any charting library (Tailwind-styled bars for stats, as per CLAUDE.md)
