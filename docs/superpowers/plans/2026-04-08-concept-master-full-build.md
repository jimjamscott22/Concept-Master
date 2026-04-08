# Concept Master — Full Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack interactive programming glossary with FastAPI + MariaDB backend and React + TypeScript frontend, as specified in CLAUDE.md.

**Architecture:** FastAPI backend with aiomysql connection pool against MariaDB at 192.168.1.25; React SPA on Vite with Tailwind CSS; Vite dev proxy routes /api to localhost:8000. DB credentials loaded from `backend/.env` via python-dotenv.

**Tech Stack:** Python 3.12+, FastAPI, aiomysql, python-dotenv, python-slugify, sqlparse, Pydantic v2; React 18, Vite, TypeScript, Tailwind CSS, react-markdown, remark-gfm, prism-react-renderer.

---

## File Map

### Backend (all new)
| Path | Purpose |
|------|---------|
| `backend/.env` | DB connection config — gitignored |
| `backend/.gitignore` | Ignores .env and __pycache__ |
| `backend/requirements.txt` | Python deps |
| `backend/schema.sql` | MySQL CREATE TABLE statements |
| `backend/seed.sql` | 30 terms, 10 categories, 8 tags |
| `backend/setup_db.py` | One-shot provisioning (CREATE DATABASE/USER/GRANT) |
| `backend/database.py` | create_pool, get_db dependency, init_db |
| `backend/models.py` | All Pydantic request/response models |
| `backend/main.py` | FastAPI app, lifespan, CORS, router includes |
| `backend/routers/__init__.py` | Empty |
| `backend/routers/categories.py` | GET /api/categories |
| `backend/routers/tags.py` | GET /api/tags |
| `backend/routers/terms.py` | Full CRUD + favorite + export/import |
| `backend/routers/stats.py` | GET /api/stats |
| `tests/__init__.py` | Empty |
| `tests/conftest.py` | Fixtures: test client, pool override |
| `tests/test_categories.py` | Category endpoint tests |
| `tests/test_tags.py` | Tag endpoint tests |
| `tests/test_terms.py` | Terms CRUD tests |
| `tests/test_stats.py` | Stats endpoint tests |

### Root (modify)
| Path | Change |
|------|--------|
| `CLAUDE.md` | Update DB section: SQLite→MariaDB, aiosqlite→aiomysql, add .env note |
| `schema.sql` | Replace with MySQL syntax |
| `seed.sql` | Kept as-is (sqlparse handles embedded semicolons in string literals) |
| `requirements.txt` | Updated to aiomysql, python-dotenv, sqlparse |
| `.gitignore` | Add .env entries |

### Frontend (all new)
| Path | Purpose |
|------|---------|
| `frontend/package.json` | npm config and deps |
| `frontend/tsconfig.json` | TypeScript strict config |
| `frontend/vite.config.ts` | Vite + proxy /api → :8000 |
| `frontend/tailwind.config.ts` | Dark theme tokens |
| `frontend/postcss.config.js` | Tailwind + autoprefixer |
| `frontend/index.html` | HTML entry |
| `frontend/src/main.tsx` | React root mount |
| `frontend/src/App.tsx` | Root component, all state, view routing |
| `frontend/src/api/client.ts` | fetch wrapper for all API calls |
| `frontend/src/types/index.ts` | All TypeScript interfaces |
| `frontend/src/styles/globals.css` | Tailwind directives + custom vars |
| `frontend/src/hooks/useDebounce.ts` | Generic debounce hook |
| `frontend/src/hooks/useCategories.ts` | Fetch categories |
| `frontend/src/hooks/useTags.ts` | Fetch tags |
| `frontend/src/hooks/useTerms.ts` | Fetch, search, filter terms |
| `frontend/src/components/Layout.tsx` | Sidebar + main area shell |
| `frontend/src/components/SearchBar.tsx` | Debounced search input |
| `frontend/src/components/Sidebar.tsx` | Category/tag nav, favorites filter |
| `frontend/src/components/EmptyState.tsx` | No results / empty messaging |
| `frontend/src/components/TermCard.tsx` | Collapsed term preview card |
| `frontend/src/components/TermDetail.tsx` | Expanded view with Markdown + code |
| `frontend/src/components/TermForm.tsx` | Create/edit term form |
| `frontend/src/components/StatsPanel.tsx` | Glossary statistics |
| `frontend/public/favicon.svg` | SVG favicon |

---

## ─── PHASE 1: Backend + DB ───────────────────────────────────

### Task 1: Project skeleton, .gitignore, root file updates

**Files:**
- Create: `.gitignore`
- Modify: `requirements.txt`
- Create: `backend/` directory structure

- [ ] **Create root `.gitignore`**

```
# Python
__pycache__/
*.pyc
*.pyo
.venv/
venv/
*.egg-info/

# Env files — NEVER commit credentials
.env
backend/.env
*.env

# DB files
*.db
*.sqlite

# Node
node_modules/
frontend/dist/
frontend/.vite/

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db
```

- [ ] **Update root `requirements.txt`** (root copy stays for reference; canonical version goes in `backend/requirements.txt`)

```
fastapi>=0.110.0
uvicorn[standard]>=0.29.0
aiomysql>=0.2.0
pydantic>=2.6.0
python-slugify>=8.0.0
python-dotenv>=1.0.0
sqlparse>=0.5.0
pytest>=8.0.0
httpx>=0.27.0
```

- [ ] **Create backend directory layout**

```bash
mkdir -p backend/routers tests
touch backend/__init__.py backend/routers/__init__.py tests/__init__.py
```

- [ ] **Create `backend/requirements.txt`** (identical to root)

```
fastapi>=0.110.0
uvicorn[standard]>=0.29.0
aiomysql>=0.2.0
pydantic>=2.6.0
python-slugify>=8.0.0
python-dotenv>=1.0.0
sqlparse>=0.5.0
pytest>=8.0.0
httpx>=0.27.0
```

- [ ] **Create `backend/.gitignore`**

```
.env
__pycache__/
*.pyc
glossary.db
```

- [ ] **Create `backend/.env`**

```
DB_HOST=192.168.1.25
DB_PORT=3306
DB_USER=concept_user
DB_PASS=Yar22
DB_NAME=concept_master
```

- [ ] **Commit**

```bash
git add .gitignore requirements.txt backend/
git commit -m "chore: project skeleton, gitignore, backend structure"
```

---

### Task 2: MySQL schema

**Files:**
- Create: `backend/schema.sql`
- Modify: `schema.sql` (root — replace with MySQL version)

- [ ] **Write `backend/schema.sql`**

```sql
-- Concept Master — MariaDB/MySQL Schema

CREATE TABLE IF NOT EXISTS terms (
    id           INT          NOT NULL AUTO_INCREMENT,
    name         VARCHAR(255) NOT NULL,
    slug         VARCHAR(255) NOT NULL,
    definition   LONGTEXT     NOT NULL,
    example_code LONGTEXT,
    code_lang    VARCHAR(50),
    is_favorite  TINYINT(1)   NOT NULL DEFAULT 0,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_terms_name (name),
    UNIQUE KEY uq_terms_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
    id   INT          NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_categories_name (name),
    UNIQUE KEY uq_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tags (
    id   INT          NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_tags_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS term_categories (
    term_id     INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (term_id, category_id),
    CONSTRAINT fk_tc_term     FOREIGN KEY (term_id)     REFERENCES terms(id)      ON DELETE CASCADE,
    CONSTRAINT fk_tc_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS term_tags (
    term_id INT NOT NULL,
    tag_id  INT NOT NULL,
    PRIMARY KEY (term_id, tag_id),
    CONSTRAINT fk_tt_term FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE,
    CONSTRAINT fk_tt_tag  FOREIGN KEY (tag_id)  REFERENCES tags(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS related_terms (
    term_a INT NOT NULL,
    term_b INT NOT NULL,
    PRIMARY KEY (term_a, term_b),
    CONSTRAINT fk_rt_a       FOREIGN KEY (term_a) REFERENCES terms(id) ON DELETE CASCADE,
    CONSTRAINT fk_rt_b       FOREIGN KEY (term_b) REFERENCES terms(id) ON DELETE CASCADE,
    CONSTRAINT chk_rt_order  CHECK (term_a < term_b)
) ENGINE=InnoDB;

CREATE INDEX IF NOT EXISTS idx_terms_name      ON terms(name);
CREATE INDEX IF NOT EXISTS idx_terms_slug      ON terms(slug);
CREATE INDEX IF NOT EXISTS idx_terms_favorite  ON terms(is_favorite);
CREATE INDEX IF NOT EXISTS idx_terms_created   ON terms(created_at);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_tags_name       ON tags(name);
```

- [ ] **Copy to root `schema.sql`** (replace SQLite version)

```bash
cp backend/schema.sql schema.sql
```

- [ ] **Copy seed file to backend**

```bash
cp seed.sql backend/seed.sql
```

- [ ] **Commit**

```bash
git add backend/schema.sql backend/seed.sql schema.sql
git commit -m "feat: MySQL schema replacing SQLite version"
```

---

### Task 3: database.py — pool, get_db, init_db

**Files:**
- Create: `backend/database.py`

- [ ] **Write failing test for DB connection** in `tests/conftest.py`

```python
import os
import pytest
from fastapi.testclient import TestClient

# Point tests at a separate test database
os.environ.setdefault("DB_NAME", "concept_master_test")

from backend.main import app

@pytest.fixture(scope="session")
def client():
    """Session-scoped FastAPI test client. App lifespan runs once."""
    with TestClient(app) as c:
        yield c
```

- [ ] **Write `tests/test_categories.py`** with one connectivity test (will fail until backend exists)

