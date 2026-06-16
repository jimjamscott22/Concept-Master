

# Concept Master

A local-first desktop web application for building and browsing a personal glossary of programming concepts. Designed as a daily reference and study tool for CS students, it combines fast full-text search, rich Markdown definitions with syntax-highlighted code examples, and a dark terminal-inspired aesthetic.

---

## Features

- **Searchable glossary** — debounced full-text search across term names and definitions (press `Ctrl+K` or `/` to focus)
- **Markdown definitions** — write definitions in full GitHub-Flavoured Markdown, rendered in the UI
- **Syntax-highlighted code examples** — supported languages include Python, JavaScript, TypeScript, Java, SQL, Bash, C, and JSON
- **Categories & tags** — organise terms with multi-category assignment and free-form tags; filter the term list from the sidebar
- **Favourites** — star important terms and filter to favourites only
- **Related terms** — link terms together; related terms appear as clickable chips in the detail view
- **Create / Edit / Delete** — full CRUD for terms directly in the UI
- **Bulk import & export** — export your entire glossary as JSON or import a JSON array of terms
- **Stats panel** — total term count, per-category breakdown, recently added, and most-favourited terms
- **Keyboard navigation** — arrow keys to move through the list, `Enter` to expand, `Escape` to collapse
- **Concept visuals** — inline SVG diagrams in the term detail view for seeded glossary concepts
- **Theme picker** — palette icon in the upper-left switches between built-in themes (GitHub Dark, Dracula, Nord, Solarized Dark, Monokai, Gruvbox Light); selection persists across sessions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12+, FastAPI, MariaDB (`aiomysql`) |
| Frontend | React 19, Vite, TypeScript |
| Styling | Tailwind CSS (dark terminal theme) |
| Code highlighting | `prism-react-renderer` |
| Markdown | `react-markdown` + `remark-gfm` |

---

## Prerequisites

