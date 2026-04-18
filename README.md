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
| Backend | Python 3.12+, FastAPI, MySQL (`aiomysql`) |
| Frontend | React 19, Vite, TypeScript |
| Styling | Tailwind CSS (dark terminal theme) |
| Code highlighting | `prism-react-renderer` |
| Markdown | `react-markdown` + `remark-gfm` |

---

## Prerequisites

- **uv** — [docs.astral.sh/uv](https://docs.astral.sh/uv/getting-started/installation/) (manages Python and all backend dependencies)
- **Node.js 18+** and **npm** — [nodejs.org](https://nodejs.org/)
- **MySQL 8+** — a running MySQL server accessible from your machine

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

### 3. Database — provision MySQL

The `setup_db.py` script creates the `concept_master` database, creates the app user from your `.env` (`DB_USER` / `DB_PASS`), applies the schema, and seeds initial data — all in one step.

```bash
# Run from the repo root
python backend/setup_db.py --root-password <your-mysql-root-password>
```

By default the script connects to `127.0.0.1:3306`. Override with `--host` and `--port` if your MySQL server is elsewhere:

```bash
python backend/setup_db.py --root-password <password> --host 127.0.0.1 --port 3306
```

> **Tip — skip the script and use an existing user:** If you already have a database user with the necessary privileges, you can skip `setup_db.py` and configure the connection via environment variables (see step 4) instead.

### 4. Backend — environment variables

Create a `.env` file in the repository root (same folder as `README.md`):

```ini
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=concept_user
DB_PASS=your_password
DB_NAME=concept_master
```

You can copy `.env.example` and then fill in your values.
(`setup_db.py` expects `DB_USER` to use letters/numbers/underscores.)

### 5. Frontend — install dependencies

```bash
cd frontend
npm install
```

### Re-seeding the database

If the seed data has been updated (e.g. new code examples added to existing terms), you need to clear the existing data and re-run the seed, since `seed.sql` uses `INSERT IGNORE` and won't overwrite existing rows.

```bash
# Clear all seed data
uv run python -c "
import asyncio, aiomysql
from backend.database import create_pool

async def reset():
    pool = await create_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute('DELETE FROM related_terms')
            await cur.execute('DELETE FROM term_tags')
            await cur.execute('DELETE FROM term_categories')
            await cur.execute('DELETE FROM terms')
            await cur.execute('DELETE FROM tags')
            await cur.execute('DELETE FROM categories')
    pool.close()
    await pool.wait_closed()
    print('Cleared.')

asyncio.run(reset())
"

# Re-run the seed
uv run python -c "import asyncio; from backend.database import init_db; asyncio.run(init_db())"
```

> **Note:** This deletes all terms, categories, and tags — including any you have created manually. Export your data first (`GET /api/terms/export`) if you want to keep it.

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
│   ├── database.py      # MySQL connection pool & DB helpers
│   ├── models.py        # Pydantic request/response models
│   ├── setup_db.py      # One-shot database provisioning script
│   ├── schema.sql       # CREATE TABLE statements
│   ├── seed.sql         # Initial seed data
│   ├── requirements.txt
│   └── routers/
│       ├── terms.py     # /api/terms endpoints
│       ├── categories.py
│       ├── tags.py
│       └── stats.py
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
- Matching terms automatically render a `Visual Representation` panel below the main content in the detail view
- SVG was chosen so diagrams stay sharp, load quickly, and remain easy to maintain in-repo

---

## Next Steps

Suggested polish tasks for the new concept-visual system:

- Add click-to-expand or modal zoom for larger diagram viewing
- Show a small visual badge on term cards when a term has an attached diagram
- Add keyboard navigation support for jumping between definition, code example, and visual sections
- Add a reusable template or generator workflow for creating future SVG concept diagrams consistently
- Consider optional per-term captions or learning notes below each diagram

---

## License

[MIT](LICENSE)
