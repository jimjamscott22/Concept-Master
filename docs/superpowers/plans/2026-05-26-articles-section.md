# Articles Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a long-form Articles section to Concept Master — `content/articles/*.md` files with YAML frontmatter synced to 5 new DB tables, a full CRUD API, and a mirrored frontend view.

**Architecture:** Mirrors the glossary exactly: files in `content/articles/` are the source of truth, a sync script populates the DB, and CRUD endpoints write back to disk. The existing `categories` and `tags` tables are reused (shared taxonomy). Two new join tables handle article↔term and article↔article relationships. The frontend adds an "Articles" view with the same card/detail/form pattern as terms.

**Tech Stack:** Python/FastAPI/aiomysql (backend), React 18/TypeScript/Tailwind (frontend), `python-frontmatter`, `python-slugify`, `react-markdown`, `prism-react-renderer`.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `backend/schema.sql` | 5 new article tables |
| Modify | `backend/models.py` | Article Pydantic models |
| Create | `backend/content_loader_articles.py` | Parse `content/articles/*.md` |
| Create | `backend/content_writer_articles.py` | Write `ArticleFile` back to disk |
| Create | `backend/sync_articles.py` | Reconcile `content/articles/` → DB |
| Create | `backend/routers/articles.py` | Full CRUD + export/import API |
| Modify | `backend/main.py` | Register articles router + SYNC_ON_START |
| Create | `content/articles/` | 3 sample articles (source of truth) |
| Modify | `frontend/src/types/index.ts` | Article TS interfaces |
| Modify | `frontend/src/api/client.ts` | `api.articles.*` methods |
| Create | `frontend/src/hooks/useArticles.ts` | Fetch/search/filter articles |
| Create | `frontend/src/components/ArticleCard.tsx` | Collapsed article preview |
| Create | `frontend/src/components/ArticleDetail.tsx` | Full body + TOC + related |
| Create | `frontend/src/components/ArticleForm.tsx` | Create/edit form |
| Modify | `frontend/src/components/SiteHeader.tsx` | "Articles" nav item (shortcut 05) |
| Modify | `frontend/src/App.tsx` | articles/article-form views + handlers |

---

## Task 1: DB Schema — 5 New Article Tables

**Files:**
- Modify: `backend/schema.sql`

- [ ] **Step 1: Append the 5 tables to `backend/schema.sql`**

Add after the existing `review_sessions` block:

```sql
-- ── Article tables ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS articles (
    id                   INT          NOT NULL AUTO_INCREMENT,
    title                VARCHAR(255) NOT NULL,
    slug                 VARCHAR(255) NOT NULL,
    subtitle             VARCHAR(500),
    body                 LONGTEXT     NOT NULL,
    summary              VARCHAR(500),
    reading_time_minutes INT          NOT NULL DEFAULT 1,
    is_published         TINYINT(1)   NOT NULL DEFAULT 1,
    created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_articles_title (title),
    UNIQUE KEY uq_articles_slug  (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS article_categories (
    article_id  INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (article_id, category_id),
    CONSTRAINT fk_ac_article  FOREIGN KEY (article_id)  REFERENCES articles(id)   ON DELETE CASCADE,
    CONSTRAINT fk_ac_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS article_tags (
    article_id INT NOT NULL,
    tag_id     INT NOT NULL,
    PRIMARY KEY (article_id, tag_id),
    CONSTRAINT fk_at_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    CONSTRAINT fk_at_tag     FOREIGN KEY (tag_id)     REFERENCES tags(id)     ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS article_related_terms (
    article_id INT NOT NULL,
    term_id    INT NOT NULL,
    PRIMARY KEY (article_id, term_id),
    CONSTRAINT fk_art_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    CONSTRAINT fk_art_term    FOREIGN KEY (term_id)    REFERENCES terms(id)    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS article_related_articles (
    article_a INT NOT NULL,
    article_b INT NOT NULL,
    PRIMARY KEY (article_a, article_b),
    CONSTRAINT fk_ara_a     FOREIGN KEY (article_a) REFERENCES articles(id) ON DELETE CASCADE,
    CONSTRAINT fk_ara_b     FOREIGN KEY (article_b) REFERENCES articles(id) ON DELETE CASCADE,
    CONSTRAINT chk_ara_order CHECK (article_a < article_b)
) ENGINE=InnoDB;

CREATE INDEX IF NOT EXISTS idx_articles_slug      ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(is_published);
CREATE INDEX IF NOT EXISTS idx_articles_created   ON articles(created_at);
```

- [ ] **Step 2: Apply the schema to the running DB**

```bash
uv run python -m backend.database
```

Expected: No errors. Tables `articles`, `article_categories`, `article_tags`, `article_related_terms`, `article_related_articles` now exist.

- [ ] **Step 3: Verify tables exist**

```bash
uv run python -c "
import asyncio, aiomysql
from backend.database import create_pool

async def check():
    pool = await create_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute('SHOW TABLES LIKE \"article%\"')
            rows = await cur.fetchall()
            for r in rows: print(r)
    pool.close()
    await pool.wait_closed()

asyncio.run(check())
"
```

Expected output: 5 lines showing the 5 new tables.

- [ ] **Step 4: Commit**

```bash
git add backend/schema.sql
git commit -m "feat(schema): add 5 article tables"
```

---

## Task 2: Pydantic Models

**Files:**
- Modify: `backend/models.py`

- [ ] **Step 1: Write a failing test for ArticleResponse**

Create `tests/test_article_models.py`:

```python
from datetime import datetime
from backend.models import ArticleResponse, ArticleDetailResponse, ArticleListResponse, ArticleSummary


def test_article_summary():
    s = ArticleSummary(id=1, title="Big-O", slug="big-o")
    assert s.slug == "big-o"


def test_article_response_coerces_is_published():
    r = ArticleResponse(
        id=1, title="T", slug="t", subtitle=None, body="body",
        summary="sum", reading_time_minutes=1, is_published=1,
        categories=[], tags=[], created_at=datetime.now(), updated_at=datetime.now(),
    )
    assert r.is_published is True


def test_article_detail_response_has_related():
    r = ArticleDetailResponse(
        id=1, title="T", slug="t", subtitle=None, body="body",
        summary="sum", reading_time_minutes=1, is_published=True,
        categories=[], tags=[], related_terms=[], related_articles=[],
        created_at=datetime.now(), updated_at=datetime.now(),
    )
    assert r.related_terms == []
    assert r.related_articles == []


def test_article_list_response():
    lr = ArticleListResponse(articles=[], total=0, limit=20, offset=0)
    assert lr.total == 0
```

- [ ] **Step 2: Run test to verify it fails**

```bash
uv run pytest tests/test_article_models.py -v
```

Expected: `ImportError` — models not defined yet.

- [ ] **Step 3: Add models to `backend/models.py`**

Append after the `StreakResponse` class:

```python
# ── Article models ────────────────────────────────────────────────────────────


class ArticleSummary(BaseModel):
    id: int
    title: str
    slug: str


class ArticleBase(BaseModel):
    title: str
    subtitle: Optional[str] = None
    body: str


class ArticleCreate(ArticleBase):
    category_ids: List[int] = []
    tag_names: List[str] = []
    related_term_ids: List[int] = []
    related_article_ids: List[int] = []


class ArticleUpdate(ArticleBase):
    category_ids: List[int] = []
    tag_names: List[str] = []
    related_term_ids: List[int] = []
    related_article_ids: List[int] = []


class ArticleResponse(ArticleBase):
    id: int
    slug: str
    summary: Optional[str] = None
    reading_time_minutes: int
    is_published: bool
    categories: List[CategoryResponse] = []
    tags: List[TagResponse] = []
    created_at: datetime
    updated_at: datetime

    @field_validator("is_published", mode="before")
    @classmethod
    def coerce_published(cls, v: object) -> bool:
        return bool(v)


class ArticleDetailResponse(ArticleResponse):
    related_terms: List[TermSummary] = []
    related_articles: List[ArticleSummary] = []


class ArticleListResponse(BaseModel):
    articles: List[ArticleResponse]
    total: int
    limit: int
    offset: int


class ArticleImportItem(ArticleBase):
    category_ids: List[int] = []
    tag_names: List[str] = []
    related_term_ids: List[int] = []
    related_article_ids: List[int] = []
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
uv run pytest tests/test_article_models.py -v
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/models.py tests/test_article_models.py
git commit -m "feat(models): add Article Pydantic models"
```

---

## Task 3: Content Loader for Articles

**Files:**
- Create: `backend/content_loader_articles.py`
- Test: `tests/test_content_loader_articles.py`

- [ ] **Step 1: Write failing tests**

Create `tests/test_content_loader_articles.py`:

```python
import textwrap
from pathlib import Path
import pytest
from backend.content_loader_articles import load_article, load_all_articles, ArticleFile, _extract_summary, _reading_time


def _write(tmp_path: Path, slug: str, content: str) -> Path:
    p = tmp_path / "articles" / f"{slug}.md"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")
    return p


def test_load_article_basic(tmp_path):
    content = textwrap.dedent("""\
        ---
        title: My Article
        categories: [algorithms]
        tags: [exam-review]
        ---

        This is the body.
    """)
    p = _write(tmp_path, "my-article", content)
    article = load_article(p)
    assert article.slug == "my-article"
    assert article.title == "My Article"
    assert "This is the body" in article.body
    assert article.categories == ["algorithms"]
    assert article.tags == ["exam-review"]
    assert article.is_published is True
    assert article.subtitle is None


def test_load_article_with_subtitle(tmp_path):
    content = textwrap.dedent("""\
        ---
        title: Big-O
        subtitle: A guide to complexity
        ---

        Body here.
    """)
    p = _write(tmp_path, "big-o", content)
    article = load_article(p)
    assert article.subtitle == "A guide to complexity"


def test_load_article_draft(tmp_path):
    content = textwrap.dedent("""\
        ---
        title: Draft Post
        is_published: false
        ---

        Body.
    """)
    p = _write(tmp_path, "draft-post", content)
    article = load_article(p)
    assert article.is_published is False


def test_load_article_related(tmp_path):
    content = textwrap.dedent("""\
        ---
        title: Test
        related_terms: [binary-search, sorting]
        related_articles: [other-article]
        ---

        Body.
    """)
    p = _write(tmp_path, "test", content)
    article = load_article(p)
    assert article.related_terms == ["binary-search", "sorting"]
    assert article.related_articles == ["other-article"]


def test_load_article_missing_title_raises(tmp_path):
    content = "---\ncategories: []\n---\n\nBody text.\n"
    p = _write(tmp_path, "no-title", content)
    with pytest.raises(ValueError, match="title"):
        load_article(p)


def test_load_all_articles(tmp_path):
    for slug, title in [("aaa", "AAA"), ("bbb", "BBB")]:
        _write(tmp_path, slug, f"---\ntitle: {title}\n---\n\nBody.\n")
    articles = load_all_articles(tmp_path)
    assert [a.slug for a in articles] == ["aaa", "bbb"]


def test_extract_summary_strips_markdown():
    body = "## Heading\n\nThis is **bold** and `code` text."
    summary = _extract_summary(body)
    assert "**" not in summary
    assert "`" not in summary
    assert "This is" in summary