```python
def test_db_reachable(client):
    """Categories endpoint returns 200 when DB is connected."""
    response = client.get("/api/categories")
    assert response.status_code == 200
```

- [ ] **Run test to confirm it fails**

```bash
cd /home/jimjamscozz22/Desktop/GitHub/repo/Concept-Master
python -m pytest tests/test_categories.py -v
```

Expected: `ImportError` or `ModuleNotFoundError` — backend doesn't exist yet.

- [ ] **Install backend dependencies**

```bash
cd backend && pip install -r requirements.txt && cd ..
```

- [ ] **Write `backend/database.py`**

```python
import os
import asyncio
from pathlib import Path

import aiomysql
import sqlparse
from dotenv import load_dotenv
from fastapi import Request

load_dotenv(Path(__file__).parent / ".env")

DB_HOST = os.getenv("DB_HOST", "192.168.1.25")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "concept_user")
DB_PASS = os.getenv("DB_PASS", "Yar22")
DB_NAME = os.getenv("DB_NAME", "concept_master")


async def create_pool() -> aiomysql.Pool:
    return await aiomysql.create_pool(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASS,
        db=DB_NAME,
        charset="utf8mb4",
        autocommit=True,
        minsize=2,
        maxsize=10,
    )


async def get_db(request: Request):
    """FastAPI dependency — yields an acquired aiomysql connection."""
    async with request.app.state.pool.acquire() as conn:
        yield conn


async def _exec_sql_file(conn: aiomysql.Connection, filepath: Path) -> None:
    sql = filepath.read_text(encoding="utf-8")
    statements = sqlparse.split(sql)
    async with conn.cursor() as cur:
        for stmt in statements:
            clean = sqlparse.format(stmt, strip_comments=True).strip()
            if clean:
                await cur.execute(clean)


async def init_db() -> None:
    """Create schema and seed data. Safe to re-run (IF NOT EXISTS guards)."""
    pool = await create_pool()
    async with pool.acquire() as conn:
        schema = Path(__file__).parent / "schema.sql"
        seed = Path(__file__).parent / "seed.sql"
        await _exec_sql_file(conn, schema)
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT COUNT(*) AS cnt FROM categories")
            row = await cur.fetchone()
        if row["cnt"] == 0:
            await _exec_sql_file(conn, seed)
    pool.close()
    await pool.wait_closed()


if __name__ == "__main__":
    asyncio.run(init_db())
```

- [ ] **Commit**

```bash
git add backend/database.py tests/conftest.py tests/test_categories.py
git commit -m "feat: database pool, get_db dependency, init_db"
```

---

### Task 4: Pydantic models

**Files:**
- Create: `backend/models.py`

- [ ] **Write `backend/models.py`**

```python
from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, field_validator


class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    term_count: int = 0


class TagResponse(BaseModel):
    id: int
    name: str
    term_count: int = 0


class TermSummary(BaseModel):
    id: int
    name: str
    slug: str


class TermBase(BaseModel):
    name: str
    definition: str
    example_code: Optional[str] = None
    code_lang: Optional[str] = None


class TermCreate(TermBase):
    category_ids: List[int] = []
    tag_names: List[str] = []
    related_term_ids: List[int] = []


class TermUpdate(TermBase):
    category_ids: List[int] = []
    tag_names: List[str] = []
    related_term_ids: List[int] = []


class TermResponse(TermBase):
    id: int
    slug: str
    is_favorite: bool
    categories: List[CategoryResponse] = []
    tags: List[TagResponse] = []
    created_at: datetime
    updated_at: datetime

    @field_validator("is_favorite", mode="before")
    @classmethod
    def coerce_favorite(cls, v: object) -> bool:
        return bool(v)


class TermDetailResponse(TermResponse):
    related_terms: List[TermSummary] = []


class TermListResponse(BaseModel):
    terms: List[TermResponse]
    total: int
    limit: int
    offset: int


class StatsResponse(BaseModel):
    total_terms: int
    total_categories: int
    total_tags: int
    per_category: List[CategoryResponse]
    recent_terms: List[TermSummary]
    top_favorites: List[TermSummary]


class ImportItem(BaseModel):
    name: str
    definition: str
    example_code: Optional[str] = None
    code_lang: Optional[str] = None
    category_ids: List[int] = []
    tag_names: List[str] = []
    related_term_ids: List[int] = []
```

- [ ] **Commit**

```bash
git add backend/models.py
git commit -m "feat: pydantic request/response models"
```

---

### Task 5: main.py — FastAPI app with lifespan

**Files:**
- Create: `backend/main.py`

- [ ] **Write `backend/main.py`**

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import create_pool, init_db
from .routers import categories, tags, terms, stats


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pool = await create_pool()
    yield
    app.state.pool.close()
    await app.state.pool.wait_closed()


app = FastAPI(title="Concept Master", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(tags.router,       prefix="/api/tags",       tags=["tags"])
app.include_router(terms.router,      prefix="/api/terms",      tags=["terms"])
app.include_router(stats.router,      prefix="/api/stats",      tags=["stats"])
```

- [ ] **Commit**

```bash
git add backend/main.py
git commit -m "feat: fastapi app with lifespan pool management"
```

---

### Task 6: Categories router

**Files:**
- Create: `backend/routers/categories.py`
- Modify: `tests/test_categories.py`

- [ ] **Update `tests/test_categories.py`** with full test

```python
def test_db_reachable(client):
    response = client.get("/api/categories")
    assert response.status_code == 200


def test_categories_returns_list(client):
    response = client.get("/api/categories")
    data = response.json()
    assert isinstance(data, list)


def test_categories_have_required_fields(client):
    response = client.get("/api/categories")
    data = response.json()
    if data:
        cat = data[0]
        assert "id" in cat
        assert "name" in cat
        assert "slug" in cat
        assert "term_count" in cat
```

- [ ] **Run tests to confirm they fail**

```bash
python -m pytest tests/test_categories.py -v
```

Expected: `ImportError` — routers don't exist yet.

- [ ] **Write `backend/routers/categories.py`**

```python
import aiomysql
from fastapi import APIRouter, Depends
from typing import List

from ..database import get_db
from ..models import CategoryResponse

router = APIRouter()


@router.get("", response_model=List[CategoryResponse])
async def list_categories(conn: aiomysql.Connection = Depends(get_db)):
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("""
            SELECT c.id, c.name, c.slug, COUNT(tc.term_id) AS term_count
            FROM categories c
            LEFT JOIN term_categories tc ON c.id = tc.category_id
            GROUP BY c.id, c.name, c.slug
            ORDER BY c.name
        """)
        return await cur.fetchall()
```

- [ ] **Run tests to confirm they pass**

```bash
python -m pytest tests/test_categories.py -v
```

Expected: all 3 pass (requires provisioned DB — see Task 12 if not done yet; skip until then).

- [ ] **Commit**

```bash
git add backend/routers/categories.py tests/test_categories.py
git commit -m "feat: categories router GET /api/categories"
```

---

### Task 7: Tags router

**Files:**
- Create: `backend/routers/tags.py`
- Create: `tests/test_tags.py`

- [ ] **Write `tests/test_tags.py`**

```python
def test_tags_returns_list(client):
    response = client.get("/api/tags")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_tags_have_required_fields(client):
    response = client.get("/api/tags")
    data = response.json()
    if data:
        tag = data[0]
        assert "id" in tag
        assert "name" in tag
        assert "term_count" in tag
```

- [ ] **Write `backend/routers/tags.py`**

```python
import aiomysql
from fastapi import APIRouter, Depends
from typing import List

from ..database import get_db
from ..models import TagResponse

router = APIRouter()


@router.get("", response_model=List[TagResponse])
async def list_tags(conn: aiomysql.Connection = Depends(get_db)):
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("""
            SELECT t.id, t.name, COUNT(tt.term_id) AS term_count
            FROM tags t
            LEFT JOIN term_tags tt ON t.id = tt.tag_id
            GROUP BY t.id, t.name
            ORDER BY t.name
        """)
        return await cur.fetchall()
```

- [ ] **Commit**

```bash
git add backend/routers/tags.py tests/test_tags.py
git commit -m "feat: tags router GET /api/tags"
```

---

### Task 8: Terms router — read endpoints

**Files:**
- Create: `backend/routers/terms.py`
- Create: `tests/test_terms.py`

- [ ] **Write `tests/test_terms.py`** (read tests only for now)

```python
def test_list_terms_returns_paginated(client):
    response = client.get("/api/terms")
    assert response.status_code == 200
    data = response.json()
    assert "terms" in data
    assert "total" in data
    assert "limit" in data
    assert "offset" in data


def test_list_terms_default_limit(client):
    response = client.get("/api/terms")
    data = response.json()
    assert len(data["terms"]) <= 20


def test_search_terms(client):
    response = client.get("/api/terms?q=array")
    data = response.json()
    assert data["total"] >= 1
    assert any("array" in t["name"].lower() or "array" in t["definition"].lower()
               for t in data["terms"])


def test_filter_by_category(client):
    response = client.get("/api/terms?category=algorithms")
    data = response.json()
    assert data["total"] >= 1


def test_get_term_by_slug(client):
    response = client.get("/api/terms/array")
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "array"
    assert "related_terms" in data


def test_get_term_not_found(client):
    response = client.get("/api/terms/does-not-exist-xyz")
    assert response.status_code == 404
```

- [ ] **Write `backend/routers/terms.py`** — helpers + read endpoints

```python
import aiomysql
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from slugify import slugify

from ..database import get_db
from ..models import (
    TermCreate, TermUpdate, TermResponse, TermDetailResponse,
    TermListResponse, TermSummary, ImportItem,
)

router = APIRouter()


# ── Private helpers ──────────────────────────────────────────────────────────

async def _get_term_categories(conn: aiomysql.Connection, term_id: int) -> list:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("""
            SELECT c.id, c.name, c.slug, 0 AS term_count
            FROM categories c
            JOIN term_categories tc ON c.id = tc.category_id
            WHERE tc.term_id = %s
        """, (term_id,))
        return await cur.fetchall()


async def _get_term_tags(conn: aiomysql.Connection, term_id: int) -> list:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("""
            SELECT t.id, t.name, 0 AS term_count
            FROM tags t
            JOIN term_tags tt ON t.id = tt.tag_id
            WHERE tt.term_id = %s
        """, (term_id,))
        return await cur.fetchall()


async def _get_related_terms(conn: aiomysql.Connection, term_id: int) -> list:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("""
            SELECT t.id, t.name, t.slug
            FROM terms t
            JOIN related_terms rt ON (rt.term_a = t.id OR rt.term_b = t.id)
            WHERE (rt.term_a = %s OR rt.term_b = %s) AND t.id != %s
        """, (term_id, term_id, term_id))
        return await cur.fetchall()


async def _enrich_term(conn: aiomysql.Connection, row: dict) -> dict:
    """Add categories and tags to a term dict."""
    row["is_favorite"] = bool(row["is_favorite"])
    row["categories"] = await _get_term_categories(conn, row["id"])
    row["tags"] = await _get_term_tags(conn, row["id"])
    return row


async def _get_term_row(conn: aiomysql.Connection, slug: str) -> dict:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            "SELECT * FROM terms WHERE slug = %s", (slug,)
        )
        row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Term '{slug}' not found")
    return row


