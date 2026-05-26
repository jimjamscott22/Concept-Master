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
