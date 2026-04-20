"""Serialize :class:`TermFile` records back to Markdown on disk."""
from __future__ import annotations

from pathlib import Path
from typing import Iterable

import yaml

from .content_loader import TermFile


_CANONICAL_KEYS = ("name", "categories", "tags", "related", "code_lang", "is_favorite")


def _frontmatter(term: TermFile) -> str:
    data: dict[str, object] = {"name": term.name}
    if term.categories:
        data["categories"] = list(term.categories)
    else:
        data["categories"] = []
    if term.tags:
        data["tags"] = list(term.tags)
    else:
        data["tags"] = []
    if term.related:
        data["related"] = list(term.related)
    if term.code_lang:
        data["code_lang"] = term.code_lang
    if term.is_favorite:
        data["is_favorite"] = True

    ordered = {k: data[k] for k in _CANONICAL_KEYS if k in data}
    return yaml.safe_dump(ordered, sort_keys=False, allow_unicode=True, default_flow_style=False).rstrip() + "\n"


def _build_body(term: TermFile) -> str:
    body = (term.definition or "").rstrip()
    if term.example_code is not None and term.example_code.strip():
        lang = term.code_lang or ""
        code = term.example_code.rstrip("\n")
        fence = f"```{lang}\n{code}\n```"
        body = f"{body}\n\n{fence}" if body else fence
    return body + "\n"


def write_term(term: TermFile, root: Path) -> Path:
    """Write ``<root>/terms/<slug>.md`` and return the path."""
    terms_dir = root / "terms"
    terms_dir.mkdir(parents=True, exist_ok=True)
    path = terms_dir / f"{term.slug}.md"
    text = f"---\n{_frontmatter(term)}---\n\n{_build_body(term)}"
    path.write_text(text, encoding="utf-8")
    return path


def delete_term(slug: str, root: Path) -> None:
    path = root / "terms" / f"{slug}.md"
    path.unlink(missing_ok=True)


def write_categories(categories: Iterable[tuple[str, str]], path: Path) -> None:
    """Write a ``categories.yml`` list of ``{name, slug}`` entries."""
    path.parent.mkdir(parents=True, exist_ok=True)
    entries = [{"name": name, "slug": slug} for name, slug in categories]
    path.write_text(
        yaml.safe_dump(entries, sort_keys=False, allow_unicode=True, default_flow_style=False),
        encoding="utf-8",
    )