def test_extract_summary_skips_headings():
    body = "# Heading\n\nFirst real paragraph here."
    summary = _extract_summary(body)
    assert "First real paragraph" in summary
    assert "#" not in summary


def test_extract_summary_max_chars():
    body = "Word " * 200
    summary = _extract_summary(body, max_chars=50)
    assert len(summary) <= 50


def test_reading_time_minimum_one():
    assert _reading_time("Short.") == 1


def test_reading_time_five_minutes():
    body = ("word " * 1000)
    assert _reading_time(body) == 5
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
uv run pytest tests/test_content_loader_articles.py -v
```

Expected: `ModuleNotFoundError` — file does not exist yet.

- [ ] **Step 3: Create `backend/content_loader_articles.py`**

```python
"""Parse article Markdown files from content/articles/.

Each article is a Markdown file with YAML frontmatter. The entire body is kept
as-is (no code extraction). Summary and reading time are computed at sync time,
not stored in files.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional

import frontmatter


@dataclass
class ArticleFile:
    slug: str
    title: str
    body: str
    subtitle: Optional[str] = None
    is_published: bool = True
    categories: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    related_terms: List[str] = field(default_factory=list)
    related_articles: List[str] = field(default_factory=list)


def _extract_summary(body: str, max_chars: int = 300) -> str:
    """Return the first non-heading, non-code paragraph with markdown stripped."""
    for block in re.split(r"\n\n+", body):
        block = block.strip()
        if not block:
            continue
        if block.startswith("#") or block.startswith("```"):
            continue
        text = re.sub(r"```[\s\S]*?```", "", block)
        text = re.sub(r"[#*`_\[\]()>|]", " ", text)
        text = re.sub(r"\s+", " ", text).strip()
        if text:
            return text[:max_chars]
    return ""


def _reading_time(body: str) -> int:
    """Estimate reading time in minutes at 200 wpm."""
    text = re.sub(r"```[\s\S]*?```", "", body)
    text = re.sub(r"[#*`_\[\]()>|]", " ", text)
    words = len(text.split())
    return max(1, round(words / 200))


def load_article(path: Path) -> ArticleFile:
    """Load and parse a single article Markdown file."""
    post = frontmatter.loads(path.read_text(encoding="utf-8"))
    meta = post.metadata or {}

    slug = path.stem
    title = meta.get("title")
    if not isinstance(title, str) or not title.strip():
        raise ValueError(f"{path}: frontmatter must include a non-empty 'title'")

    subtitle = meta.get("subtitle")
    if subtitle is not None and not isinstance(subtitle, str):
        raise ValueError(f"{path}: 'subtitle' must be a string")

    def _str_list(key: str) -> List[str]:
        raw = meta.get(key, []) or []
        if not isinstance(raw, list) or not all(isinstance(x, str) for x in raw):
            raise ValueError(f"{path}: '{key}' must be a list of strings")
        return [x.strip() for x in raw if x and x.strip()]

    body = (post.content or "").strip() + "\n"

    return ArticleFile(
        slug=slug,
        title=title.strip(),
        subtitle=subtitle.strip() if subtitle else None,
        body=body,
        is_published=bool(meta.get("is_published", True)),
        categories=_str_list("categories"),
        tags=_str_list("tags"),
        related_terms=_str_list("related_terms"),
        related_articles=_str_list("related_articles"),
    )


def load_all_articles(root: Path) -> List[ArticleFile]:
    """Load every `.md` file under `<root>/articles/` sorted by slug."""
    articles_dir = root / "articles"
    if not articles_dir.is_dir():
        return []
    return [load_article(p) for p in sorted(articles_dir.glob("*.md"))]
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
uv run pytest tests/test_content_loader_articles.py -v
```

Expected: 11 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/content_loader_articles.py tests/test_content_loader_articles.py
git commit -m "feat(backend): article content loader with summary + reading-time helpers"
```

---

## Task 4: Content Writer for Articles

**Files:**
- Create: `backend/content_writer_articles.py`
- Test: `tests/test_content_writer_articles.py`

- [ ] **Step 1: Write failing tests**

Create `tests/test_content_writer_articles.py`:

```python
from pathlib import Path
from backend.content_loader_articles import ArticleFile, load_article
from backend.content_writer_articles import write_article, delete_article


def _make_article(**kwargs) -> ArticleFile:
    defaults = dict(
        slug="test-article",
        title="Test Article",
        body="## Heading\n\nSome body text.\n",
        subtitle="A subtitle",
        is_published=True,
        categories=["algorithms"],
        tags=["exam-review"],
        related_terms=["binary-search"],
        related_articles=[],
    )
    defaults.update(kwargs)
    return ArticleFile(**defaults)


def test_write_article_creates_file(tmp_path):
    article = _make_article()
    path = write_article(article, tmp_path)
    assert path.exists()
    assert path.name == "test-article.md"


def test_write_article_round_trips(tmp_path):
    original = _make_article()
    write_article(original, tmp_path)
    reloaded = load_article(tmp_path / "articles" / "test-article.md")
    assert reloaded.title == original.title
    assert reloaded.subtitle == original.subtitle
    assert reloaded.categories == original.categories
    assert reloaded.tags == original.tags
    assert reloaded.related_terms == original.related_terms
    assert reloaded.is_published == original.is_published
    assert reloaded.body.strip() == original.body.strip()


def test_write_article_no_subtitle(tmp_path):
    article = _make_article(subtitle=None)
    write_article(article, tmp_path)
    reloaded = load_article(tmp_path / "articles" / "test-article.md")
    assert reloaded.subtitle is None


def test_write_article_draft(tmp_path):
    article = _make_article(is_published=False)
    write_article(article, tmp_path)
    reloaded = load_article(tmp_path / "articles" / "test-article.md")
    assert reloaded.is_published is False


def test_delete_article(tmp_path):
    article = _make_article()
    path = write_article(article, tmp_path)
    assert path.exists()
    delete_article("test-article", tmp_path)
    assert not path.exists()


def test_delete_article_missing_ok(tmp_path):
    delete_article("nonexistent", tmp_path)  # must not raise
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
uv run pytest tests/test_content_writer_articles.py -v
```

Expected: `ModuleNotFoundError`.

- [ ] **Step 3: Create `backend/content_writer_articles.py`**

```python
"""Serialize ArticleFile records back to Markdown on disk."""
from __future__ import annotations

from pathlib import Path

import yaml

from .content_loader_articles import ArticleFile


_CANONICAL_KEYS = ("title", "subtitle", "categories", "tags", "related_terms", "related_articles", "is_published")


def _frontmatter(article: ArticleFile) -> str:
    data: dict[str, object] = {"title": article.title}
    if article.subtitle:
        data["subtitle"] = article.subtitle
    data["categories"] = list(article.categories)
    data["tags"] = list(article.tags)
    if article.related_terms:
        data["related_terms"] = list(article.related_terms)
    if article.related_articles:
        data["related_articles"] = list(article.related_articles)
    if not article.is_published:
        data["is_published"] = False

    ordered = {k: data[k] for k in _CANONICAL_KEYS if k in data}
    return yaml.safe_dump(ordered, sort_keys=False, allow_unicode=True, default_flow_style=False).rstrip() + "\n"


def write_article(article: ArticleFile, root: Path) -> Path:
    """Write `<root>/articles/<slug>.md` and return the path."""
    articles_dir = root / "articles"
    articles_dir.mkdir(parents=True, exist_ok=True)
    path = articles_dir / f"{article.slug}.md"
    body = (article.body or "").rstrip()
    text = f"---\n{_frontmatter(article)}---\n\n{body}\n"
    path.write_text(text, encoding="utf-8")
    return path


def delete_article(slug: str, root: Path) -> None:
    path = root / "articles" / f"{slug}.md"
    path.unlink(missing_ok=True)
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
uv run pytest tests/test_content_writer_articles.py -v
```

Expected: 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/content_writer_articles.py tests/test_content_writer_articles.py
git commit -m "feat(backend): article content writer with round-trip support"
```

---

## Task 5: Sync Articles Script

**Files:**
- Create: `backend/sync_articles.py`
- Test: `tests/test_sync_articles_helpers.py`

- [ ] **Step 1: Write failing tests for pure helpers**

Create `tests/test_sync_articles_helpers.py`:

```python
from backend.sync_articles import SyncReport


def test_sync_report_format_shows_counts():
    r = SyncReport(inserted=2, updated=1, unchanged=5, deleted=0)
    text = r.format()
    assert "inserted:  2" in text
    assert "updated:   1" in text
    assert "unchanged: 5" in text
    assert "deleted:   0" in text


def test_sync_report_format_shows_warnings():
    r = SyncReport(warnings=["term 'foo': unknown category 'bar'"])
    text = r.format()
    assert "foo" in text
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
uv run pytest tests/test_sync_articles_helpers.py -v
```

Expected: `ModuleNotFoundError`.

- [ ] **Step 3: Create `backend/sync_articles.py`**

```python
"""Reconcile the articles database against the content/articles/ directory.

Run directly::

    uv run python -m backend.sync_articles
    uv run python -m backend.sync_articles --prune
