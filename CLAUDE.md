# Interactive Glossary of Programming Concepts

## Project Overview

A personal-use, local-first desktop web application providing a searchable, categorized glossary of programming terms. Designed as a daily reference and learning tool for a CS student. The app emphasizes fast search, rich Markdown definitions with syntax-highlighted code examples, and a dark terminal-inspired aesthetic.

**This is a single-user, no-auth application.** No login, no registration, no access control. All endpoints are open.

---

## Tech Stack

| Layer             | Technology                          | Notes                                         |
| ----------------- | ----------------------------------- | --------------------------------------------- |
| Backend           | Python 3.12+, FastAPI, SQLite       | Single-file DB at `backend/glossary.db`        |
| ORM / Migrations  | None — raw SQL via `aiosqlite`      | Schema managed via `schema.sql`                |
| Frontend          | React 18 + Vite + TypeScript        | SPA, no SSR                                    |
| Styling           | Tailwind CSS                        | Dark theme, terminal aesthetic                 |
| Code Highlighting | Prism.js (`prism-react-renderer`)   | Support: Python, Java, JavaScript, TypeScript, SQL, Bash, C, JSON |
| Markdown          | `react-markdown` + `remark-gfm`    | Definitions support full GFM Markdown          |
| HTTP Client       | `axios` or `fetch`                  | Frontend → Backend API calls                   |
| Dev Server Proxy  | Vite `proxy` config                 | Proxy `/api` → `http://localhost:8000`         |

---

## Project Structure

```
glossary/
├── CLAUDE.md                  # This file
├── backend/
│   ├── main.py                # FastAPI app entrypoint
│   ├── database.py            # DB connection, init, helpers
│   ├── models.py              # Pydantic models (request/response)
│   ├── routers/
│   │   ├── terms.py           # /api/terms endpoints
│   │   ├── categories.py      # /api/categories endpoints
│   │   ├── tags.py            # /api/tags endpoints
│   │   └── stats.py           # /api/stats endpoints
│   ├── schema.sql             # Full DB schema (CREATE TABLE statements)
│   ├── seed.sql               # Initial glossary data (INSERT statements)
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── src/
│   │   ├── main.tsx           # App entrypoint
│   │   ├── App.tsx            # Root component, routing
│   │   ├── api/
│   │   │   └── client.ts      # API client wrapper
│   │   ├── components/
│   │   │   ├── Layout.tsx          # Shell: sidebar + main area
│   │   │   ├── SearchBar.tsx       # Debounced search input (Ctrl+K focus)
│   │   │   ├── Sidebar.tsx         # Category & tag navigation, favorites filter
│   │   │   ├── TermCard.tsx        # Collapsed term preview card
│   │   │   ├── TermDetail.tsx      # Expanded view: full definition, code, related
│   │   │   ├── TermForm.tsx        # Create/Edit term form
│   │   │   ├── StatsPanel.tsx      # Glossary statistics
│   │   │   └── EmptyState.tsx      # No results / empty glossary messaging
│   │   ├── hooks/
│   │   │   ├── useTerms.ts         # Fetch, search, filter terms
│   │   │   ├── useCategories.ts    # Fetch categories
│   │   │   ├── useTags.ts          # Fetch tags
│   │   │   └── useDebounce.ts      # Debounce hook
│   │   ├── types/
│   │   │   └── index.ts            # TypeScript interfaces
│   │   └── styles/
│   │       └── globals.css         # Tailwind directives, custom theme vars
│   └── public/
│       └── favicon.svg
└── README.md
```

---

## Database Schema

### Tables

**terms**
| Column       | Type    | Constraints                        |
| ------------ | ------- | ---------------------------------- |
| id           | INTEGER | PRIMARY KEY AUTOINCREMENT          |
| name         | TEXT    | NOT NULL, UNIQUE                   |
| slug         | TEXT    | NOT NULL, UNIQUE                   |
| definition   | TEXT    | NOT NULL (Markdown)                |
| example_code | TEXT    | NULLABLE (code snippet)            |
| code_lang    | TEXT    | NULLABLE (language identifier)     |
| is_favorite  | INTEGER | NOT NULL DEFAULT 0 (0=no, 1=yes)   |
| created_at   | TEXT    | NOT NULL DEFAULT CURRENT_TIMESTAMP |
| updated_at   | TEXT    | NOT NULL DEFAULT CURRENT_TIMESTAMP |

