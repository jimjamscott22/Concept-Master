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