"""
from __future__ import annotations

import argparse
import asyncio
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, List

import aiomysql
from slugify import slugify

from .content_loader_articles import ArticleFile, _extract_summary, _reading_time, load_all_articles
from .database import PROJECT_ROOT, create_pool
from .sync_content import _upsert_categories, _upsert_tag


DEFAULT_CONTENT_ROOT = PROJECT_ROOT / "content"


@dataclass
class SyncReport:
    inserted: int = 0
    updated: int = 0
    unchanged: int = 0
    deleted: int = 0
    warnings: List[str] = field(default_factory=list)

    def format(self) -> str:
        lines = [
            f"  inserted:  {self.inserted}",
            f"  updated:   {self.updated}",
            f"  unchanged: {self.unchanged}",
            f"  deleted:   {self.deleted}",
            f"  warnings:  {len(self.warnings)}",
        ]
        for w in self.warnings:
            lines.append(f"    - {w}")
        return "Article sync complete:\n" + "\n".join(lines)


async def _upsert_article(
    conn: aiomysql.Connection,
    article: ArticleFile,
) -> tuple[int, str]:
    summary = _extract_summary(article.body)
    reading_time = _reading_time(article.body)
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT * FROM articles WHERE slug = %s", (article.slug,))
        existing = await cur.fetchone()

        if existing is None:
            await cur.execute(
                """INSERT INTO articles
                   (title, slug, subtitle, body, summary, reading_time_minutes, is_published)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (
                    article.title,
                    article.slug,
                    article.subtitle,
                    article.body,
                    summary,
                    reading_time,
                    1 if article.is_published else 0,
                ),
            )
            return cur.lastrowid, "inserted"

        fields = {
            "title": article.title,
            "subtitle": article.subtitle,
            "body": article.body,
            "summary": summary,
            "reading_time_minutes": reading_time,
            "is_published": 1 if article.is_published else 0,
        }
        dirty = any(existing.get(k) != v for k, v in fields.items())
        if dirty:
            await cur.execute(
                """UPDATE articles
                      SET title=%s, subtitle=%s, body=%s, summary=%s,
                          reading_time_minutes=%s, is_published=%s, updated_at=NOW()
                    WHERE id=%s""",
                (
                    article.title,
                    article.subtitle,
                    article.body,
                    summary,
                    reading_time,
                    1 if article.is_published else 0,
                    existing["id"],
                ),
            )
            return existing["id"], "updated"
        return existing["id"], "unchanged"


async def _replace_article_joins(
    conn: aiomysql.Connection,
    article: ArticleFile,
    article_id: int,
    category_ids: dict[str, int],
    slug_to_term_id: dict[str, int],
    slug_to_article_id: dict[str, int],
    report: SyncReport,
) -> None:
    async with conn.cursor() as cur:
        await cur.execute("DELETE FROM article_categories WHERE article_id = %s", (article_id,))
        await cur.execute("DELETE FROM article_tags WHERE article_id = %s", (article_id,))
        await cur.execute("DELETE FROM article_related_terms WHERE article_id = %s", (article_id,))
        await cur.execute(
            "DELETE FROM article_related_articles WHERE article_a = %s OR article_b = %s",
            (article_id, article_id),
        )

        for slug in article.categories:
            cat_id = category_ids.get(slug)
            if cat_id is None:
                report.warnings.append(
                    f"article '{article.slug}': unknown category '{slug}' (not in categories.yml)"
                )
                continue
            await cur.execute(
                "INSERT IGNORE INTO article_categories (article_id, category_id) VALUES (%s, %s)",
                (article_id, cat_id),
            )

    for tag_name in article.tags:
        tag_id = await _upsert_tag(conn, tag_name)
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT IGNORE INTO article_tags (article_id, tag_id) VALUES (%s, %s)",
                (article_id, tag_id),
            )

    async with conn.cursor() as cur:
        for term_slug in article.related_terms:
            term_id = slug_to_term_id.get(term_slug)
            if term_id is None:
                report.warnings.append(
                    f"article '{article.slug}': related term '{term_slug}' not found; skipped"
                )
                continue
            await cur.execute(
                "INSERT IGNORE INTO article_related_terms (article_id, term_id) VALUES (%s, %s)",
                (article_id, term_id),
            )

        for other_slug in article.related_articles:
            other_id = slug_to_article_id.get(other_slug)
            if other_id is None:
                report.warnings.append(
                    f"article '{article.slug}': related article '{other_slug}' not found; skipped"
                )
                continue
            if other_id == article_id:
                continue
            a, b = (article_id, other_id) if article_id < other_id else (other_id, article_id)
            await cur.execute(
                "INSERT IGNORE INTO article_related_articles (article_a, article_b) VALUES (%s, %s)",
                (a, b),
            )


async def sync_articles(
    pool: aiomysql.Pool,
    content_root: Path = DEFAULT_CONTENT_ROOT,
    prune: bool = False,
) -> SyncReport:
    """Full reconciliation of content/articles/ -> database."""
    from .content_loader import load_categories

    report = SyncReport()
    categories = load_categories(content_root / "categories.yml")
    articles = load_all_articles(content_root)

    async with pool.acquire() as conn:
        category_ids = await _upsert_categories(conn, categories)

        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT id, slug FROM terms")
            slug_to_term_id = {r["slug"]: r["id"] for r in await cur.fetchall()}

        slug_to_article_id: dict[str, int] = {}
        for article in articles:
            aid, action = await _upsert_article(conn, article)
            slug_to_article_id[article.slug] = aid
            if action == "inserted":
                report.inserted += 1
            elif action == "updated":
                report.updated += 1
            else:
                report.unchanged += 1

        for article in articles:
            aid = slug_to_article_id[article.slug]
            await _replace_article_joins(
                conn, article, aid, category_ids, slug_to_term_id, slug_to_article_id, report
            )

        if prune:
            file_slugs = {a.slug for a in articles}
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute("SELECT id, slug FROM articles")
                rows = await cur.fetchall()
                for row in rows:
                    if row["slug"] not in file_slugs:
                        await cur.execute("DELETE FROM articles WHERE id = %s", (row["id"],))
                        report.deleted += 1

    return report


async def _main(prune: bool, content_root: Path) -> None:
    pool = await create_pool()
    try:
        report = await sync_articles(pool, content_root=content_root, prune=prune)
    finally:
        pool.close()
        await pool.wait_closed()
    print(report.format())


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync content/articles/ -> database")
    parser.add_argument("--prune", action="store_true", help="Delete DB articles whose .md file is missing")
    parser.add_argument("--content-root", default=str(DEFAULT_CONTENT_ROOT))
    args = parser.parse_args()
    asyncio.run(_main(args.prune, Path(args.content_root)))


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run helper tests to verify they pass**

```bash
uv run pytest tests/test_sync_articles_helpers.py -v
```

Expected: 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/sync_articles.py tests/test_sync_articles_helpers.py
git commit -m "feat(backend): sync_articles — reconcile content/articles/ to DB"
```

---

## Task 6: Articles API Router

**Files:**
- Create: `backend/routers/articles.py`

- [ ] **Step 1: Create `backend/routers/articles.py`**

```python
import aiomysql
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from slugify import slugify

from ..content_loader_articles import ArticleFile, _extract_summary, _reading_time
from ..content_writer_articles import delete_article as delete_article_file, write_article
from ..database import PROJECT_ROOT, get_db
from ..models import (
    ArticleCreate, ArticleUpdate, ArticleResponse, ArticleDetailResponse,
    ArticleListResponse, ArticleSummary, ArticleImportItem,
)


CONTENT_ROOT = PROJECT_ROOT / "content"


# ── Private helpers ───────────────────────────────────────────────────────────

async def _get_article_categories(conn: aiomysql.Connection, article_id: int) -> list:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("""
            SELECT c.id, c.name, c.slug, 0 AS term_count
            FROM categories c
            JOIN article_categories ac ON c.id = ac.category_id
            WHERE ac.article_id = %s
        """, (article_id,))
        return await cur.fetchall()


async def _get_article_tags(conn: aiomysql.Connection, article_id: int) -> list:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("""
            SELECT t.id, t.name, 0 AS term_count
            FROM tags t
            JOIN article_tags at_ ON t.id = at_.tag_id
            WHERE at_.article_id = %s
        """, (article_id,))
        return await cur.fetchall()


async def _get_article_related_terms(conn: aiomysql.Connection, article_id: int) -> list:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("""
            SELECT t.id, t.name, t.slug
            FROM terms t
            JOIN article_related_terms art ON t.id = art.term_id
            WHERE art.article_id = %s
        """, (article_id,))
        return await cur.fetchall()


async def _get_article_related_articles(conn: aiomysql.Connection, article_id: int) -> list:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("""
            SELECT a.id, a.title, a.slug
            FROM articles a
            JOIN article_related_articles ara
              ON (ara.article_a = a.id OR ara.article_b = a.id)
            WHERE (ara.article_a = %s OR ara.article_b = %s) AND a.id != %s
        """, (article_id, article_id, article_id))
        return await cur.fetchall()


async def _enrich_article(conn: aiomysql.Connection, row: dict) -> dict:
    row["is_published"] = bool(row["is_published"])
    row["categories"] = await _get_article_categories(conn, row["id"])
    row["tags"] = await _get_article_tags(conn, row["id"])
    return row


async def _get_article_row(conn: aiomysql.Connection, slug: str) -> dict:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT * FROM articles WHERE slug = %s", (slug,))
        row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Article '{slug}' not found")
    return row


async def _upsert_tags(conn: aiomysql.Connection, tag_names: List[str]) -> List[int]:
    ids = []
    async with conn.cursor(aiomysql.DictCursor) as cur:
        for name in tag_names:
            name = name.strip().lower()
            if not name:
                continue
            await cur.execute("INSERT IGNORE INTO tags (name) VALUES (%s)", (name,))
            await cur.execute("SELECT id FROM tags WHERE name = %s", (name,))
            row = await cur.fetchone()
            if row:
                ids.append(row["id"])
    return ids


async def _sync_article_associations(
    conn: aiomysql.Connection,
    article_id: int,
    category_ids: List[int],
    tag_names: List[str],
    related_term_ids: List[int],
    related_article_ids: List[int],
) -> None:
    async with conn.cursor() as cur:
        await cur.execute("DELETE FROM article_categories WHERE article_id = %s", (article_id,))
        await cur.execute("DELETE FROM article_tags WHERE article_id = %s", (article_id,))
        await cur.execute("DELETE FROM article_related_terms WHERE article_id = %s", (article_id,))
        await cur.execute(
            "DELETE FROM article_related_articles WHERE article_a = %s OR article_b = %s",
            (article_id, article_id),
        )

        for cat_id in category_ids:
            await cur.execute(
                "INSERT IGNORE INTO article_categories (article_id, category_id) VALUES (%s, %s)",
                (article_id, cat_id),
            )

        tag_ids = await _upsert_tags(conn, tag_names)
        for tag_id in tag_ids:
            await cur.execute(
                "INSERT IGNORE INTO article_tags (article_id, tag_id) VALUES (%s, %s)",
                (article_id, tag_id),
            )

        for term_id in related_term_ids:
            await cur.execute(
                "INSERT IGNORE INTO article_related_terms (article_id, term_id) VALUES (%s, %s)",
                (article_id, term_id),
            )

        for other_id in related_article_ids:
            if other_id == article_id:
                continue
            a, b = (article_id, other_id) if article_id < other_id else (other_id, article_id)
            await cur.execute(
                "INSERT IGNORE INTO article_related_articles (article_a, article_b) VALUES (%s, %s)",
                (a, b),
            )