**categories**
| Column | Type    | Constraints               |
| ------ | ------- | ------------------------- |
| id     | INTEGER | PRIMARY KEY AUTOINCREMENT |
| name   | TEXT    | NOT NULL, UNIQUE          |
| slug   | TEXT    | NOT NULL, UNIQUE          |

**term_categories** (many-to-many join)
| Column      | Type    | Constraints                      |
| ----------- | ------- | -------------------------------- |
| term_id     | INTEGER | FK → terms(id) ON DELETE CASCADE |
| category_id | INTEGER | FK → categories(id) ON DELETE CASCADE |
| PRIMARY KEY | —       | (term_id, category_id)           |

**tags**
| Column | Type    | Constraints               |
| ------ | ------- | ------------------------- |
| id     | INTEGER | PRIMARY KEY AUTOINCREMENT |
| name   | TEXT    | NOT NULL, UNIQUE          |

**term_tags** (many-to-many join)
| Column  | Type    | Constraints                      |
| ------- | ------- | -------------------------------- |
| term_id | INTEGER | FK → terms(id) ON DELETE CASCADE |
| tag_id  | INTEGER | FK → tags(id) ON DELETE CASCADE  |
| PRIMARY KEY | —   | (term_id, tag_id)                |

**related_terms** (self-referencing many-to-many, bidirectional)
| Column   | Type    | Constraints                      |
| -------- | ------- | -------------------------------- |
| term_a   | INTEGER | FK → terms(id) ON DELETE CASCADE |
| term_b   | INTEGER | FK → terms(id) ON DELETE CASCADE |
| PRIMARY KEY | —    | (term_a, term_b)                 |
| CHECK    | —       | term_a < term_b (prevent dupes)  |

---

## API Specification

Base URL: `http://localhost:8000/api`

All responses return JSON. All request bodies are JSON.

### Terms

| Method | Endpoint                  | Description                          | Query Params                                    |
| ------ | ------------------------- | ------------------------------------ | ----------------------------------------------- |
| GET    | `/api/terms`              | List/search terms                    | `q` (search), `category` (slug), `tag` (name), `favorites_only` (bool), `limit`, `offset` |
| GET    | `/api/terms/{slug}`       | Get single term with related terms   | —                                               |
| POST   | `/api/terms`              | Create new term                      | —                                               |
| PUT    | `/api/terms/{slug}`       | Update existing term                 | —                                               |
| DELETE | `/api/terms/{slug}`       | Delete term                          | —                                               |
| PATCH  | `/api/terms/{slug}/favorite` | Toggle favorite status            | —                                               |

**POST/PUT Request Body:**
```json
{
  "name": "Binary Search Tree",
  "definition": "A node-based binary tree where...",
  "example_code": "class Node:\n    ...",
  "code_lang": "python",
  "category_ids": [1, 3],
  "tag_names": ["exam-review", "interview-prep"],
  "related_term_ids": [5, 12]
}
```