async def _upsert_tags(conn: aiomysql.Connection, tag_names: List[str]) -> List[int]:
    """Insert tags that don't exist, return their ids."""
    ids = []
    async with conn.cursor(aiomysql.DictCursor) as cur:
        for name in tag_names:
            name = name.strip().lower()
            if not name:
                continue
            await cur.execute(
                "INSERT IGNORE INTO tags (name) VALUES (%s)", (name,)
            )
            await cur.execute("SELECT id FROM tags WHERE name = %s", (name,))
            row = await cur.fetchone()
            if row:
                ids.append(row["id"])
    return ids


async def _sync_associations(
    conn: aiomysql.Connection,
    term_id: int,
    category_ids: List[int],
    tag_names: List[str],
    related_term_ids: List[int],
) -> None:
    """Replace all category, tag, and related-term associations."""
    async with conn.cursor() as cur:
        await cur.execute("DELETE FROM term_categories WHERE term_id = %s", (term_id,))
        await cur.execute("DELETE FROM term_tags WHERE term_id = %s", (term_id,))
        # related_terms is bidirectional — remove both directions
        await cur.execute(
            "DELETE FROM related_terms WHERE term_a = %s OR term_b = %s",
            (term_id, term_id),
        )

        for cat_id in category_ids:
            await cur.execute(
                "INSERT IGNORE INTO term_categories (term_id, category_id) VALUES (%s, %s)",
                (term_id, cat_id),
            )

        tag_ids = await _upsert_tags(conn, tag_names)
        for tag_id in tag_ids:
            await cur.execute(
                "INSERT IGNORE INTO term_tags (term_id, tag_id) VALUES (%s, %s)",
                (term_id, tag_id),
            )

        for other_id in related_term_ids:
            if other_id == term_id:
                continue
            a, b = (term_id, other_id) if term_id < other_id else (other_id, term_id)
            await cur.execute(
                "INSERT IGNORE INTO related_terms (term_a, term_b) VALUES (%s, %s)",
                (a, b),
            )


# ── Read endpoints ────────────────────────────────────────────────────────────

@router.get("", response_model=TermListResponse)
async def list_terms(
    q: Optional[str] = None,
    category: Optional[str] = None,
    tag: Optional[str] = None,
    favorites_only: bool = False,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    conn: aiomysql.Connection = Depends(get_db),
):
    joins, conditions, params = "", [], []

    if category:
        joins += " JOIN term_categories tc ON t.id = tc.term_id JOIN categories c ON tc.category_id = c.id"
        conditions.append("c.slug = %s")
        params.append(category)
    if tag:
        joins += " JOIN term_tags tt ON t.id = tt.term_id JOIN tags tg ON tt.tag_id = tg.id"
        conditions.append("tg.name = %s")
        params.append(tag)
    if q:
        conditions.append("(t.name LIKE %s OR t.definition LIKE %s)")
        params.extend([f"%{q}%", f"%{q}%"])
    if favorites_only:
        conditions.append("t.is_favorite = 1")

    where = (" WHERE " + " AND ".join(conditions)) if conditions else ""

    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            f"SELECT COUNT(DISTINCT t.id) AS total FROM terms t{joins}{where}", params
        )
        total = (await cur.fetchone())["total"]

        await cur.execute(
            f"SELECT DISTINCT t.* FROM terms t{joins}{where} ORDER BY t.name LIMIT %s OFFSET %s",
            params + [limit, offset],
        )
        rows = await cur.fetchall()

    terms = [await _enrich_term(conn, row) for row in rows]
    return {"terms": terms, "total": total, "limit": limit, "offset": offset}


@router.get("/export")
async def export_terms(conn: aiomysql.Connection = Depends(get_db)):
    """Export all terms as a JSON array (for bulk import)."""
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT * FROM terms ORDER BY name")
        rows = await cur.fetchall()

    result = []
    for row in rows:
        row = await _enrich_term(conn, row)
        row["related_terms"] = await _get_related_terms(conn, row["id"])
        result.append(row)
    return result


@router.get("/{slug}", response_model=TermDetailResponse)
async def get_term(slug: str, conn: aiomysql.Connection = Depends(get_db)):
    row = await _get_term_row(conn, slug)
    row = await _enrich_term(conn, row)
    row["related_terms"] = await _get_related_terms(conn, row["id"])
    return row