async def _article_to_file(conn: aiomysql.Connection, row: dict) -> ArticleFile:
    cats = await _get_article_categories(conn, row["id"])
    tags = await _get_article_tags(conn, row["id"])
    related_terms = await _get_article_related_terms(conn, row["id"])
    related_articles = await _get_article_related_articles(conn, row["id"])
    return ArticleFile(
        slug=row["slug"],
        title=row["title"],
        subtitle=row.get("subtitle"),
        body=(row.get("body") or "").strip() + "\n",
        is_published=bool(row.get("is_published", True)),
        categories=sorted(c["slug"] for c in cats),
        tags=sorted(t["name"] for t in tags),
        related_terms=sorted(t["slug"] for t in related_terms),
        related_articles=sorted(a["slug"] for a in related_articles),
    )


async def _persist_to_disk(conn: aiomysql.Connection, slug: str) -> None:
    row = await _get_article_row(conn, slug)
    article_file = await _article_to_file(conn, row)
    write_article(article_file, CONTENT_ROOT)


router = APIRouter()


# ── Read endpoints ─────────────────────────────────────────────────────────────

@router.get("", response_model=ArticleListResponse)
async def list_articles(
    q: Optional[str] = None,
    category: Optional[str] = None,
    tag: Optional[str] = None,
    published_only: bool = False,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    conn: aiomysql.Connection = Depends(get_db),
):
    joins, conditions, params = "", [], []

    if category:
        joins += " JOIN article_categories ac ON a.id = ac.article_id JOIN categories c ON ac.category_id = c.id"
        conditions.append("c.slug = %s")
        params.append(category)
    if tag:
        joins += " JOIN article_tags at_ ON a.id = at_.article_id JOIN tags tg ON at_.tag_id = tg.id"
        conditions.append("tg.name = %s")
        params.append(tag)
    if q:
        conditions.append("(a.title LIKE %s OR a.body LIKE %s)")
        params.extend([f"%{q}%", f"%{q}%"])
    if published_only:
        conditions.append("a.is_published = 1")

    where = (" WHERE " + " AND ".join(conditions)) if conditions else ""

    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            f"SELECT COUNT(DISTINCT a.id) AS total FROM articles a{joins}{where}", params
        )
        total = (await cur.fetchone())["total"]

        await cur.execute(
            f"SELECT DISTINCT a.* FROM articles a{joins}{where} ORDER BY a.created_at DESC LIMIT %s OFFSET %s",
            params + [limit, offset],
        )
        rows = await cur.fetchall()

    articles = [await _enrich_article(conn, row) for row in rows]
    return {"articles": articles, "total": total, "limit": limit, "offset": offset}


@router.get("/export")
async def export_articles(conn: aiomysql.Connection = Depends(get_db)):
    """Export all articles as a JSON array."""
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT * FROM articles ORDER BY title")
        rows = await cur.fetchall()

    result = []
    for row in rows:
        row = await _enrich_article(conn, row)
        row["related_terms"] = await _get_article_related_terms(conn, row["id"])
        row["related_articles"] = await _get_article_related_articles(conn, row["id"])
        result.append(row)
    return result


@router.get("/summaries", response_model=List[ArticleSummary])
async def list_article_summaries(conn: aiomysql.Connection = Depends(get_db)):
    """Lightweight article records for relationship selectors."""
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT id, title, slug FROM articles ORDER BY title")
        return await cur.fetchall()


@router.get("/{slug}", response_model=ArticleDetailResponse)
async def get_article(slug: str, conn: aiomysql.Connection = Depends(get_db)):
    row = await _get_article_row(conn, slug)
    row = await _enrich_article(conn, row)
    row["related_terms"] = await _get_article_related_terms(conn, row["id"])
    row["related_articles"] = await _get_article_related_articles(conn, row["id"])
    return row


# ── Write endpoints ───────────────────────────────────────────────────────────