- **uv** — [docs.astral.sh/uv](https://docs.astral.sh/uv/getting-started/installation/) (manages Python and all backend dependencies)
- **Node.js 18+** and **npm** — [nodejs.org](https://nodejs.org/)
- **MariaDB 10.6+** — a running MariaDB server accessible from your machine (the `aiomysql` driver speaks the MySQL wire protocol, which MariaDB is compatible with)

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/jimjamscott22/Concept-Master.git
cd Concept-Master
```

### 2. Backend — install dependencies

```bash
uv sync --group dev
```

This resolves all backend dependencies (including dev tools like pytest) into a local `.venv` using the locked versions in `uv.lock`. No manual `pip install` or virtual environment creation needed.

### 3. Database — provision MariaDB

The `setup_db.py` script creates the `concept_master` database, creates the app user from your `.env` (`DB_USER` / `DB_PASS`), and applies the schema.

```bash
# Run from the repo root
python backend/setup_db.py --root-password <your-mariadb-root-password>
```

By default the script connects to `127.0.0.1:3306`. Override with `--host` and `--port` if your MariaDB server is elsewhere:

```bash
python backend/setup_db.py --root-password <password> --host 127.0.0.1 --port 3306
```

> **Tip — skip the script and use an existing user:** If you already have a database user with the necessary privileges, you can skip `setup_db.py` and configure the connection via environment variables (see step 4) instead. You can then initialize the schema with `uv run python -m backend.database`.

After the schema exists, populate the glossary from the `content/` directory (the source of truth):

```bash
uv run python -m backend.sync_content
```

### 4. Backend — environment variables

Create a `.env` file in the repository root (same folder as `README.md`):

```ini
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=concept_user
DB_PASS=your_password
DB_NAME=concept_master
# Optional: run `sync_content` automatically in the backend lifespan
# SYNC_ON_START=1
```

You can copy `.env.example` and then fill in your values.
(`setup_db.py` expects `DB_USER` to use letters/numbers/underscores.)

### 5. Frontend — install dependencies

```bash
cd frontend
npm install
```

### Content as source of truth

Glossary content lives in `content/` as Markdown files — one file per term (filename = slug) plus `content/categories.yml`. Adding, editing, or deleting a term is just an edit to those files. Commit them to git for history.

```bash
# Reconcile content/ -> database
uv run python -m backend.sync_content

# Delete DB terms whose .md file no longer exists
uv run python -m backend.sync_content --prune
```

Sync is idempotent and safe to re-run. To run it automatically at backend startup, set `SYNC_ON_START=1` in `.env`.

The in-app CRUD endpoints continue to work: every POST/PUT/DELETE/PATCH also writes (or removes) the corresponding `.md` file so the tree and the DB stay coherent. `git status` after a session shows exactly what changed.

---

## Running the App

Open **two terminals** — one for the backend and one for the frontend.

**Terminal 1 — backend API (port 8000):**

```bash
uv run uvicorn backend.main:app --reload --port 8000
```

**Terminal 2 — frontend dev server (port 5173):**

```bash
cd frontend
npm run dev
```

Then open **[http://localhost:5173](http://localhost:5173)** in your browser. The Vite dev server automatically proxies all `/api` requests to the FastAPI backend.

---

## Project Structure

```
Concept-Master/
├── backend/
│   ├── main.py          # FastAPI app & CORS config
│   ├── database.py      # MariaDB connection pool & DB helpers
│   ├── models.py        # Pydantic request/response models
│   ├── setup_db.py      # One-shot database provisioning script
│   ├── schema.sql       # CREATE TABLE statements
│   ├── content_loader.py# Parse content/terms/*.md
│   ├── content_writer.py# Serialize terms back to .md
│   ├── sync_content.py  # Reconcile content/ -> database
│   ├── requirements.txt
│   └── routers/
│       ├── terms.py     # /api/terms endpoints
│       ├── categories.py
│       ├── tags.py
│       └── stats.py
├── content/
│   ├── categories.yml   # Canonical category list
│   └── terms/           # One .md file per term (source of truth)
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── api/client.ts        # Typed API client
    │   ├── components/          # UI components
    │   ├── hooks/               # Data-fetching hooks
    │   └── types/index.ts       # Shared TypeScript interfaces
    ├── package.json
    └── vite.config.ts
```

---

## API Overview

Base URL: `http://localhost:8000/api`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/terms` | List / search terms (`q`, `category`, `tag`, `favorites_only`, `limit`, `offset`) |
| `GET` | `/terms/{slug}` | Get a single term with related terms |
| `POST` | `/terms` | Create a new term |
| `PUT` | `/terms/{slug}` | Update an existing term |
| `DELETE` | `/terms/{slug}` | Delete a term |
| `PATCH` | `/terms/{slug}/favorite` | Toggle favourite status |
| `GET` | `/terms/export` | Export all terms as a JSON array |
| `POST` | `/terms/import` | Import terms from a JSON array |
| `GET` | `/categories` | List all categories with term counts |
| `GET` | `/tags` | List all tags with term counts |
| `GET` | `/stats` | Glossary statistics |

Interactive API docs are available at `http://localhost:8000/docs` (Swagger UI) when the backend is running.

---

## Visuals

The glossary now includes a diagram system for concept entries in the detail view.

- Visuals are stored as lightweight SVG assets in `frontend/public/concepts`
- The frontend maps term slugs to diagrams in `frontend/src/components/ConceptVisual.tsx`
- Matching terms automatically render a `Visual Representation` panel below the main content in the detail view, plus a compact visual badge in the term list
- Diagrams can be opened in a larger modal view from the detail panel
- `Alt+1`, `Alt+2`, and `Alt+3` jump between definition, code example, and visual sections when available
- SVG was chosen so diagrams stay sharp, load quickly, and remain easy to maintain in-repo
- Use `scripts/new_concept_visual.py` and `docs/concept-visuals.md` to create future diagrams consistently

---

## Next Steps

Suggested future improvements:

- Add more concept diagrams for glossary terms that do not have visuals yet
- Consider a lightweight validation script that checks every registry entry has a matching SVG asset and useful alt text

---

## License

[MIT](LICENSE)