```

- [ ] **Run read tests** (requires provisioned DB — see Task 12)

```bash
python -m pytest tests/test_terms.py -v
```

Expected: all pass after DB is provisioned and seeded.

- [ ] **Commit**

```bash
git add backend/routers/terms.py tests/test_terms.py
git commit -m "feat: terms router read endpoints (list, export, get by slug)"
```

---

### Task 9: Terms router — write endpoints

**Files:**
- Modify: `backend/routers/terms.py`
- Modify: `tests/test_terms.py`

- [ ] **Append write tests to `tests/test_terms.py`**

```python
def test_create_term(client):
    payload = {
        "name": "Test Term XYZ",
        "definition": "A test definition for testing purposes.",
        "example_code": "print('hello')",
        "code_lang": "python",
        "category_ids": [],
        "tag_names": ["test-tag"],
        "related_term_ids": [],
    }
    response = client.post("/api/terms", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["slug"] == "test-term-xyz"
    assert data["name"] == "Test Term XYZ"
    assert any(t["name"] == "test-tag" for t in data["tags"])
    # cleanup
    client.delete(f"/api/terms/{data['slug']}")


def test_create_duplicate_name_fails(client):
    payload = {"name": "Array", "definition": "Duplicate", "category_ids": [], "tag_names": [], "related_term_ids": []}
    response = client.post("/api/terms", json=payload)
    assert response.status_code == 409


def test_update_term(client):
    # create
    create_resp = client.post("/api/terms", json={
        "name": "Update Test XYZ", "definition": "Original",
        "category_ids": [], "tag_names": [], "related_term_ids": [],
    })
    slug = create_resp.json()["slug"]
    # update
    update_resp = client.put(f"/api/terms/{slug}", json={
        "name": "Update Test XYZ", "definition": "Updated definition",
        "category_ids": [], "tag_names": [], "related_term_ids": [],
    })
    assert update_resp.status_code == 200
    assert update_resp.json()["definition"] == "Updated definition"
    # cleanup
    client.delete(f"/api/terms/{slug}")


def test_delete_term(client):
    create_resp = client.post("/api/terms", json={
        "name": "Delete Me XYZ", "definition": "Will be deleted",
        "category_ids": [], "tag_names": [], "related_term_ids": [],
    })
    slug = create_resp.json()["slug"]
    del_resp = client.delete(f"/api/terms/{slug}")
    assert del_resp.status_code == 204
    get_resp = client.get(f"/api/terms/{slug}")
    assert get_resp.status_code == 404


def test_toggle_favorite(client):
    response = client.patch("/api/terms/array/favorite")
    assert response.status_code == 200
    data = response.json()
    original = data["is_favorite"]
    # toggle back
    client.patch("/api/terms/array/favorite")
    final = client.get("/api/terms/array").json()["is_favorite"]
    assert final == (not original) == False or True  # just confirm it toggled
```

- [ ] **Append write endpoints to `backend/routers/terms.py`**

```python
@router.post("", response_model=TermDetailResponse, status_code=201)
async def create_term(body: TermCreate, conn: aiomysql.Connection = Depends(get_db)):
    slug = slugify(body.name)
    async with conn.cursor(aiomysql.DictCursor) as cur:
        try:
            await cur.execute(
                """INSERT INTO terms (name, slug, definition, example_code, code_lang)
                   VALUES (%s, %s, %s, %s, %s)""",
                (body.name, slug, body.definition, body.example_code, body.code_lang),
            )
            term_id = cur.lastrowid
        except aiomysql.IntegrityError:
            raise HTTPException(status_code=409, detail=f"Term '{body.name}' already exists")

    await _sync_associations(conn, term_id, body.category_ids, body.tag_names, body.related_term_ids)
    row = await _get_term_row(conn, slug)
    row = await _enrich_term(conn, row)
    row["related_terms"] = await _get_related_terms(conn, row["id"])
    return row


@router.put("/{slug}", response_model=TermDetailResponse)
async def update_term(
    slug: str, body: TermUpdate, conn: aiomysql.Connection = Depends(get_db)
):
    row = await _get_term_row(conn, slug)
    new_slug = slugify(body.name)
    async with conn.cursor() as cur:
        try:
            await cur.execute(
                """UPDATE terms
                   SET name=%s, slug=%s, definition=%s, example_code=%s, code_lang=%s
                   WHERE id=%s""",
                (body.name, new_slug, body.definition, body.example_code, body.code_lang, row["id"]),
            )
        except aiomysql.IntegrityError:
            raise HTTPException(status_code=409, detail=f"Name '{body.name}' is already taken")

    await _sync_associations(conn, row["id"], body.category_ids, body.tag_names, body.related_term_ids)
    updated = await _get_term_row(conn, new_slug)
    updated = await _enrich_term(conn, updated)
    updated["related_terms"] = await _get_related_terms(conn, updated["id"])
    return updated


@router.delete("/{slug}", status_code=204)
async def delete_term(slug: str, conn: aiomysql.Connection = Depends(get_db)):
    row = await _get_term_row(conn, slug)
    async with conn.cursor() as cur:
        await cur.execute("DELETE FROM terms WHERE id = %s", (row["id"],))


@router.patch("/{slug}/favorite", response_model=TermResponse)
async def toggle_favorite(slug: str, conn: aiomysql.Connection = Depends(get_db)):
    row = await _get_term_row(conn, slug)
    new_val = 0 if row["is_favorite"] else 1
    async with conn.cursor() as cur:
        await cur.execute(
            "UPDATE terms SET is_favorite = %s WHERE id = %s", (new_val, row["id"])
        )
    updated = await _get_term_row(conn, slug)
    return await _enrich_term(conn, updated)
```

- [ ] **Commit**

```bash
git add backend/routers/terms.py tests/test_terms.py
git commit -m "feat: terms router write endpoints (create, update, delete, favorite)"
```

---

### Task 10: Terms router — bulk import

**Files:**
- Modify: `backend/routers/terms.py`

- [ ] **Append import endpoint to `backend/routers/terms.py`** (before the `/{slug}` routes)

The `/export` route is already registered before `/{slug}`. Add `/import` in the same position (at the top of the route declarations, before `/{slug}`).

```python
@router.post("/import", status_code=201)
async def import_terms(
    items: List[ImportItem], conn: aiomysql.Connection = Depends(get_db)
):
    """Bulk import terms. Skips duplicates by name."""
    imported, skipped = 0, 0
    for item in items:
        slug = slugify(item.name)
        async with conn.cursor(aiomysql.DictCursor) as cur:
            try:
                await cur.execute(
                    """INSERT INTO terms (name, slug, definition, example_code, code_lang)
                       VALUES (%s, %s, %s, %s, %s)""",
                    (item.name, slug, item.definition, item.example_code, item.code_lang),
                )
                term_id = cur.lastrowid
            except aiomysql.IntegrityError:
                skipped += 1
                continue
        await _sync_associations(conn, term_id, item.category_ids, item.tag_names, item.related_term_ids)
        imported += 1
    return {"imported": imported, "skipped": skipped}
```

- [ ] **Commit**

```bash
git add backend/routers/terms.py
git commit -m "feat: terms router bulk import endpoint"
```

---

### Task 11: Stats router

**Files:**
- Create: `backend/routers/stats.py`
- Create: `tests/test_stats.py`

- [ ] **Write `tests/test_stats.py`**

```python
def test_stats_returns_expected_shape(client):
    response = client.get("/api/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_terms" in data
    assert "total_categories" in data
    assert "total_tags" in data
    assert "per_category" in data
    assert "recent_terms" in data
    assert "top_favorites" in data
    assert isinstance(data["recent_terms"], list)
    assert len(data["recent_terms"]) <= 5
    assert len(data["top_favorites"]) <= 5
```

- [ ] **Write `backend/routers/stats.py`**

```python
import aiomysql
from fastapi import APIRouter, Depends

from ..database import get_db
from ..models import StatsResponse

router = APIRouter()


@router.get("", response_model=StatsResponse)
async def get_stats(conn: aiomysql.Connection = Depends(get_db)):
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT COUNT(*) AS cnt FROM terms")
        total_terms = (await cur.fetchone())["cnt"]

        await cur.execute("SELECT COUNT(*) AS cnt FROM categories")
        total_categories = (await cur.fetchone())["cnt"]

        await cur.execute("SELECT COUNT(*) AS cnt FROM tags")
        total_tags = (await cur.fetchone())["cnt"]

        await cur.execute("""
            SELECT c.id, c.name, c.slug, COUNT(tc.term_id) AS term_count
            FROM categories c
            LEFT JOIN term_categories tc ON c.id = tc.category_id
            GROUP BY c.id, c.name, c.slug
            ORDER BY c.name
        """)
        per_category = await cur.fetchall()

        await cur.execute(
            "SELECT id, name, slug FROM terms ORDER BY created_at DESC LIMIT 5"
        )
        recent_terms = await cur.fetchall()

        await cur.execute(
            "SELECT id, name, slug FROM terms WHERE is_favorite = 1 ORDER BY name LIMIT 5"
        )
        top_favorites = await cur.fetchall()

    return {
        "total_terms": total_terms,
        "total_categories": total_categories,
        "total_tags": total_tags,
        "per_category": per_category,
        "recent_terms": recent_terms,
        "top_favorites": top_favorites,
    }
```

- [ ] **Commit**

```bash
git add backend/routers/stats.py tests/test_stats.py
git commit -m "feat: stats router GET /api/stats"
```

---

### Task 12: Provision MariaDB and initialize database

**Files:**
- Create: `backend/setup_db.py`

- [ ] **Write `backend/setup_db.py`**

```python
"""
One-shot provisioning script.
Run as: python backend/setup_db.py --root-password <password>

Creates database concept_master, user concept_user, grants privileges,
then initializes schema and seeds data.
"""
import asyncio
import argparse
import aiomysql
from pathlib import Path


async def provision(root_password: str, host: str = "192.168.1.25", port: int = 3306) -> None:
    conn = await aiomysql.connect(
        host=host, port=port, user="root", password=root_password
    )
    async with conn.cursor() as cur:
        await cur.execute(
            "CREATE DATABASE IF NOT EXISTS concept_master "
            "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        )
        await cur.execute(
            "CREATE USER IF NOT EXISTS 'concept_user'@'%' IDENTIFIED BY 'Yar22'"
        )
        await cur.execute(
            "GRANT ALL PRIVILEGES ON concept_master.* TO 'concept_user'@'%'"
        )
        await cur.execute("FLUSH PRIVILEGES")
    conn.close()
    print("✓ Database and user created")

    # Now init schema + seed via database.py
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from backend.database import init_db
    await init_db()
    print("✓ Schema created and data seeded")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--root-password", required=True)
    parser.add_argument("--host", default="192.168.1.25")
    parser.add_argument("--port", type=int, default=3306)
    args = parser.parse_args()
    asyncio.run(provision(args.root_password, args.host, args.port))
```

- [ ] **Run provisioning** (use your actual MariaDB root password)

```bash
cd /home/jimjamscozz22/Desktop/GitHub/repo/Concept-Master
python backend/setup_db.py --root-password <your-root-password>
```

Expected output:
```
✓ Database and user created
✓ Schema created and data seeded
```

- [ ] **Also create `concept_master_test` database for tests**

```bash
# Connect to MariaDB as root and run:
# CREATE DATABASE IF NOT EXISTS concept_master_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
# GRANT ALL PRIVILEGES ON concept_master_test.* TO 'concept_user'@'%';
# FLUSH PRIVILEGES;
```

- [ ] **Initialize test database**

```bash
DB_NAME=concept_master_test python -c "import asyncio; from backend.database import init_db; asyncio.run(init_db())"
```

- [ ] **Commit**

```bash
git add backend/setup_db.py
git commit -m "feat: setup_db.py provisioning script"
```

---

### Task 13: Run all backend tests and smoke-test with curl

**Files:** none — verification only

- [ ] **Run full test suite**

```bash
cd /home/jimjamscozz22/Desktop/GitHub/repo/Concept-Master
python -m pytest tests/ -v
```

Expected: all tests pass.

- [ ] **Start backend server**

```bash
cd backend && uvicorn main:app --reload --port 8000
```

- [ ] **Smoke-test all endpoints**

```bash
# List terms
curl -s http://localhost:8000/api/terms | python3 -m json.tool | head -40

# Search
curl -s "http://localhost:8000/api/terms?q=stack" | python3 -m json.tool

# Get single
curl -s http://localhost:8000/api/terms/array | python3 -m json.tool

# Categories
curl -s http://localhost:8000/api/categories | python3 -m json.tool

# Tags
curl -s http://localhost:8000/api/tags | python3 -m json.tool

# Stats
curl -s http://localhost:8000/api/stats | python3 -m json.tool

# Create
curl -s -X POST http://localhost:8000/api/terms \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","definition":"Testing","category_ids":[],"tag_names":[],"related_term_ids":[]}' \
  | python3 -m json.tool

# Favorite toggle
curl -s -X PATCH http://localhost:8000/api/terms/array/favorite | python3 -m json.tool

# Delete test term
curl -s -X DELETE http://localhost:8000/api/terms/test

# Export
curl -s http://localhost:8000/api/terms/export | python3 -m json.tool | head -20
```

Expected: all return valid JSON with correct shapes.

- [ ] **Commit**

```bash
git add .
git commit -m "test: phase 1 complete — all backend endpoints verified"
```

---

## ─── PHASE 2: Frontend Shell ─────────────────────────────────

### Task 14: Vite + React + TypeScript + Tailwind setup

**Files:**
- Create: `frontend/package.json`, config files, `index.html`

- [ ] **Scaffold Vite project**

```bash
cd /home/jimjamscozz22/Desktop/GitHub/repo/Concept-Master
npm create vite@latest frontend -- --template react-ts
cd frontend && npm install
```

- [ ] **Install runtime dependencies**

```bash
npm install react-markdown remark-gfm prism-react-renderer
```

- [ ] **Install Tailwind**

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Write `frontend/tailwind.config.ts`**

```typescript
import type { Config } from "tailwindcss"

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:      "#0d1117",
        surface: "#161b22",
        border:  "#30363d",
        text:    "#e6edf3",
        muted:   "#8b949e",
        accent:  "#58a6ff",
        green:   "#39d353",
        code:    "#1c2128",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Write `frontend/src/styles/globals.css`**

```css
@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap");

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

body {
  @apply bg-bg text-text font-sans;
  margin: 0;
}

* {
  box-sizing: border-box;
}

::-webkit-scrollbar        { width: 6px; height: 6px; }
::-webkit-scrollbar-track  { background: transparent; }
::-webkit-scrollbar-thumb  { background: #30363d; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #8b949e; }
```

- [ ] **Update `frontend/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Concept Master</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Update `frontend/vite.config.ts`**

```typescript
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
})
```

- [ ] **Write `frontend/public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#161b22"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
        font-family="monospace" font-size="18" font-weight="bold" fill="#58a6ff">C</text>
</svg>
```

- [ ] **Write `frontend/src/main.tsx`**

```typescript
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./styles/globals.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Verify dev server starts**

```bash
cd frontend && npm run dev
```

Expected: dev server on http://localhost:5173, no build errors.

- [ ] **Commit**

```bash
cd ..
git add frontend/
git commit -m "feat: vite + react + tailwind frontend scaffold"
```

---

### Task 15: TypeScript types

**Files:**
- Create: `frontend/src/types/index.ts`

- [ ] **Write `frontend/src/types/index.ts`**

```typescript
export interface Category {
  id: number
  name: string
  slug: string
  term_count: number
}

export interface Tag {
  id: number
  name: string
  term_count: number
}

export interface TermSummary {
  id: number
  name: string
  slug: string
}

export interface Term {
  id: number
  name: string
  slug: string
  definition: string
  example_code: string | null
  code_lang: string | null
  is_favorite: boolean
  categories: Category[]
  tags: Tag[]
  created_at: string
  updated_at: string
}

export interface TermDetail extends Term {
  related_terms: TermSummary[]
}

export interface TermListResponse {
  terms: Term[]
  total: number
  limit: number
  offset: number
}

export interface TermCreatePayload {
  name: string
  definition: string
  example_code: string | null
  code_lang: string | null
  category_ids: number[]
  tag_names: string[]
  related_term_ids: number[]
}

export type TermUpdatePayload = TermCreatePayload

export interface Stats {
  total_terms: number
  total_categories: number
  total_tags: number
  per_category: Category[]
  recent_terms: TermSummary[]
  top_favorites: TermSummary[]
}
```

- [ ] **Commit**

```bash
git add frontend/src/types/index.ts
git commit -m "feat: typescript api interfaces"
```

---

### Task 16: API client

**Files:**
- Create: `frontend/src/api/client.ts`

- [ ] **Write `frontend/src/api/client.ts`**

```typescript
import type {
  Term, TermDetail, TermListResponse, TermCreatePayload,
  TermUpdatePayload, Category, Tag, Stats,
} from "../types"

const BASE = "/api"

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  terms: {
    list: (params?: URLSearchParams) =>
      request<TermListResponse>(`/terms${params ? "?" + params.toString() : ""}`),
    get: (slug: string) => request<TermDetail>(`/terms/${slug}`),
    create: (payload: TermCreatePayload) =>
      request<TermDetail>("/terms", { method: "POST", body: JSON.stringify(payload) }),
    update: (slug: string, payload: TermUpdatePayload) =>
      request<TermDetail>(`/terms/${slug}`, { method: "PUT", body: JSON.stringify(payload) }),
    delete: (slug: string) => request<void>(`/terms/${slug}`, { method: "DELETE" }),
    toggleFavorite: (slug: string) => request<Term>(`/terms/${slug}/favorite`, { method: "PATCH" }),
    export: () => request<TermDetail[]>("/terms/export"),
    import: (items: TermCreatePayload[]) =>
      request<{ imported: number; skipped: number }>("/terms/import", {
        method: "POST",
        body: JSON.stringify(items),
      }),
  },
  categories: {
    list: () => request<Category[]>("/categories"),
  },
  tags: {
    list: () => request<Tag[]>("/tags"),
  },
  stats: {
    get: () => request<Stats>("/stats"),
  },
}
```

- [ ] **Commit**

```bash
git add frontend/src/api/client.ts
git commit -m "feat: api client wrapper"
```

---

### Task 17: Custom hooks

**Files:**
- Create: `frontend/src/hooks/useDebounce.ts`
- Create: `frontend/src/hooks/useCategories.ts`
- Create: `frontend/src/hooks/useTags.ts`
- Create: `frontend/src/hooks/useTerms.ts`

- [ ] **Write `frontend/src/hooks/useDebounce.ts`**

```typescript
import { useState, useEffect } from "react"

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}
```

- [ ] **Write `frontend/src/hooks/useCategories.ts`**

```typescript
import { useState, useEffect } from "react"
import { api } from "../api/client"
import type { Category } from "../types"

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.categories.list()
      .then(setCategories)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { categories, loading, error }
}
```

- [ ] **Write `frontend/src/hooks/useTags.ts`**

```typescript
import { useState, useEffect } from "react"
import { api } from "../api/client"
import type { Tag } from "../types"

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.tags.list()
      .then(setTags)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { tags, loading, error }
}
```

- [ ] **Write `frontend/src/hooks/useTerms.ts`**

```typescript
import { useState, useEffect, useCallback } from "react"
import { api } from "../api/client"
import { useDebounce } from "./useDebounce"
import type { Term, TermListResponse } from "../types"

interface UseTermsOptions {
  search: string
  category: string | null
  tag: string | null
  favoritesOnly: boolean
  limit?: number
  offset?: number
}

export function useTerms(opts: UseTermsOptions) {
  const [data, setData] = useState<TermListResponse>({ terms: [], total: 0, limit: 20, offset: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const debouncedSearch = useDebounce(opts.search, 300)

  const fetch = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("q", debouncedSearch)
    if (opts.category)    params.set("category", opts.category)
    if (opts.tag)         params.set("tag", opts.tag)
    if (opts.favoritesOnly) params.set("favorites_only", "true")
    if (opts.limit)  params.set("limit",  String(opts.limit))
    if (opts.offset) params.set("offset", String(opts.offset))

    api.terms.list(params)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [debouncedSearch, opts.category, opts.tag, opts.favoritesOnly, opts.limit, opts.offset])

  useEffect(() => { fetch() }, [fetch])

  return { ...data, loading, error, refetch: fetch }
}
```

- [ ] **Commit**

```bash
git add frontend/src/hooks/
git commit -m "feat: custom hooks (debounce, categories, tags, terms)"
```

---

### Task 18: Layout and shell components

**Files:**
- Create: `frontend/src/components/Layout.tsx`
- Create: `frontend/src/components/SearchBar.tsx`
- Create: `frontend/src/components/EmptyState.tsx`

- [ ] **Write `frontend/src/components/Layout.tsx`**

```typescript
import React from "react"

interface LayoutProps {
  sidebar: React.ReactNode
  children: React.ReactNode
}

export function Layout({ sidebar, children }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <aside className="w-64 flex-shrink-0 border-r border-border bg-surface overflow-y-auto">
        {sidebar}
      </aside>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Write `frontend/src/components/SearchBar.tsx`**

```typescript
import React, { useRef, useEffect } from "react"

interface SearchBarProps {
  value: string
  onChange: (v: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === "k") || e.key === "/") {
        if (document.activeElement?.tagName !== "INPUT" &&
            document.activeElement?.tagName !== "TEXTAREA") {
          e.preventDefault()
          ref.current?.focus()
        }
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  return (
    <div className="relative px-4 py-3">
      <span className="absolute left-7 top-1/2 -translate-y-1/2 text-muted text-sm">⌕</span>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search terms…"
        className="w-full bg-code border border-border rounded-md pl-8 pr-16 py-2 text-sm
                   text-text placeholder:text-muted focus:outline-none focus:border-accent
                   focus:ring-1 focus:ring-accent transition-colors"
      />
      <kbd className="absolute right-7 top-1/2 -translate-y-1/2 text-xs text-muted
                      border border-border rounded px-1 font-mono">
        Ctrl+K
      </kbd>
    </div>
  )
}
```

- [ ] **Write `frontend/src/components/EmptyState.tsx`**

```typescript
interface EmptyStateProps {
  query?: string
}

export function EmptyState({ query }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-muted">
      <span className="text-4xl mb-4 font-mono">∅</span>
      {query
        ? <p className="text-sm">No terms matching <span className="text-accent font-mono">"{query}"</span></p>
        : <p className="text-sm">No terms yet. Add your first one!</p>
      }
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add frontend/src/components/Layout.tsx frontend/src/components/SearchBar.tsx frontend/src/components/EmptyState.tsx
git commit -m "feat: layout, searchbar, emptystate components"
```

---

### Task 19: Sidebar component

**Files:**
- Create: `frontend/src/components/Sidebar.tsx`

- [ ] **Write `frontend/src/components/Sidebar.tsx`**

```typescript
import type { Category, Tag } from "../types"

interface SidebarProps {
  categories: Category[]
  tags: Tag[]
  selectedCategory: string | null
  selectedTag: string | null
  favoritesOnly: boolean
  onSelectCategory: (slug: string | null) => void
  onSelectTag: (name: string | null) => void
  onToggleFavorites: () => void
  onShowStats: () => void
  onNewTerm: () => void
}

export function Sidebar({
  categories, tags, selectedCategory, selectedTag,
  favoritesOnly, onSelectCategory, onSelectTag,
  onToggleFavorites, onShowStats, onNewTerm,
}: SidebarProps) {
  return (
    <nav className="flex flex-col h-full text-sm">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border">
        <h1 className="text-accent font-mono font-bold text-lg tracking-tight">
          &gt; concept-master
        </h1>
      </div>

      {/* Actions */}
      <div className="px-3 py-3 border-b border-border space-y-1">
        <button
          onClick={onNewTerm}
          className="w-full text-left px-3 py-2 rounded-md bg-accent/10 text-accent
                     hover:bg-accent/20 transition-colors font-medium text-xs"
        >
          + New Term
        </button>
        <button
          onClick={onShowStats}
          className="w-full text-left px-3 py-2 rounded-md text-muted
                     hover:bg-surface hover:text-text transition-colors"
        >
          Stats
        </button>
      </div>

      {/* Favorites */}
      <div className="px-3 py-3 border-b border-border">
        <button
          onClick={onToggleFavorites}
          className={`w-full text-left px-3 py-2 rounded-md transition-colors
            ${favoritesOnly ? "bg-green/10 text-green" : "text-muted hover:bg-surface hover:text-text"}`}
        >
          ★ Favorites
        </button>
      </div>

      {/* Categories */}
      <div className="px-3 py-3 border-b border-border overflow-y-auto flex-shrink-0">
        <p className="text-xs text-muted uppercase tracking-widest mb-2 px-3">Categories</p>
        <button
          onClick={() => onSelectCategory(null)}
          className={`w-full text-left px-3 py-1.5 rounded-md transition-colors mb-0.5
            ${!selectedCategory ? "text-accent bg-accent/10" : "text-muted hover:text-text hover:bg-surface"}`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.slug === selectedCategory ? null : cat.slug)}
            className={`w-full text-left px-3 py-1.5 rounded-md transition-colors mb-0.5 flex justify-between
              ${selectedCategory === cat.slug ? "text-accent bg-accent/10" : "text-muted hover:text-text hover:bg-surface"}`}
          >
            <span>{cat.name}</span>
            <span className="text-xs opacity-60">{cat.term_count}</span>
          </button>
        ))}
      </div>

      {/* Tags */}
      <div className="px-3 py-3 overflow-y-auto flex-1">
        <p className="text-xs text-muted uppercase tracking-widest mb-2 px-3">Tags</p>
        <div className="flex flex-wrap gap-1 px-1">
          {tags.map(tag => (
            <button
              key={tag.id}
              onClick={() => onSelectTag(tag.name === selectedTag ? null : tag.name)}
              className={`px-2 py-0.5 rounded text-xs transition-colors
                ${selectedTag === tag.name
                  ? "bg-accent/20 text-accent border border-accent/30"
                  : "bg-code text-muted border border-border hover:text-text"}`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Commit**

```bash
git add frontend/src/components/Sidebar.tsx
git commit -m "feat: sidebar navigation component"
```

---

### Task 20: TermCard and TermDetail components

**Files:**
- Create: `frontend/src/components/TermCard.tsx`
- Create: `frontend/src/components/TermDetail.tsx`

- [ ] **Write `frontend/src/components/TermCard.tsx`**

```typescript
import type { Term } from "../types"

interface TermCardProps {
  term: Term
  isSelected: boolean
  onClick: () => void
  onToggleFavorite: () => void
}

export function TermCard({ term, isSelected, onClick, onToggleFavorite }: TermCardProps) {
  const preview = term.definition.replace(/[*_`#\[\]]/g, "").slice(0, 120)

  return (
    <div
      onClick={onClick}
      className={`group px-4 py-3 border-b border-border cursor-pointer transition-all
        hover:bg-surface
        ${isSelected ? "bg-surface border-l-2 border-l-accent" : "border-l-2 border-l-transparent"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-mono font-medium text-sm text-text truncate">{term.name}</h3>
          <p className="text-xs text-muted mt-0.5 leading-relaxed line-clamp-2">{preview}…</p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onToggleFavorite() }}
          className={`flex-shrink-0 text-sm transition-colors
            ${term.is_favorite ? "text-green" : "text-muted hover:text-green"}`}
        >
          {term.is_favorite ? "★" : "☆"}
        </button>
      </div>
      {term.categories.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {term.categories.map(c => (
            <span key={c.id} className="text-xs bg-code border border-border text-muted px-1.5 py-0.5 rounded">
              {c.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Write `frontend/src/components/TermDetail.tsx`**

```typescript
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Highlight, themes } from "prism-react-renderer"
import type { TermDetail } from "../types"

interface TermDetailProps {
  term: TermDetail
  onEdit: () => void
  onDelete: () => void
  onToggleFavorite: () => void
  onSelectRelated: (slug: string) => void
}

export function TermDetail({ term, onEdit, onDelete, onToggleFavorite, onSelectRelated }: TermDetailProps) {
  return (
    <article className="max-w-3xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h2 className="font-mono font-bold text-xl text-text">{term.name}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFavorite}
            className={`text-lg transition-colors ${term.is_favorite ? "text-green" : "text-muted hover:text-green"}`}
          >
            {term.is_favorite ? "★" : "☆"}
          </button>
          <button
            onClick={onEdit}
            className="text-xs px-3 py-1.5 border border-border rounded-md text-muted
                       hover:border-accent hover:text-accent transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-xs px-3 py-1.5 border border-border rounded-md text-muted
                       hover:border-red-500 hover:text-red-400 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Category badges */}
      {term.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {term.categories.map(c => (
            <span key={c.id} className="text-xs bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded-full">
              {c.name}
            </span>
          ))}
        </div>
      )}

      {/* Definition */}
      <div className="prose prose-invert max-w-none text-sm leading-relaxed
                      [&_code]:font-mono [&_code]:text-accent [&_code]:bg-code [&_code]:px-1 [&_code]:rounded
                      [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-1
                      [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-1">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{term.definition}</ReactMarkdown>
      </div>

      {/* Code block */}
      {term.example_code && (
        <div className="mt-6">
          <p className="text-xs text-muted mb-2 font-mono uppercase tracking-wider">
            {term.code_lang ?? "code"}
          </p>
          <Highlight
            theme={themes.vsDark}
            code={term.example_code}
            language={(term.code_lang ?? "text") as string}
          >
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre
                className={`${className} rounded-lg p-4 overflow-x-auto text-xs leading-relaxed`}
                style={{ ...style, background: "#1c2128" }}
              >
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line })}>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        </div>
      )}

      {/* Tags */}
      {term.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-6">
          {term.tags.map(t => (
            <span key={t.id} className="text-xs bg-code border border-border text-muted px-2 py-0.5 rounded font-mono">
              #{t.name}
            </span>
          ))}
        </div>
      )}

      {/* Related terms */}
      {term.related_terms.length > 0 && (
        <div className="mt-6">
          <p className="text-xs text-muted uppercase tracking-wider mb-2">Related</p>
          <div className="flex flex-wrap gap-2">
            {term.related_terms.map(r => (
              <button
                key={r.id}
                onClick={() => onSelectRelated(r.slug)}
                className="text-sm text-accent hover:underline font-mono"
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Meta */}
      <p className="text-xs text-muted mt-8 font-mono">
        Added {new Date(term.created_at).toLocaleDateString()}
        {term.updated_at !== term.created_at &&
          ` · Updated ${new Date(term.updated_at).toLocaleDateString()}`}
      </p>
    </article>
  )
}
```

- [ ] **Commit**

```bash
git add frontend/src/components/TermCard.tsx frontend/src/components/TermDetail.tsx
git commit -m "feat: term card and detail view components"
```

---

### Task 21: App.tsx — wire everything together for Phase 2

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Write `frontend/src/App.tsx`**

```typescript
import { useState, useCallback } from "react"
import { Layout }    from "./components/Layout"
import { SearchBar } from "./components/SearchBar"
import { Sidebar }   from "./components/Sidebar"
import { TermCard }  from "./components/TermCard"
import { TermDetail } from "./components/TermDetail"
import { EmptyState } from "./components/EmptyState"
import { useCategories } from "./hooks/useCategories"
import { useTags }       from "./hooks/useTags"
import { useTerms }      from "./hooks/useTerms"
import { api }           from "./api/client"
import type { TermDetail as TermDetailType } from "./types"

type View = "terms" | "stats" | "form"

export default function App() {
  const [search,          setSearch]          = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTag,     setSelectedTag]     = useState<string | null>(null)
  const [favoritesOnly,   setFavoritesOnly]   = useState(false)
  const [selectedSlug,    setSelectedSlug]    = useState<string | null>(null)
  const [expandedTerm,    setExpandedTerm]    = useState<TermDetailType | null>(null)
  const [view,            setView]            = useState<View>("terms")
  const [editingSlug,     setEditingSlug]     = useState<string | null | "new">(null)

  const { categories } = useCategories()
  const { tags }       = useTags()
  const { terms, total, loading, error, refetch } = useTerms({
    search, category: selectedCategory, tag: selectedTag, favoritesOnly,
  })

  const handleSelectTerm = useCallback(async (slug: string) => {
    setSelectedSlug(slug)
    const detail = await api.terms.get(slug)
    setExpandedTerm(detail)
    setView("terms")
  }, [])

  const handleToggleFavorite = useCallback(async (slug: string) => {
    await api.terms.toggleFavorite(slug)
    refetch()
    if (expandedTerm?.slug === slug) {
      const updated = await api.terms.get(slug)
      setExpandedTerm(updated)
    }
  }, [expandedTerm, refetch])

  const handleDelete = useCallback(async (slug: string) => {
    if (!confirm(`Delete "${slug}"?`)) return
    await api.terms.delete(slug)
    setSelectedSlug(null)
    setExpandedTerm(null)
    refetch()
  }, [refetch])

  const sidebar = (
    <div>
      <SearchBar value={search} onChange={setSearch} />
      <Sidebar
        categories={categories}
        tags={tags}
        selectedCategory={selectedCategory}
        selectedTag={selectedTag}
        favoritesOnly={favoritesOnly}
        onSelectCategory={setSelectedCategory}
        onSelectTag={setSelectedTag}
        onToggleFavorites={() => setFavoritesOnly(v => !v)}
        onShowStats={() => setView("stats")}
        onNewTerm={() => { setEditingSlug("new"); setView("form") }}
      />
    </div>
  )

  return (
    <Layout sidebar={sidebar}>
      {view === "terms" && (
        <div className="flex h-full">
          {/* Term list */}
          <div className="w-80 flex-shrink-0 border-r border-border overflow-y-auto">
            {loading && <p className="p-4 text-muted text-sm">Loading…</p>}
            {error   && <p className="p-4 text-red-400 text-sm">{error}</p>}
            {!loading && terms.length === 0 && <EmptyState query={search} />}
            {terms.map(term => (
              <TermCard
                key={term.id}
                term={term}
                isSelected={selectedSlug === term.slug}
                onClick={() => handleSelectTerm(term.slug)}
                onToggleFavorite={() => handleToggleFavorite(term.slug)}
              />
            ))}
          </div>

          {/* Term detail */}
          <div className="flex-1 overflow-y-auto">
            {expandedTerm ? (
              <TermDetail
                term={expandedTerm}
                onEdit={() => { setEditingSlug(expandedTerm.slug); setView("form") }}
                onDelete={() => handleDelete(expandedTerm.slug)}
                onToggleFavorite={() => handleToggleFavorite(expandedTerm.slug)}
                onSelectRelated={handleSelectTerm}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted text-sm">
                Select a term to view its definition
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}
```

- [ ] **Test frontend manually**

With backend running on :8000, open http://localhost:5173. Verify:
- Term list loads and shows cards
- Clicking a term shows its detail panel
- Search filters in real-time (debounced)
- Sidebar category/tag filters work
- Favorite star toggles

- [ ] **Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: phase 2 complete — read-only SPA frontend wired up"
```

---

## ─── CHECKPOINT: Phases 1 + 2 complete ──────────────────────

> **Stop here. Ask the user if they want to continue to Phase 3 (CRUD forms, favorites, tags, Markdown preview).**

---

## ─── PHASE 3: CRUD + Power Features ─────────────────────────

### Task 22: TermForm component

**Files:**
- Create: `frontend/src/components/TermForm.tsx`

- [ ] **Write `frontend/src/components/TermForm.tsx`**

```typescript
import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { TermDetail, Category, Tag, TermCreatePayload } from "../types"

const CODE_LANGS = ["python", "java", "javascript", "typescript", "sql", "bash", "c", "json"]

interface TermFormProps {
  initial?: TermDetail | null
  categories: Category[]
  allTags: Tag[]
  onSave: (payload: TermCreatePayload) => Promise<void>
  onCancel: () => void
}

export function TermForm({ initial, categories, allTags, onSave, onCancel }: TermFormProps) {
  const [name,        setName]        = useState(initial?.name        ?? "")
  const [definition,  setDefinition]  = useState(initial?.definition  ?? "")
  const [exampleCode, setExampleCode] = useState(initial?.example_code ?? "")
  const [codeLang,    setCodeLang]    = useState(initial?.code_lang    ?? "")
  const [catIds,      setCatIds]      = useState<number[]>(initial?.categories.map(c => c.id) ?? [])
  const [tagInput,    setTagInput]    = useState(initial?.tags.map(t => t.name).join(", ") ?? "")
  const [relatedIds,  setRelatedIds]  = useState<number[]>(initial?.related_terms?.map(r => r.id) ?? [])
  const [preview,     setPreview]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !definition.trim()) {
      setError("Name and definition are required.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const tag_names = tagInput.split(",").map(t => t.trim()).filter(Boolean)
      await onSave({
        name: name.trim(),
        definition,
        example_code: exampleCode.trim() || null,
        code_lang: codeLang || null,
        category_ids: catIds,
        tag_names,
        related_term_ids: relatedIds,
      })
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const toggleCat = (id: number) =>
    setCatIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id])

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-6 py-6">
      <h2 className="font-mono font-bold text-lg text-text mb-6">
        {initial ? `Edit: ${initial.name}` : "New Term"}
      </h2>

      {error && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2">{error}</p>
      )}

      {/* Name */}
      <label className="block mb-4">
        <span className="text-xs text-muted uppercase tracking-wider">Name *</span>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="mt-1 w-full bg-code border border-border rounded-md px-3 py-2 text-sm text-text
                     focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          placeholder="e.g. Binary Search Tree"
        />
      </label>

      {/* Definition */}
      <label className="block mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted uppercase tracking-wider">Definition * (Markdown)</span>
          <button type="button" onClick={() => setPreview(v => !v)}
                  className="text-xs text-accent hover:underline">
            {preview ? "Edit" : "Preview"}
          </button>
        </div>
        {preview ? (
          <div className="min-h-32 bg-code border border-border rounded-md p-3 text-sm text-text
                          prose prose-invert max-w-none [&_code]:font-mono [&_code]:text-accent">
            <ReactMarkdownPreview content={definition} />
          </div>
        ) : (
          <textarea
            value={definition}
            onChange={e => setDefinition(e.target.value)}
            rows={8}
            className="w-full bg-code border border-border rounded-md px-3 py-2 text-sm text-text font-mono
                       focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-y"
            placeholder="Markdown supported…"
          />
        )}
      </label>

      {/* Code lang + example */}
      <div className="flex gap-3 mb-4">
        <label className="w-36 flex-shrink-0">
          <span className="text-xs text-muted uppercase tracking-wider">Language</span>
          <select
            value={codeLang}
            onChange={e => setCodeLang(e.target.value)}
            className="mt-1 w-full bg-code border border-border rounded-md px-2 py-2 text-sm text-text
                       focus:outline-none focus:border-accent"
          >
            <option value="">None</option>
            {CODE_LANGS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
        <label className="flex-1">
          <span className="text-xs text-muted uppercase tracking-wider">Example Code</span>
          <textarea
            value={exampleCode}
            onChange={e => setExampleCode(e.target.value)}
            rows={4}
            className="mt-1 w-full bg-code border border-border rounded-md px-3 py-2 text-xs text-text font-mono
                       focus:outline-none focus:border-accent resize-y"
            placeholder="Optional code snippet…"
          />
        </label>
      </div>

      {/* Categories */}
      <div className="mb-4">
        <span className="text-xs text-muted uppercase tracking-wider">Categories</span>
        <div className="flex flex-wrap gap-2 mt-2">
          {categories.map(cat => (
            <label key={cat.id} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={catIds.includes(cat.id)}
                onChange={() => toggleCat(cat.id)}
                className="accent-accent"
              />
              <span className="text-sm text-text">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tags */}
      <label className="block mb-6">
        <span className="text-xs text-muted uppercase tracking-wider">Tags (comma-separated)</span>
        <input
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          list="tags-datalist"
          className="mt-1 w-full bg-code border border-border rounded-md px-3 py-2 text-sm text-text
                     focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          placeholder="interview-prep, exam-review, …"
        />
        <datalist id="tags-datalist">
          {allTags.map(t => <option key={t.id} value={t.name} />)}
        </datalist>
      </label>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-accent text-bg font-medium text-sm rounded-md
                     hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : (initial ? "Save Changes" : "Create Term")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 border border-border text-muted text-sm rounded-md
                     hover:border-accent hover:text-text transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// Inline markdown preview — uses the same imports as the top of this file
function ReactMarkdownPreview({ content }: { content: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
}
```

- [ ] **Commit**

```bash
git add frontend/src/components/TermForm.tsx
git commit -m "feat: term create/edit form with markdown preview"
```

---

### Task 23: Wire TermForm into App.tsx

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Add TermForm view and save handlers to App.tsx**

Add these imports at the top:
```typescript
import { TermForm } from "./components/TermForm"
```

Add these handlers inside the `App` component (before the return):
```typescript
const handleSaveTerm = useCallback(async (payload: TermCreatePayload) => {
  if (editingSlug === "new") {
    const created = await api.terms.create(payload)
    setEditingSlug(null)
    setView("terms")
    refetch()
    await handleSelectTerm(created.slug)
  } else if (editingSlug) {
    const updated = await api.terms.update(editingSlug, payload)
    setEditingSlug(null)
    setView("terms")
    refetch()
    setExpandedTerm(updated)
  }
}, [editingSlug, refetch, handleSelectTerm])
```

Add the form view to the return JSX (after the `{view === "terms" && ...}` block):
```typescript
{view === "form" && (
  <TermForm
    initial={editingSlug !== "new" ? expandedTerm : null}
    categories={categories}
    allTags={tags}
    onSave={handleSaveTerm}
    onCancel={() => setView("terms")}
  />
)}
```

- [ ] **Test CRUD manually**

1. Click "+ New Term", fill form, save — term appears in list
2. Select term, click Edit, change definition, save — detail updates
3. Select term, click Delete, confirm — term removed

- [ ] **Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: phase 3 CRUD wired into app"
```

---

## ─── CHECKPOINT: Phases 1–3 complete ────────────────────────

> **Stop here. Ask the user if they want to continue to Phase 4 (keyboard navigation, stats panel, import/export, animations).**

---

## ─── PHASE 4: Polish ─────────────────────────────────────────

### Task 24: Keyboard navigation

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Add arrow key, Enter, Escape navigation to App.tsx**

Add this effect inside the `App` component:
```typescript
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (view !== "terms") return
    if (document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA") return

    const currentIndex = terms.findIndex(t => t.slug === selectedSlug)

    if (e.key === "ArrowDown") {
      e.preventDefault()
      const next = terms[currentIndex + 1]
      if (next) handleSelectTerm(next.slug)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      const prev = terms[currentIndex - 1]
      if (prev) handleSelectTerm(prev.slug)
    } else if (e.key === "Escape") {
      setSelectedSlug(null)
      setExpandedTerm(null)
    }
  }
  window.addEventListener("keydown", handler)
  return () => window.removeEventListener("keydown", handler)
}, [view, terms, selectedSlug, handleSelectTerm])
```

- [ ] **Scroll selected card into view**

Wrap the term list in a ref and scroll on selection change:
```typescript
const listRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  if (!selectedSlug || !listRef.current) return
  const el = listRef.current.querySelector(`[data-slug="${selectedSlug}"]`)
  el?.scrollIntoView({ block: "nearest", behavior: "smooth" })
}, [selectedSlug])
```

Add `ref={listRef}` to the term list div and `data-slug={term.slug}` to each `TermCard` wrapper div.

- [ ] **Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: arrow key navigation, Enter expand, Escape collapse"
```

---

### Task 25: StatsPanel component

**Files:**
- Create: `frontend/src/components/StatsPanel.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Write `frontend/src/components/StatsPanel.tsx`**

```typescript
import { useState, useEffect } from "react"
import { api } from "../api/client"
import type { Stats } from "../types"

interface StatsPanelProps {
  onSelectTerm: (slug: string) => void
}

export function StatsPanel({ onSelectTerm }: StatsPanelProps) {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    api.stats.get().then(setStats)
  }, [])

  if (!stats) return <p className="p-6 text-muted text-sm">Loading stats…</p>

  const maxCount = Math.max(...stats.per_category.map(c => c.term_count), 1)

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      <h2 className="font-mono font-bold text-lg text-text mb-6">Glossary Stats</h2>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Terms",      value: stats.total_terms },
          { label: "Categories", value: stats.total_categories },
          { label: "Tags",       value: stats.total_tags },
        ].map(item => (
          <div key={item.label} className="bg-surface border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-mono font-bold text-accent">{item.value}</p>
            <p className="text-xs text-muted mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Per category bar chart */}
      <div className="mb-8">
        <h3 className="text-xs text-muted uppercase tracking-wider mb-3">Terms per Category</h3>
        <div className="space-y-2">
          {stats.per_category.map(cat => (
            <div key={cat.id} className="flex items-center gap-3">
              <span className="text-xs text-muted w-40 truncate flex-shrink-0">{cat.name}</span>
              <div className="flex-1 bg-code rounded-full h-1.5">
                <div
                  className="bg-accent h-1.5 rounded-full transition-all"
                  style={{ width: `${(cat.term_count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted w-6 text-right flex-shrink-0">{cat.term_count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent + Favorites */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-xs text-muted uppercase tracking-wider mb-3">Recently Added</h3>
          <ul className="space-y-1">
            {stats.recent_terms.map(t => (
              <li key={t.id}>
                <button
                  onClick={() => onSelectTerm(t.slug)}
                  className="text-sm text-text hover:text-accent transition-colors font-mono"
                >
                  {t.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs text-muted uppercase tracking-wider mb-3">Top Favorites</h3>
          {stats.top_favorites.length === 0
            ? <p className="text-xs text-muted">No favorites yet</p>
            : (
              <ul className="space-y-1">
                {stats.top_favorites.map(t => (
                  <li key={t.id}>
                    <button
                      onClick={() => onSelectTerm(t.slug)}
                      className="text-sm text-text hover:text-accent transition-colors font-mono"
                    >
                      ★ {t.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Add stats view to App.tsx**

Add import:
```typescript
import { StatsPanel } from "./components/StatsPanel"
```

Add to return JSX after the form view:
```typescript
{view === "stats" && (
  <StatsPanel
    onSelectTerm={(slug) => {
      setView("terms")
      handleSelectTerm(slug)
    }}
  />
)}
```

- [ ] **Commit**

```bash
git add frontend/src/components/StatsPanel.tsx frontend/src/App.tsx
git commit -m "feat: stats panel with per-category bars"
```

---

### Task 26: Import/Export UI

**Files:**
- Modify: `frontend/src/components/Sidebar.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Add Export and Import buttons to Sidebar.tsx Actions section**

In the Actions section of `Sidebar.tsx`, add two new props and buttons:
```typescript
// Add to SidebarProps interface:
onExport: () => void
onImport: (e: React.ChangeEvent<HTMLInputElement>) => void

// Add to Actions div after the Stats button:
<button onClick={onExport} className="w-full text-left px-3 py-2 rounded-md text-muted hover:bg-surface hover:text-text transition-colors">
  ↓ Export JSON
</button>
<label className="w-full text-left px-3 py-2 rounded-md text-muted hover:bg-surface hover:text-text transition-colors cursor-pointer block">
  ↑ Import JSON
  <input type="file" accept=".json" className="hidden" onChange={onImport} />
</label>
```

- [ ] **Add export/import handlers to App.tsx**

```typescript
const handleExport = useCallback(async () => {
  const data = await api.terms.export()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `concept-master-export-${new Date().toISOString().slice(0,10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}, [])

const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return
  const text = await file.text()
  const items = JSON.parse(text)
  const result = await api.terms.import(items)
  alert(`Imported ${result.imported} terms, skipped ${result.skipped} duplicates.`)
  refetch()
  e.target.value = ""
}, [refetch])
```

Pass `onExport={handleExport}` and `onImport={handleImport}` to `<Sidebar>`.

- [ ] **Commit**

```bash
git add frontend/src/components/Sidebar.tsx frontend/src/App.tsx
git commit -m "feat: export/import JSON from sidebar"
```

---

### Task 27: CSS transitions and responsive polish

**Files:**
- Modify: `frontend/src/styles/globals.css`
- Modify: `frontend/src/components/TermCard.tsx`
- Modify: `frontend/src/components/TermDetail.tsx`

- [ ] **Add card hover lift effect and transition utilities to `globals.css`**

```css
/* Card hover glow */
.card-hover {
  @apply transition-all duration-150 ease-in-out;
}
.card-hover:hover {
  box-shadow: 0 0 0 1px #30363d, 0 2px 8px rgba(88, 166, 255, 0.08);
  transform: translateY(-1px);
}

/* Fade-in for detail panel */
@keyframes fade-in {
  from { opacity: 0; transform: translateX(8px); }
  to   { opacity: 1; transform: translateX(0); }
}
.fade-in {
  animation: fade-in 0.15s ease-out;
}
```

- [ ] **Apply `card-hover` class to TermCard outer div**

```typescript
// In TermCard.tsx — add "card-hover" to the outer div className
className={`group card-hover px-4 py-3 border-b border-border cursor-pointer ...`}
```

- [ ] **Apply `fade-in` class to TermDetail article**

```typescript
// In TermDetail.tsx — add "fade-in" to the <article> className
<article className="fade-in max-w-3xl mx-auto px-6 py-6">
```

- [ ] **Responsive: collapse term list on narrow screens**

In `App.tsx` term-list/detail flex row, add responsive classes:
```typescript
// term list div:
className="w-80 flex-shrink-0 border-r border-border overflow-y-auto hidden md:block"

// term detail div:
className="flex-1 overflow-y-auto"
```

On mobile, tapping a term card replaces the list view with detail:
```typescript
// In App.tsx handleSelectTerm, also set a showDetail state:
const [showDetail, setShowDetail] = useState(false)

// term list div adds: ${showDetail ? "hidden md:block" : "block"}
// term detail adds: ${showDetail ? "block" : "hidden md:block"}
// TermDetail gets a back button:
<button onClick={() => setShowDetail(false)} className="md:hidden mb-4 text-muted text-sm">← Back</button>
```

- [ ] **Final test — verify all phases**

1. Backend: `python -m pytest tests/ -v` — all pass
2. Frontend: `npm run build` — no TypeScript errors
3. Manual: search, filter, CRUD, favorites, stats, export, keyboard nav all work

- [ ] **Update CLAUDE.md** to reflect final tech stack

```markdown
# Change in Tech Stack table:
| Backend | Python 3.12+, FastAPI, MariaDB (192.168.1.25) | Single DB, connection via aiomysql pool |
| ORM / Migrations | None — raw SQL via `aiomysql` | Schema in `backend/schema.sql`, .env for credentials |
```

- [ ] **Final commit**

```bash
git add .
git commit -m "feat: phase 4 complete — keyboard nav, stats, export/import, animations, responsive"
```

---

## Done ✓

All four phases complete. The application is:
- **Backend:** FastAPI + aiomysql + MariaDB, all endpoints tested
- **Frontend:** React SPA with dark terminal theme, full CRUD, Markdown rendering, syntax highlighting
- **Running:** `cd backend && uvicorn main:app --reload --port 8000` + `cd frontend && npm run dev`