@router.post("", response_model=ArticleDetailResponse, status_code=201)
async def create_article(body: ArticleCreate, conn: aiomysql.Connection = Depends(get_db)):
    slug = slugify(body.title)
    summary = _extract_summary(body.body)
    reading_time = _reading_time(body.body)
    async with conn.cursor(aiomysql.DictCursor) as cur:
        try:
            await cur.execute(
                """INSERT INTO articles (title, slug, subtitle, body, summary, reading_time_minutes)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (body.title, slug, body.subtitle, body.body, summary, reading_time),
            )
            article_id = cur.lastrowid
        except aiomysql.IntegrityError:
            raise HTTPException(status_code=409, detail=f"Article '{body.title}' already exists")

    await _sync_article_associations(
        conn, article_id, body.category_ids, body.tag_names,
        body.related_term_ids, body.related_article_ids,
    )
    try:
        await _persist_to_disk(conn, slug)
    except Exception:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM articles WHERE id = %s", (article_id,))
        raise
    row = await _get_article_row(conn, slug)
    row = await _enrich_article(conn, row)
    row["related_terms"] = await _get_article_related_terms(conn, row["id"])
    row["related_articles"] = await _get_article_related_articles(conn, row["id"])
    return row


@router.put("/{slug}", response_model=ArticleDetailResponse)
async def update_article(
    slug: str, body: ArticleUpdate, conn: aiomysql.Connection = Depends(get_db)
):
    row = await _get_article_row(conn, slug)
    new_slug = slugify(body.title)
    summary = _extract_summary(body.body)
    reading_time = _reading_time(body.body)
    async with conn.cursor() as cur:
        try:
            await cur.execute(
                """UPDATE articles
                   SET title=%s, slug=%s, subtitle=%s, body=%s,
                       summary=%s, reading_time_minutes=%s, updated_at=NOW()
                   WHERE id=%s""",
                (body.title, new_slug, body.subtitle, body.body, summary, reading_time, row["id"]),
            )
        except aiomysql.IntegrityError:
            raise HTTPException(status_code=409, detail=f"Title '{body.title}' is already taken")

    await _sync_article_associations(
        conn, row["id"], body.category_ids, body.tag_names,
        body.related_term_ids, body.related_article_ids,
    )
    await _persist_to_disk(conn, new_slug)
    if new_slug != slug:
        delete_article_file(slug, CONTENT_ROOT)
    updated = await _get_article_row(conn, new_slug)
    updated = await _enrich_article(conn, updated)
    updated["related_terms"] = await _get_article_related_terms(conn, updated["id"])
    updated["related_articles"] = await _get_article_related_articles(conn, updated["id"])
    return updated


@router.delete("/{slug}", status_code=204)
async def delete_article(slug: str, conn: aiomysql.Connection = Depends(get_db)):
    row = await _get_article_row(conn, slug)
    async with conn.cursor() as cur:
        await cur.execute("DELETE FROM articles WHERE id = %s", (row["id"],))
    delete_article_file(slug, CONTENT_ROOT)


@router.patch("/{slug}/publish", response_model=ArticleResponse)
async def toggle_publish(slug: str, conn: aiomysql.Connection = Depends(get_db)):
    row = await _get_article_row(conn, slug)
    new_val = 0 if row["is_published"] else 1
    async with conn.cursor() as cur:
        await cur.execute(
            "UPDATE articles SET is_published = %s WHERE id = %s", (new_val, row["id"])
        )
    await _persist_to_disk(conn, slug)
    updated = await _get_article_row(conn, slug)
    return await _enrich_article(conn, updated)


# ── Bulk import ───────────────────────────────────────────────────────────────

@router.post("/import", status_code=201)
async def import_articles(
    items: List[ArticleImportItem], conn: aiomysql.Connection = Depends(get_db)
):
    """Bulk import articles. Skips duplicates by title."""
    imported, skipped = 0, 0
    for item in items:
        slug = slugify(item.title)
        summary = _extract_summary(item.body)
        reading_time = _reading_time(item.body)
        async with conn.cursor(aiomysql.DictCursor) as cur:
            try:
                await cur.execute(
                    """INSERT INTO articles (title, slug, subtitle, body, summary, reading_time_minutes)
                       VALUES (%s, %s, %s, %s, %s, %s)""",
                    (item.title, slug, item.subtitle, item.body, summary, reading_time),
                )
                article_id = cur.lastrowid
            except aiomysql.IntegrityError:
                skipped += 1
                continue
        await _sync_article_associations(
            conn, article_id, item.category_ids, item.tag_names,
            item.related_term_ids, item.related_article_ids,
        )
        imported += 1
    return {"imported": imported, "skipped": skipped}
```

- [ ] **Step 2: Commit**

```bash
git add backend/routers/articles.py
git commit -m "feat(backend): articles CRUD router with publish toggle + export/import"
```

---

## Task 7: Wire Backend + Sample Content

**Files:**
- Modify: `backend/main.py`
- Create: `content/articles/understanding-big-o-notation.md`
- Create: `content/articles/how-sql-joins-work.md`
- Create: `content/articles/oop-vs-functional-programming.md`

- [ ] **Step 1: Register articles router and sync in `backend/main.py`**

Change the imports and lifespan to:

```python
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import create_pool
from .routers import categories, tags, terms, stats, review
from .routers import articles
from .sync_content import DEFAULT_CONTENT_ROOT, sync_content
from .sync_articles import sync_articles


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pool = await create_pool()
    if os.getenv("SYNC_ON_START") == "1":
        report = await sync_content(app.state.pool, DEFAULT_CONTENT_ROOT)
        print(report.format())
        article_report = await sync_articles(app.state.pool, DEFAULT_CONTENT_ROOT)
        print(article_report.format())
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
app.include_router(review.router,     prefix="/api/review",     tags=["review"])
app.include_router(articles.router,   prefix="/api/articles",   tags=["articles"])
```

- [ ] **Step 2: Create `content/articles/understanding-big-o-notation.md`**

```markdown
---
title: Understanding Big-O Notation
subtitle: A practical guide to algorithm complexity analysis
categories: [algorithms]
tags: [fundamentals, exam-review, interview-prep]
related_terms: [binary-search-tree, sorting-algorithms]
---

## What Is Big-O?

Big-O notation describes the **upper bound** on how the runtime or memory usage of an algorithm grows as the input size `n` increases. It lets you compare algorithms without worrying about hardware or language differences.

The key insight: we care about the *shape* of growth, not the constant factors. An O(n) algorithm with a million-step constant is still O(n).

## Common Complexity Classes

| Notation | Name | Example |
|----------|------|---------|
| O(1) | Constant | Array index lookup |
| O(log n) | Logarithmic | Binary search |
| O(n) | Linear | Linear scan |
| O(n log n) | Log-linear | Merge sort |
| O(n²) | Quadratic | Bubble sort |
| O(2ⁿ) | Exponential | Fibonacci (naive recursion) |

## How To Derive Big-O

1. **Count the dominant operations** — loops, recursive calls, nested iterations.
2. **Drop constants** — O(3n) → O(n).
3. **Drop lower-order terms** — O(n² + n) → O(n²).
4. **Pick the worst case** unless the problem specifies average or best case.

## Worked Example: Binary Search

Binary search halves the search space each iteration. Starting with `n` elements:

- After 1 step: n/2 elements remain
- After 2 steps: n/4
- After k steps: n/2ᵏ

We stop when n/2ᵏ = 1, so k = log₂(n). **Binary search is O(log n).**

## Space Complexity

Big-O also applies to memory. An algorithm that creates a copy of the input is O(n) space. In-place sorting algorithms like heapsort use O(1) extra space (not counting the input itself).

## Pitfalls

- **Amortized vs. worst case**: A dynamic array's `append` is O(1) amortized but O(n) in the worst case (when resizing triggers a copy).
- **Hidden loops**: String concatenation in a loop is O(n²) in most languages because each concatenation copies the string.
- **Recursion stack space**: A naive recursive function adds O(depth) to space complexity.
```

- [ ] **Step 3: Create `content/articles/how-sql-joins-work.md`**

```markdown
---
title: How SQL Joins Work
subtitle: INNER, LEFT, RIGHT, FULL OUTER — visually explained
categories: [databases]
tags: [sql, fundamentals, exam-review]
related_terms: [relational-database, foreign-key]
---

## The Core Idea

A SQL JOIN combines rows from two tables based on a matching condition. The type of join determines what happens to rows that don't find a match.

Think of two sets — Table A and Table B — and their intersection.

## INNER JOIN

Returns only rows where the condition matches in **both** tables. Non-matching rows are discarded.

```sql
SELECT orders.id, customers.name
FROM orders
INNER JOIN customers ON orders.customer_id = customers.id;
```

Use when: you only want records that have a counterpart in both tables.

## LEFT JOIN (LEFT OUTER JOIN)

Returns **all rows from the left table**, plus matching rows from the right. Where there's no match, right-table columns are NULL.

```sql
SELECT customers.name, orders.id
FROM customers
LEFT JOIN orders ON customers.id = orders.customer_id;
```

Use when: you want every record from the primary table, even if it has no related records.

## RIGHT JOIN

Mirror of LEFT JOIN — all rows from the **right table**, NULLs on the left for non-matches. Less common; most queries can be rewritten as a LEFT JOIN by swapping table order.

## FULL OUTER JOIN

Returns all rows from **both tables**. NULLs fill in wherever there's no match on either side. Not supported by MySQL/MariaDB natively — simulate with a `UNION` of LEFT and RIGHT joins.

```sql
SELECT a.id AS a_id, b.id AS b_id
FROM a
LEFT JOIN b ON a.key = b.key
UNION
SELECT a.id, b.id
FROM a
RIGHT JOIN b ON a.key = b.key;
```

## CROSS JOIN

Returns the Cartesian product — every row in A paired with every row in B. O(n × m) rows. Use deliberately; accidental cross joins are a common performance bug.

## Self Join

A table joined with itself via an alias. Classic use case: employee/manager hierarchy stored in one table.

```sql
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;
```

## Performance Tips

- Always join on **indexed columns**; unindexed joins do full table scans.
- Filter with `WHERE` before joining when possible.
- `EXPLAIN` your query to verify the optimizer's join order.
```

- [ ] **Step 4: Create `content/articles/oop-vs-functional-programming.md`**

```markdown
---
title: OOP vs Functional Programming
subtitle: When to use each paradigm — and when to mix them
categories: [programming-concepts]
tags: [fundamentals, interview-prep]
related_terms: [object-oriented-programming, first-class-function, immutability]
---

## Two Mental Models

**OOP** organizes code around *objects* — data bundled with the behavior that operates on it. State lives inside objects and is mutated through methods.

**Functional programming (FP)** organizes code around *transformations* — pure functions that take input and return output without modifying anything outside themselves.

Neither is universally better. Most modern codebases use both.

## OOP Strengths

- **Modeling real-world entities**: a `BankAccount` object with `deposit()` and `withdraw()` methods maps intuitively to the problem domain.
- **Encapsulation**: internal state is hidden behind an interface, reducing accidental coupling.
- **Polymorphism**: different types can be treated uniformly through a shared interface or base class.
- **Inheritance**: behavior reuse across related types (though composition is often preferred).

## Functional Strengths

- **Predictability**: pure functions always return the same output for the same input. No hidden state to track.
- **Testability**: pure functions need no mocking or setup; call them with inputs, check outputs.
- **Concurrency**: immutable data can be shared across threads without locks.
- **Composability**: small functions chain easily (`map`, `filter`, `reduce`).

## Where Each Shines

| Scenario | Lean OOP | Lean FP |
|----------|----------|---------|
| UI state management | ✓ | ✓ (Redux pattern) |
| Data transformation pipelines | | ✓ |
| Domain modeling (complex entities) | ✓ | |
| Concurrent/parallel code | | ✓ |
| Configuration / scripts | | ✓ |

## In Practice: Hybrid Approaches

Most languages have borrowed from both paradigms:

- **Python**: classes for modeling, list comprehensions and `map`/`filter` for transformations.
- **JavaScript/TypeScript**: classes where state matters; `Array.map/filter/reduce` chains everywhere else. React hooks lean FP; class components lean OOP.
- **Scala / Kotlin**: full OOP type systems with first-class FP constructs.

The practical rule: **use FP for data transformation, OOP for stateful entities**. When a function would need to change state it doesn't own, a class is probably the right abstraction.
```

- [ ] **Step 5: Run sync to populate DB**

```bash
uv run python -m backend.sync_articles
```

Expected output:
```
Article sync complete:
  inserted:  3
  updated:   0
  unchanged: 0
  deleted:   0
  warnings:  0
```

(Some warnings about related_terms slugs are OK if those terms don't exist yet.)

- [ ] **Step 6: Verify API endpoints work**

Start the backend if not running:
```bash
uv run uvicorn backend.main:app --reload --port 8000
```

In a second terminal:
```bash
curl -s http://localhost:8000/api/articles | python -m json.tool | head -30
```

Expected: JSON with `articles` array containing 3 items, `total: 3`.

```bash
curl -s http://localhost:8000/api/articles/understanding-big-o-notation | python -m json.tool | head -20
```

Expected: Full article JSON with `title`, `body`, `summary`, `reading_time_minutes`.

- [ ] **Step 7: Commit**

```bash
git add backend/main.py content/articles/
git commit -m "feat(backend): register articles router + 3 sample articles"
```

---

## Task 8: Frontend TypeScript Types

**Files:**
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: Append article types to `frontend/src/types/index.ts`**

Add after the `StreakResponse` interface:

```typescript
// ── Articles ──────────────────────────────────────────────────────────────────

export interface ArticleSummary {
  id: number
  title: string
  slug: string
}

export interface Article {
  id: number
  title: string
  slug: string
  subtitle: string | null
  body: string
  summary: string | null
  reading_time_minutes: number
  is_published: boolean
  categories: Category[]
  tags: Tag[]
  created_at: string
  updated_at: string
}

export interface ArticleDetail extends Article {
  related_terms: TermSummary[]
  related_articles: ArticleSummary[]
}

export interface ArticleListResponse {
  articles: Article[]
  total: number
  limit: number
  offset: number
}

export interface ArticleCreatePayload {
  title: string
  subtitle: string | null
  body: string
  category_ids: number[]
  tag_names: string[]
  related_term_ids: number[]
  related_article_ids: number[]
}

export type ArticleUpdatePayload = ArticleCreatePayload
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types/index.ts
git commit -m "feat(frontend): add Article TypeScript interfaces"
```

---

## Task 9: Frontend API Client

**Files:**
- Modify: `frontend/src/api/client.ts`

- [ ] **Step 1: Add `api.articles` to `frontend/src/api/client.ts`**

Update the imports line at the top:

```typescript
import type {
  Term, TermDetail, TermListResponse, TermCreatePayload,
  TermUpdatePayload, TermSummary, Category, Tag, Stats,
  ReviewQueueResponse, ReviewState, ReviewRating, StreakResponse,
  Article, ArticleDetail, ArticleListResponse, ArticleCreatePayload,
  ArticleUpdatePayload, ArticleSummary,
} from "../types"
```

Add the `articles` key to the `api` object after the `review` block:

```typescript
  articles: {
    list: (params?: URLSearchParams) =>
      request<ArticleListResponse>(`/articles${params ? "?" + params.toString() : ""}`),
    summaries: () => request<ArticleSummary[]>("/articles/summaries"),
    get: (slug: string) => request<ArticleDetail>(`/articles/${slug}`),
    create: (payload: ArticleCreatePayload) =>
      request<ArticleDetail>("/articles", { method: "POST", body: JSON.stringify(payload) }),
    update: (slug: string, payload: ArticleUpdatePayload) =>
      request<ArticleDetail>(`/articles/${slug}`, { method: "PUT", body: JSON.stringify(payload) }),
    delete: (slug: string) => request<void>(`/articles/${slug}`, { method: "DELETE" }),
    togglePublish: (slug: string) =>
      request<Article>(`/articles/${slug}/publish`, { method: "PATCH" }),
    export: () => request<ArticleDetail[]>("/articles/export"),
    import: (items: ArticleCreatePayload[]) =>
      request<{ imported: number; skipped: number }>("/articles/import", {
        method: "POST",
        body: JSON.stringify(items),
      }),
  },
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/api/client.ts
git commit -m "feat(frontend): add api.articles client methods"
```

---

## Task 10: useArticles Hook

**Files:**
- Create: `frontend/src/hooks/useArticles.ts`

- [ ] **Step 1: Create `frontend/src/hooks/useArticles.ts`**

```typescript
import { useState, useEffect, useCallback } from "react"
import { api } from "../api/client"
import { useDebounce } from "./useDebounce"
import type { ArticleListResponse } from "../types"

interface UseArticlesOptions {
  search: string
  category: string | null
  tag: string | null
  publishedOnly?: boolean
  limit?: number
  offset?: number
}

export function useArticles(opts: UseArticlesOptions) {
  const [data, setData] = useState<ArticleListResponse>({ articles: [], total: 0, limit: 20, offset: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const debouncedSearch = useDebounce(opts.search, 300)

  const fetch = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (debouncedSearch)  params.set("q", debouncedSearch)
    if (opts.category)    params.set("category", opts.category)
    if (opts.tag)         params.set("tag", opts.tag)
    if (opts.publishedOnly) params.set("published_only", "true")
    if (opts.limit)  params.set("limit",  String(opts.limit))
    if (opts.offset) params.set("offset", String(opts.offset))

    api.articles.list(params)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [debouncedSearch, opts.category, opts.tag, opts.publishedOnly, opts.limit, opts.offset])

  useEffect(() => {
    const timeout = window.setTimeout(() => { fetch() }, 0)
    return () => window.clearTimeout(timeout)
  }, [fetch])

  return { ...data, loading, error, refetch: fetch }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/useArticles.ts
git commit -m "feat(frontend): useArticles hook"
```

---

## Task 11: ArticleCard Component

**Files:**
- Create: `frontend/src/components/ArticleCard.tsx`

- [ ] **Step 1: Create `frontend/src/components/ArticleCard.tsx`**

```tsx
import type { Article } from "../types"

interface ArticleCardProps {
  article: Article
  isSelected: boolean
  onClick: () => void
  onTogglePublish: () => void
}

export function ArticleCard({ article, isSelected, onClick, onTogglePublish }: ArticleCardProps) {
  return (
    <div
      data-slug={article.slug}
      onClick={onClick}
      className={`px-4 py-3 border-b border-border cursor-pointer transition-colors
                  ${isSelected ? "bg-surface border-l-2 border-l-accent" : "hover:bg-white/5"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-text truncate">{article.title}</span>
            {!article.is_published && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded
                               bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shrink-0">
                DRAFT
              </span>
            )}
          </div>

          {article.subtitle && (
            <p className="text-xs text-muted mt-0.5 truncate">{article.subtitle}</p>
          )}

          {article.summary && (
            <p className="text-xs text-muted/70 mt-1 line-clamp-2 leading-relaxed">
              {article.summary}
            </p>
          )}
        </div>

        <span className="text-[10px] font-mono text-muted shrink-0 mt-0.5">
          {article.reading_time_minutes}m
        </span>
      </div>

      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        {article.categories.map(cat => (
          <span
            key={cat.id}
            className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-mono"
          >
            {cat.name}
          </span>
        ))}

        <button
          onClick={e => { e.stopPropagation(); onTogglePublish() }}
          className="ml-auto text-[10px] font-mono text-muted hover:text-text transition-colors"
          title={article.is_published ? "Unpublish (set to draft)" : "Publish"}
        >
          {article.is_published ? "Published" : "Draft"}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ArticleCard.tsx
git commit -m "feat(frontend): ArticleCard component"
```

---

## Task 12: ArticleDetail Component

**Files:**
- Create: `frontend/src/components/ArticleDetail.tsx`

- [ ] **Step 1: Create `frontend/src/components/ArticleDetail.tsx`**

```tsx
import { useMemo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Highlight, themes } from "prism-react-renderer"
import type { ArticleDetail as ArticleDetailType, TermSummary, ArticleSummary } from "../types"

interface TocEntry {
  level: 1 | 2 | 3
  text: string
  id: string
}

function extractToc(body: string): TocEntry[] {
  const entries: TocEntry[] = []
  const headingRe = /^(#{1,3}) (.+)$/gm
  let match
  while ((match = headingRe.exec(body)) !== null) {
    const level = match[1].length as 1 | 2 | 3
    const text = match[2].replace(/[*_`]/g, "")
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    entries.push({ level, text, id })
  }
  return entries
}

interface ArticleDetailProps {
  article: ArticleDetailType
  onEdit: () => void
  onDelete: () => void
  onTogglePublish: () => void
  onSelectRelatedTerm: (slug: string) => void
  onSelectRelatedArticle: (slug: string) => void
  onBack: () => void
}

export function ArticleDetail({
  article, onEdit, onDelete, onTogglePublish,
  onSelectRelatedTerm, onSelectRelatedArticle, onBack,
}: ArticleDetailProps) {
  const toc = useMemo(() => extractToc(article.body), [article.body])

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6 max-w-3xl">
        {/* Back button (mobile) */}
        <button
          onClick={onBack}
          className="md:hidden mb-4 text-xs text-muted hover:text-text flex items-center gap-1 transition-colors"
        >
          ← Back
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-xl font-semibold text-text">{article.title}</h1>
            {!article.is_published && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded
                               bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                DRAFT
              </span>
            )}
          </div>

          {article.subtitle && (
            <p className="text-base text-muted mb-3">{article.subtitle}</p>
          )}

          <div className="flex items-center gap-3 text-xs text-muted font-mono flex-wrap">
            <span>{article.reading_time_minutes} min read</span>
            <span>·</span>
            <span>{new Date(article.created_at).toLocaleDateString()}</span>
            {article.categories.map(cat => (
              <span key={cat.id} className="px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                {cat.name}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={onEdit}
            className="h-7 px-3 rounded-md bg-white/5 text-muted hover:text-text border border-border
                       hover:border-border/80 transition-colors text-xs font-mono"
          >
            Edit
          </button>
          <button
            onClick={onTogglePublish}
            className="h-7 px-3 rounded-md bg-white/5 text-muted hover:text-text border border-border
                       hover:border-border/80 transition-colors text-xs font-mono"
          >
            {article.is_published ? "Unpublish" : "Publish"}
          </button>
          <button
            onClick={() => { if (confirm(`Delete "${article.title}"?`)) onDelete() }}
            className="h-7 px-3 rounded-md text-red-400/70 hover:text-red-400 border border-red-400/20
                       hover:border-red-400/40 transition-colors text-xs font-mono"
          >
            Delete
          </button>
        </div>

        {/* Body */}
        <div className="prose prose-invert prose-sm max-w-none
                        prose-headings:font-mono prose-headings:text-text
                        prose-p:text-muted prose-p:leading-relaxed
                        prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                        prose-code:text-green prose-code:bg-code prose-code:px-1 prose-code:rounded
                        prose-pre:bg-code prose-pre:border prose-pre:border-border
                        prose-blockquote:border-l-accent prose-blockquote:text-muted
                        prose-strong:text-text prose-li:text-muted
                        prose-table:text-muted prose-th:text-text prose-th:border-border prose-td:border-border">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "")
                const codeStr = String(children).replace(/\n$/, "")
                if (!match) {
                  return <code className={className} {...props}>{children}</code>
                }
                return (
                  <Highlight theme={themes.vsDark} code={codeStr} language={match[1]}>
                    {({ className: hlClass, style, tokens, getLineProps, getTokenProps }) => (
                      <pre className={hlClass} style={style}>
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
                )
              },
            }}
          >
            {article.body}
          </ReactMarkdown>
        </div>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-1.5">
            {article.tags.map(tag => (
              <span key={tag.id} className="text-[11px] font-mono px-2 py-0.5 rounded-full
                                            bg-white/5 text-muted border border-border">
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Related terms */}
        {article.related_terms.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-mono text-muted uppercase tracking-wider mb-2">Related Terms</h3>
            <div className="flex flex-wrap gap-1.5">
              {article.related_terms.map((term: TermSummary) => (
                <button
                  key={term.id}
                  onClick={() => onSelectRelatedTerm(term.slug)}
                  className="text-xs font-mono px-2 py-1 rounded bg-accent/10 text-accent
                             border border-accent/20 hover:bg-accent/20 transition-colors"
                >
                  {term.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Related articles */}
        {article.related_articles.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-mono text-muted uppercase tracking-wider mb-2">Related Articles</h3>
            <div className="flex flex-wrap gap-1.5">
              {article.related_articles.map((a: ArticleSummary) => (
                <button
                  key={a.id}
                  onClick={() => onSelectRelatedArticle(a.slug)}
                  className="text-xs font-mono px-2 py-1 rounded bg-white/5 text-muted
                             border border-border hover:text-text hover:bg-white/10 transition-colors"
                >
                  {a.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* TOC sidebar */}
      {toc.length > 0 && (
        <div className="hidden lg:block w-56 shrink-0 overflow-y-auto p-4 border-l border-border">
          <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-3">Contents</p>
          <nav className="space-y-1">
            {toc.map((entry, i) => (
              <a
                key={i}
                href={`#${entry.id}`}
                className={`block text-xs font-mono text-muted hover:text-text transition-colors truncate
                            ${entry.level === 1 ? "" : entry.level === 2 ? "pl-3" : "pl-6"}`}
              >
                {entry.text}
              </a>
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ArticleDetail.tsx
git commit -m "feat(frontend): ArticleDetail with TOC sidebar and related chips"
```

---

## Task 13: ArticleForm Component

**Files:**
- Create: `frontend/src/components/ArticleForm.tsx`

- [ ] **Step 1: Create `frontend/src/components/ArticleForm.tsx`**

```tsx
import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { ArticleDetail, ArticleCreatePayload, Category, Tag, TermSummary, ArticleSummary } from "../types"

interface ArticleFormProps {
  initial: ArticleDetail | null
  categories: Category[]
  allTags: Tag[]
  allTerms: TermSummary[]
  allArticles: ArticleSummary[]
  onSave: (payload: ArticleCreatePayload) => Promise<void>
  onCancel: () => void
}

export function ArticleForm({
  initial, categories, allTags, allTerms, allArticles, onSave, onCancel,
}: ArticleFormProps) {
  const [title,        setTitle]        = useState(initial?.title ?? "")
  const [subtitle,     setSubtitle]     = useState(initial?.subtitle ?? "")
  const [body,         setBody]         = useState(initial?.body ?? "")
  const [preview,      setPreview]      = useState(false)
  const [tagInput,     setTagInput]     = useState(initial?.tags.map(t => t.name).join(", ") ?? "")
  const [termSearch,   setTermSearch]   = useState("")
  const [articleSearch, setArticleSearch] = useState("")
  const [categoryIds,  setCategoryIds]  = useState<number[]>(initial?.categories.map(c => c.id) ?? [])
  const [termIds,      setTermIds]      = useState<number[]>(initial?.related_terms.map(t => t.id) ?? [])
  const [articleIds,   setArticleIds]   = useState<number[]>(initial?.related_articles.map(a => a.id) ?? [])
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  const toggleCategory = (id: number) =>
    setCategoryIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const toggleTerm = (id: number) =>
    setTermIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const toggleArticle = (id: number) =>
    setArticleIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError("Title is required"); return }
    if (!body.trim())  { setError("Body is required"); return }
    setSaving(true)
    setError(null)
    try {
      await onSave({
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        body: body.trim() + "\n",
        category_ids: categoryIds,
        tag_names: tagInput.split(",").map(t => t.trim()).filter(Boolean),
        related_term_ids: termIds,
        related_article_ids: articleIds,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed")
      setSaving(false)
    }
  }

  const filteredTerms = allTerms.filter(t =>
    t.name.toLowerCase().includes(termSearch.toLowerCase())
  )
  const filteredArticles = allArticles
    .filter(a => a.id !== initial?.id)
    .filter(a => a.title.toLowerCase().includes(articleSearch.toLowerCase()))

  return (
    <form onSubmit={handleSubmit} className="h-full overflow-y-auto p-6 max-w-3xl space-y-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-mono font-medium text-text">
          {initial ? "Edit Article" : "New Article"}
        </h2>
        <button type="button" onClick={onCancel} className="text-xs text-muted hover:text-text transition-colors">
          Cancel
        </button>
      </div>

      {error && <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2">{error}</p>}

      {/* Title */}
      <div>
        <label className="block text-xs font-mono text-muted mb-1">Title *</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Understanding Big-O Notation"
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text
                     placeholder-muted/40 focus:outline-none focus:border-accent/50"
        />
      </div>

      {/* Subtitle */}
      <div>
        <label className="block text-xs font-mono text-muted mb-1">Subtitle</label>
        <input
          type="text"
          value={subtitle}
          onChange={e => setSubtitle(e.target.value)}
          placeholder="Optional one-liner"
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text
                     placeholder-muted/40 focus:outline-none focus:border-accent/50"
        />
      </div>

      {/* Body */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-mono text-muted">Body (Markdown) *</label>
          <button
            type="button"
            onClick={() => setPreview(v => !v)}
            className="text-[11px] font-mono text-muted hover:text-text transition-colors"
          >
            {preview ? "Edit" : "Preview"}
          </button>
        </div>
        {preview ? (
          <div className="min-h-64 p-4 bg-code border border-border rounded
                          prose prose-invert prose-sm max-w-none
                          prose-headings:font-mono prose-headings:text-text
                          prose-p:text-muted prose-code:text-green prose-code:bg-surface prose-code:px-1 prose-code:rounded">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={16}
            placeholder="## Introduction&#10;&#10;Write your article in Markdown..."
            className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text font-mono
                       placeholder-muted/40 focus:outline-none focus:border-accent/50 resize-y"
          />
        )}
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <label className="block text-xs font-mono text-muted mb-2">Categories</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <label key={cat.id} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={categoryIds.includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                  className="accent-accent"
                />
                <span className="text-xs text-muted">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      <div>
        <label className="block text-xs font-mono text-muted mb-1">Tags (comma-separated)</label>
        <input
          type="text"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          placeholder="exam-review, interview-prep"
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text
                     placeholder-muted/40 focus:outline-none focus:border-accent/50"
        />
      </div>

      {/* Related Terms */}
      <div>
        <label className="block text-xs font-mono text-muted mb-1">Related Terms</label>
        <input
          type="text"
          value={termSearch}
          onChange={e => setTermSearch(e.target.value)}
          placeholder="Search terms…"
          className="w-full bg-surface border border-border rounded px-3 py-2 text-xs text-text
                     placeholder-muted/40 focus:outline-none focus:border-accent/50 mb-2"
        />
        <div className="max-h-32 overflow-y-auto border border-border rounded divide-y divide-border">
          {filteredTerms.slice(0, 20).map(term => (
            <label key={term.id} className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-white/5">
              <input
                type="checkbox"
                checked={termIds.includes(term.id)}
                onChange={() => toggleTerm(term.id)}
                className="accent-accent"
              />
              <span className="text-xs text-muted font-mono">{term.name}</span>
            </label>
          ))}
          {filteredTerms.length === 0 && (
            <p className="text-xs text-muted/50 px-3 py-2">No terms match.</p>
          )}
        </div>
      </div>

      {/* Related Articles */}
      <div>
        <label className="block text-xs font-mono text-muted mb-1">Related Articles</label>
        <input
          type="text"
          value={articleSearch}
          onChange={e => setArticleSearch(e.target.value)}
          placeholder="Search articles…"
          className="w-full bg-surface border border-border rounded px-3 py-2 text-xs text-text
                     placeholder-muted/40 focus:outline-none focus:border-accent/50 mb-2"
        />
        <div className="max-h-32 overflow-y-auto border border-border rounded divide-y divide-border">
          {filteredArticles.slice(0, 20).map(a => (
            <label key={a.id} className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-white/5">
              <input
                type="checkbox"
                checked={articleIds.includes(a.id)}
                onChange={() => toggleArticle(a.id)}
                className="accent-accent"
              />
              <span className="text-xs text-muted font-mono">{a.title}</span>
            </label>
          ))}
          {filteredArticles.length === 0 && (
            <p className="text-xs text-muted/50 px-3 py-2">No articles match.</p>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="h-8 px-4 rounded-md bg-accent/10 text-accent border border-accent/30
                     hover:bg-accent/20 hover:border-accent/50 transition-colors
                     text-xs font-mono font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : (initial ? "Save Changes" : "Create Article")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-8 px-4 rounded-md bg-white/5 text-muted border border-border
                     hover:text-text hover:bg-white/10 transition-colors text-xs font-mono"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ArticleForm.tsx
git commit -m "feat(frontend): ArticleForm with markdown preview and related selectors"
```

---

## Task 14: SiteHeader — Add Articles Nav

**Files:**
- Modify: `frontend/src/components/SiteHeader.tsx`

- [ ] **Step 1: Update `SiteHeader.tsx`**

Change the `View` type and `NAV` array:

```typescript
type View = "terms" | "stats" | "form" | "review" | "study" | "articles" | "article-form"
```

Add to the `NAV` array (after the `stats` entry):

```typescript
  { id: "articles", label: "Articles", shortcut: "05" },
```

The full updated `NAV` array:

```typescript
const NAV: NavItem[] = [
  { id: "terms",    label: "Browse",   shortcut: "01" },
  { id: "study",    label: "Study",    shortcut: "02" },
  { id: "review",   label: "Review",   shortcut: "03" },
  { id: "stats",    label: "Stats",    shortcut: "04" },
  { id: "articles", label: "Articles", shortcut: "05" },
]
```

Update the `active` calculation to also treat `article-form` as active for the Articles tab:

```typescript
const active = view === item.id ||
  (item.id === "terms" && view === "form") ||
  (item.id === "articles" && view === "article-form")
```

Update the `SiteHeaderProps` interface:

```typescript
interface SiteHeaderProps {
  view: View
  dueCount: number
  onNavigate: (view: View) => void
  onNewTerm: () => void
  onNewArticle: () => void
  onExport: () => void
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void
}
```

Add a "+ Article" button next to "+ New" (after the existing `onNewTerm` button):

```tsx
      <button
        onClick={onNewArticle}
        className="h-7 px-3 rounded-md bg-white/5 text-muted border border-border
                   hover:text-text hover:bg-white/10 transition-colors
                   text-xs font-mono font-medium tracking-wide flex items-center gap-1.5"
        title="Create a new article"
      >
        <span className="text-sm leading-none">+</span>
        <span className="uppercase">Article</span>
      </button>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: No errors (App.tsx will fail until Task 15).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/SiteHeader.tsx
git commit -m "feat(frontend): add Articles nav item (shortcut 05) to SiteHeader"
```

---

## Task 15: App.tsx — Wire Articles View

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Update `frontend/src/App.tsx`**

Replace the entire file with the following. Key changes from the existing file: `View` type expanded, article state added, article handlers added, `SiteHeader` gets `onNewArticle`, articles view rendered in the JSX.

```tsx
import { useState, useCallback, useEffect, useRef } from "react"
import { Layout }        from "./components/Layout"
import { SearchBar }     from "./components/SearchBar"
import { Sidebar }       from "./components/Sidebar"
import { SiteHeader }    from "./components/SiteHeader"
import { TermCard }      from "./components/TermCard"
import { TermDetail }    from "./components/TermDetail"
import { TermForm }      from "./components/TermForm"
import { StatsPanel }    from "./components/StatsPanel"
import { ReviewPanel }   from "./components/ReviewPanel"
import { StudyPanel }    from "./components/StudyPanel"
import { ArticleCard }   from "./components/ArticleCard"
import { ArticleDetail } from "./components/ArticleDetail"
import { ArticleForm }   from "./components/ArticleForm"
import { EmptyState }    from "./components/EmptyState"
import { useCategories } from "./hooks/useCategories"
import { useTags }       from "./hooks/useTags"
import { useTerms }      from "./hooks/useTerms"
import { useArticles }   from "./hooks/useArticles"
import { api }           from "./api/client"
import type {
  TermDetail as TermDetailType, TermCreatePayload, TermSummary,
  ArticleDetail as ArticleDetailType, ArticleCreatePayload, ArticleSummary,
} from "./types"

type View = "terms" | "stats" | "form" | "review" | "study" | "articles" | "article-form"

export default function App() {
  // ── Terms state ────────────────────────────────────────────────────────────
  const [search,           setSearch]           = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTag,      setSelectedTag]      = useState<string | null>(null)
  const [favoritesOnly,    setFavoritesOnly]    = useState(false)
  const [selectedSlug,     setSelectedSlug]     = useState<string | null>(null)
  const [expandedTerm,     setExpandedTerm]     = useState<TermDetailType | null>(null)
  const [editingSlug,      setEditingSlug]      = useState<string | null | "new">(null)
  const [showDetail,       setShowDetail]       = useState(false)
  const [allTerms,         setAllTerms]         = useState<TermSummary[]>([])

  // ── Articles state ─────────────────────────────────────────────────────────
  const [articleSearch,        setArticleSearch]        = useState("")
  const [selectedArticleSlug,  setSelectedArticleSlug]  = useState<string | null>(null)
  const [expandedArticle,      setExpandedArticle]      = useState<ArticleDetailType | null>(null)
  const [editingArticleSlug,   setEditingArticleSlug]   = useState<string | null | "new">(null)
  const [showArticleDetail,    setShowArticleDetail]    = useState(false)
  const [allArticles,          setAllArticles]          = useState<ArticleSummary[]>([])

  // ── Shared state ───────────────────────────────────────────────────────────
  const [view,      setView]      = useState<View>("terms")
  const [dueCount,  setDueCount]  = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  // ── Bootstrapping ──────────────────────────────────────────────────────────
  const refetchDueCount = useCallback(() => {
    api.review.streak()
      .then(s => setDueCount(s.today_due))
      .catch(() => {})
  }, [])

  const refetchTermSummaries = useCallback(() => {
    api.terms.summaries().then(setAllTerms).catch(() => {})
  }, [])

  const refetchArticleSummaries = useCallback(() => {
    api.articles.summaries().then(setAllArticles).catch(() => {})
  }, [])

  useEffect(() => { refetchDueCount() }, [refetchDueCount])
  useEffect(() => { refetchTermSummaries() }, [refetchTermSummaries])
  useEffect(() => { refetchArticleSummaries() }, [refetchArticleSummaries])

  // ── Data hooks ─────────────────────────────────────────────────────────────
  const { categories } = useCategories()
  const { tags }       = useTags()
  const { terms, loading, error, refetch } = useTerms({
    search, category: selectedCategory, tag: selectedTag, favoritesOnly,
  })
  const {
    articles, loading: articlesLoading, error: articlesError, refetch: refetchArticles,
  } = useArticles({ search: articleSearch, category: null, tag: null })

  // ── Term handlers ──────────────────────────────────────────────────────────
  const handleSelectTerm = useCallback(async (slug: string) => {
    setSelectedSlug(slug)
    const detail = await api.terms.get(slug)
    setExpandedTerm(detail)
    setView("terms")
    setShowDetail(true)
  }, [])

  const handleToggleFavorite = useCallback(async (slug: string) => {
    await api.terms.toggleFavorite(slug)
    refetch()
    if (expandedTerm?.slug === slug) {
      const updated = await api.terms.get(slug)
      setExpandedTerm(updated)
    }
  }, [expandedTerm, refetch])

  const handleSaveTerm = useCallback(async (payload: TermCreatePayload) => {
    if (editingSlug === "new") {
      const created = await api.terms.create(payload)
      setEditingSlug(null)
      setView("terms")
      refetch()
      refetchTermSummaries()
      await handleSelectTerm(created.slug)
    } else if (editingSlug) {
      const updated = await api.terms.update(editingSlug, payload)
      setEditingSlug(null)
      setView("terms")
      refetch()
      refetchTermSummaries()
      setExpandedTerm(updated)
    }
  }, [editingSlug, refetch, refetchTermSummaries, handleSelectTerm])

  const handleDeleteTerm = useCallback(async (slug: string) => {
    if (!confirm(`Delete "${slug}"?`)) return
    await api.terms.delete(slug)
    setSelectedSlug(null)
    setExpandedTerm(null)
    setShowDetail(false)
    refetch()
    refetchTermSummaries()
  }, [refetch, refetchTermSummaries])

  const handleExport = useCallback(async () => {
    const data = await api.terms.export()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `concept-master-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const items = JSON.parse(text)
      const result = await api.terms.import(items)
      alert(`Imported ${result.imported} terms, skipped ${result.skipped} duplicates.`)
      refetch()
      refetchTermSummaries()
    } catch (err) {
      alert(`Import failed: ${err instanceof Error ? err.message : "Invalid file"}`)
    } finally {
      e.target.value = ""
    }
  }, [refetch, refetchTermSummaries])

  // ── Article handlers ───────────────────────────────────────────────────────
  const handleSelectArticle = useCallback(async (slug: string) => {
    setSelectedArticleSlug(slug)
    const detail = await api.articles.get(slug)
    setExpandedArticle(detail)
    setView("articles")
    setShowArticleDetail(true)
  }, [])

  const handleTogglePublish = useCallback(async (slug: string) => {
    await api.articles.togglePublish(slug)
    refetchArticles()
    if (expandedArticle?.slug === slug) {
      const updated = await api.articles.get(slug)
      setExpandedArticle(updated)
    }
  }, [expandedArticle, refetchArticles])

  const handleSaveArticle = useCallback(async (payload: ArticleCreatePayload) => {
    if (editingArticleSlug === "new") {
      const created = await api.articles.create(payload)
      setEditingArticleSlug(null)
      setView("articles")
      refetchArticles()
      refetchArticleSummaries()
      await handleSelectArticle(created.slug)
    } else if (editingArticleSlug) {
      const updated = await api.articles.update(editingArticleSlug, payload)
      setEditingArticleSlug(null)
      setView("articles")
      refetchArticles()
      refetchArticleSummaries()
      setExpandedArticle(updated)
    }
  }, [editingArticleSlug, refetchArticles, refetchArticleSummaries, handleSelectArticle])

  const handleDeleteArticle = useCallback(async (slug: string) => {
    await api.articles.delete(slug)
    setSelectedArticleSlug(null)
    setExpandedArticle(null)
    setShowArticleDetail(false)
    refetchArticles()
    refetchArticleSummaries()
  }, [refetchArticles, refetchArticleSummaries])

  // ── Keyboard nav (terms view) ──────────────────────────────────────────────
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
        setShowDetail(false)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [view, terms, selectedSlug, handleSelectTerm])

  useEffect(() => {
    if (!selectedSlug || !listRef.current) return
    const el = listRef.current.querySelector(`[data-slug="${selectedSlug}"]`)
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [selectedSlug])

  // ── Render ─────────────────────────────────────────────────────────────────
  const sidebar = (
    <div>
      <SearchBar
        value={view === "articles" ? articleSearch : search}
        onChange={view === "articles" ? setArticleSearch : setSearch}
      />
      {view !== "articles" && (
        <Sidebar
          categories={categories}
          tags={tags}
          selectedCategory={selectedCategory}
          selectedTag={selectedTag}
          favoritesOnly={favoritesOnly}
          onSelectCategory={setSelectedCategory}
          onSelectTag={setSelectedTag}
          onToggleFavorites={() => setFavoritesOnly(v => !v)}
        />
      )}
    </div>
  )

  const headerNav = (
    <SiteHeader
      view={view}
      dueCount={dueCount}
      onNavigate={(v) => {
        if (v === "terms") setShowDetail(false)
        if (v === "articles") setShowArticleDetail(false)
        setView(v)
      }}
      onNewTerm={() => { setEditingSlug("new"); setView("form") }}
      onNewArticle={() => { setEditingArticleSlug("new"); setView("article-form") }}
      onExport={handleExport}
      onImport={handleImport}
    />
  )

  return (
    <Layout sidebar={sidebar} header={headerNav}>
      {/* ── Terms view ── */}
      {view === "terms" && (
        <div className="flex h-full">
          <div
            ref={listRef}
            className={`w-80 flex-shrink-0 border-r border-border overflow-y-auto ${showDetail ? "hidden md:block" : "block"}`}
          >
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
          <div className={`flex-1 overflow-y-auto ${showDetail ? "block" : "hidden md:block"}`}>
            {expandedTerm ? (
              <TermDetail
                term={expandedTerm}
                onEdit={() => { setEditingSlug(expandedTerm.slug); setView("form") }}
                onDelete={() => handleDeleteTerm(expandedTerm.slug)}
                onToggleFavorite={() => handleToggleFavorite(expandedTerm.slug)}
                onSelectRelated={handleSelectTerm}
                onBack={() => setShowDetail(false)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted text-sm">
                Select a term to view its definition
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Stats view ── */}
      {view === "stats" && (
        <StatsPanel
          onSelectTerm={(slug) => { setView("terms"); handleSelectTerm(slug) }}
          onStartReview={() => setView("review")}
        />
      )}

      {/* ── Review view ── */}
      {view === "review" && (
        <ReviewPanel
          onDone={() => { setView("terms"); refetchDueCount() }}
          onReviewSubmitted={refetchDueCount}
        />
      )}

      {/* ── Study view ── */}
      {view === "study" && (
        <StudyPanel onDone={() => setView("terms")} />
      )}

      {/* ── Term form ── */}
      {view === "form" && (
        <TermForm
          key={editingSlug ?? "new"}
          initial={editingSlug !== "new" ? expandedTerm : null}
          categories={categories}
          allTags={tags}
          allTerms={allTerms}
          onSave={handleSaveTerm}
          onCancel={() => setView("terms")}
        />
      )}

      {/* ── Articles view ── */}
      {view === "articles" && (
        <div className="flex h-full">
          <div className={`w-80 flex-shrink-0 border-r border-border overflow-y-auto ${showArticleDetail ? "hidden md:block" : "block"}`}>
            {articlesLoading && <p className="p-4 text-muted text-sm">Loading…</p>}
            {articlesError   && <p className="p-4 text-red-400 text-sm">{articlesError}</p>}
            {!articlesLoading && articles.length === 0 && <EmptyState query={articleSearch} />}
            {articles.map(article => (
              <ArticleCard
                key={article.id}
                article={article}
                isSelected={selectedArticleSlug === article.slug}
                onClick={() => handleSelectArticle(article.slug)}
                onTogglePublish={() => handleTogglePublish(article.slug)}
              />
            ))}
          </div>
          <div className={`flex-1 overflow-y-auto ${showArticleDetail ? "block" : "hidden md:block"}`}>
            {expandedArticle ? (
              <ArticleDetail
                article={expandedArticle}
                onEdit={() => { setEditingArticleSlug(expandedArticle.slug); setView("article-form") }}
                onDelete={() => handleDeleteArticle(expandedArticle.slug)}
                onTogglePublish={() => handleTogglePublish(expandedArticle.slug)}
                onSelectRelatedTerm={(slug) => { setView("terms"); handleSelectTerm(slug) }}
                onSelectRelatedArticle={handleSelectArticle}
                onBack={() => setShowArticleDetail(false)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted text-sm">
                Select an article to read it
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Article form ── */}
      {view === "article-form" && (
        <ArticleForm
          key={editingArticleSlug ?? "new"}
          initial={editingArticleSlug !== "new" ? expandedArticle : null}
          categories={categories}
          allTags={tags}
          allTerms={allTerms}
          allArticles={allArticles}
          onSave={handleSaveArticle}
          onCancel={() => setView("articles")}
        />
      )}
    </Layout>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Run the full test suite**

```bash
uv run pytest
```

Expected: All existing tests pass plus the new article tests.

- [ ] **Step 4: Start both servers and verify in browser**

Terminal 1:
```bash
uv run uvicorn backend.main:app --reload --port 8000
```

Terminal 2:
```bash
cd frontend && npm run dev
```

Open `http://localhost:5173`. Verify:
- "Articles" nav item appears with shortcut `05`
- Clicking Articles shows the 3 sample articles in the left column
- Clicking an article opens the detail view with TOC sidebar
- "+ Article" button opens the article form
- Creating an article saves it to `content/articles/<slug>.md`
- Editing an article updates the file on disk
- Publish toggle works (badge appears/disappears)
- Related terms chips navigate to the terms view

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat(frontend): wire articles view and article-form into App — Articles section complete"
```

---

## Verification Checklist

After all 15 tasks are done, confirm:

- [ ] `uv run pytest` — all tests pass
- [ ] `uv run python -m backend.sync_articles` — 3 articles inserted, 0 warnings
- [ ] `curl http://localhost:8000/api/articles` — returns 3 articles
- [ ] `curl http://localhost:8000/api/articles/understanding-big-o-notation` — returns full article with `summary` and `reading_time_minutes`
- [ ] `curl -X PATCH http://localhost:8000/api/articles/understanding-big-o-notation/publish` — toggles `is_published`
- [ ] UI: Articles nav item visible
- [ ] UI: 3 sample articles listed with reading time badges
- [ ] UI: Article detail shows rendered markdown + TOC + related term chips
- [ ] UI: "+ Article" button opens form; saving creates `content/articles/<slug>.md` on disk
- [ ] UI: Edit round-trips correctly (form pre-filled, save updates DB and file)
- [ ] UI: Delete removes article from list and disk
- [ ] UI: Clicking related term chip navigates to the glossary term