**GET `/api/terms` Response:**
```json
{
  "terms": [
    {
      "id": 1,
      "name": "Binary Search Tree",
      "slug": "binary-search-tree",
      "definition": "A node-based binary tree where...",
      "example_code": "...",
      "code_lang": "python",
      "is_favorite": false,
      "categories": [{"id": 1, "name": "Data Structures", "slug": "data-structures"}],
      "tags": [{"id": 1, "name": "exam-review"}],
      "created_at": "2026-04-08T12:00:00",
      "updated_at": "2026-04-08T12:00:00"
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

**GET `/api/terms/{slug}` Response:** Same as above but single object, plus `related_terms` array of `{id, name, slug}` objects.

### Categories

| Method | Endpoint           | Description                        |
| ------ | ------------------ | ---------------------------------- |
| GET    | `/api/categories`  | List all categories with term count |

### Tags

| Method | Endpoint     | Description                  |
| ------ | ------------ | ---------------------------- |
| GET    | `/api/tags`  | List all tags with term count |

### Stats

| Method | Endpoint     | Description                                            |
| ------ | ------------ | ------------------------------------------------------ |
| GET    | `/api/stats` | Total terms, per-category counts, recent, top favorites |

### Bulk Import/Export

| Method | Endpoint              | Description                   | Content-Type       |
| ------ | --------------------- | ----------------------------- | ------------------ |
| GET    | `/api/terms/export`   | Export all terms as JSON array | application/json   |
| POST   | `/api/terms/import`   | Import terms from JSON array   | application/json   |

---

## Frontend Behavior

### Search
- **Debounced** at 300ms
- **Keyboard shortcut**: `Ctrl+K` or `/` focuses the search bar
- Searches across `name` and `definition` fields (backend `LIKE` query)
- Results update in real-time as user types

### Navigation
- Sidebar lists categories (with term counts) and tags
- Clicking a category/tag filters the main view
- "Favorites" toggle in sidebar filters to starred terms only
- Arrow keys navigate term list; Enter expands selected term; Escape collapses

### Term Display
- **Card view** (default): Shows term name, truncated definition (first 120 chars), category badges, favorite star
- **Detail view** (expanded): Full Markdown definition rendered via `react-markdown`, syntax-highlighted code block, related terms as clickable chips, edit/delete buttons
- Smooth expand/collapse animation (CSS transitions or Framer Motion)

### Term Form
- Used for both Create and Edit
- Fields: name (text), definition (textarea, Markdown preview toggle), example_code (textarea with monospace font), code_lang (dropdown), categories (checkboxes), tags (comma-separated text input, autocomplete from existing tags), related terms (multi-select search)
- Validation: name and definition required; name must be unique

### Stats Panel
- Accessible from sidebar or top nav
- Shows: total term count, terms per category (small bar chart or list), 5 most recently added, 5 most-favorited
- Keep it lightweight — no charting library needed, use Tailwind-styled bars

---

## UI / Design Direction

**Aesthetic:** Dark, terminal-inspired with modern touches. Think VS Code's dark theme meets a clean reference app.

- **Background:** Near-black (`#0d1117` or similar)
- **Surface:** Slightly lighter dark (`#161b22`)
- **Text:** Light gray (`#e6edf3`) for body, white for headings
- **Accent:** Bright cyan/teal (`#58a6ff` or `#39d353`) for links, active states, and highlights
- **Code blocks:** Slightly different background (`#1c2128`), monospace font (JetBrains Mono or Fira Code via Google Fonts)
- **Borders:** Subtle (`#30363d`)
- **Cards:** Rounded corners (8px), subtle border, slight hover lift/glow effect
- **Typography:** Monospace for code and term names; clean sans-serif (e.g., IBM Plex Sans) for definitions and body text

---

## Development Commands

```bash
# Backend — install / sync all dependencies (run from repo root)
uv sync --group dev

# Initialize DB (creates glossary.db, runs schema.sql and seed.sql)
uv run python -c "import asyncio; from backend.database import init_db; asyncio.run(init_db())"

# Start backend dev server (from repo root)
uv run uvicorn backend.main:app --reload --port 8000

# Run tests
uv run pytest

# Frontend
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173, proxies /api to :8000
```

---

## Coding Conventions

- **Python:** Type hints on all function signatures. Pydantic models for all request/response bodies. Use `async` for all DB operations. No ORMs.
- **TypeScript:** Strict mode. Interfaces for all API types in `types/index.ts`. Custom hooks for all data fetching.
- **SQL:** Parameterized queries only (no string interpolation). Use `?` placeholders.
- **Naming:** Python = snake_case. TypeScript = camelCase for variables/functions, PascalCase for components/interfaces. SQL = snake_case.
- **Error handling:** Backend returns consistent error JSON `{"detail": "message"}` with appropriate HTTP status codes. Frontend shows toast/inline error messages.
- **Slugs:** Auto-generated from name via `slugify` (lowercase, hyphens, strip special chars). Slugs are the URL identifier for terms.

---

## Phase Build Order

Execute phases in order. Each phase should be fully working before moving on.

1. **Phase 1 — Backend + DB:** Schema, seed data, all API endpoints, test with curl
2. **Phase 2 — Frontend Shell:** Vite + React + Tailwind setup, layout, search, term list, term detail (read-only)
3. **Phase 3 — CRUD + Power Features:** Create/edit/delete forms, favorites, tags, related terms, Markdown preview
4. **Phase 4 — Polish:** Keyboard navigation, Ctrl+K, stats panel, import/export, animations, responsive tweaks
