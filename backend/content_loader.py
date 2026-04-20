"""Parse term Markdown files and category/tag YAML lists.

The content directory is the source of truth for glossary data. Each term is
stored as a single Markdown file whose filename (minus ``.md``) is the term's
slug. The file contains YAML frontmatter for metadata and a Markdown body for
the human-readable definition. The first fenced code block whose info-string
matches the frontmatter ``code_lang`` (falling back to the first fenced block)
is extracted as ``example_code`` and removed from the body. The remaining body
text is stored as ``definition``.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, List, Optional

import frontmatter
import yaml


@dataclass
class TermFile:
    slug: str
    name: str
    definition: str
    example_code: Optional[str] = None
    code_lang: Optional[str] = None
    is_favorite: bool = False
    categories: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    related: List[str] = field(default_factory=list)


@dataclass
class Category:
    name: str
    slug: str


_FENCE_RE = re.compile(
    r"(^|\n)(?P<indent>[ \t]*)```(?P<lang>[^\n`]*)\n(?P<body>.*?)(?<=\n)(?P=indent)```(?=\n|$)",
    re.DOTALL,
)


def _extract_example(body: str, preferred_lang: Optional[str]) -> tuple[str, Optional[str], Optional[str]]:
    """Return (new_body, example_code, code_lang).

    Finds the fenced code block whose language tag matches ``preferred_lang``
    (case-insensitive). Falls back to the first fenced block if none match.
    The chosen block is removed from the body so the caller gets a clean
    definition.
    """
    matches = list(_FENCE_RE.finditer(body))
    if not matches:
        return body, None, preferred_lang

    chosen = None
    if preferred_lang:
        target = preferred_lang.strip().lower()
        for m in matches:
            if m.group("lang").strip().lower() == target:
                chosen = m
                break
    if chosen is None:
        chosen = matches[0]

    code = chosen.group("body").rstrip("\n")
    lang = chosen.group("lang").strip() or preferred_lang
    start, end = chosen.start(), chosen.end()
    new_body = body[:start] + body[end:]
    new_body = re.sub(r"\n{3,}", "\n\n", new_body).strip() + "\n"
    return new_body, code, lang


def load_term(path: Path) -> TermFile:
    """Load and parse a single term Markdown file."""
    post = frontmatter.loads(path.read_text(encoding="utf-8"))
    meta = post.metadata or {}

    slug = path.stem
    name = meta.get("name")
    if not isinstance(name, str) or not name.strip():
        raise ValueError(f"{path}: frontmatter must include a non-empty 'name'")

    preferred_lang = meta.get("code_lang")
    if preferred_lang is not None and not isinstance(preferred_lang, str):
        raise ValueError(f"{path}: 'code_lang' must be a string")

    body = post.content or ""
    definition, example_code, code_lang = _extract_example(body, preferred_lang)

    def _str_list(key: str) -> List[str]:
        raw = meta.get(key, []) or []
        if not isinstance(raw, list) or not all(isinstance(x, str) for x in raw):
            raise ValueError(f"{path}: '{key}' must be a list of strings")
        return [x.strip() for x in raw if x and x.strip()]

    return TermFile(
        slug=slug,
        name=name.strip(),
        definition=definition.strip() + ("\n" if definition.strip() else ""),
        example_code=example_code,
        code_lang=code_lang,
        is_favorite=bool(meta.get("is_favorite", False)),
        categories=_str_list("categories"),
        tags=_str_list("tags"),
        related=_str_list("related"),
    )


def load_all_terms(root: Path) -> List[TermFile]:
    """Load every ``.md`` file under ``<root>/terms/`` sorted by slug."""
    terms_dir = root / "terms"
    if not terms_dir.is_dir():
        return []
    return [load_term(p) for p in sorted(terms_dir.glob("*.md"))]


def load_categories(path: Path) -> List[Category]:
    """Parse ``categories.yml``.

    Accepts either a list of ``{name, slug}`` objects or a mapping of
    ``slug: name`` strings.
    """
    if not path.is_file():
        return []
    raw = yaml.safe_load(path.read_text(encoding="utf-8")) or []
    categories: List[Category] = []
    if isinstance(raw, dict):
        for slug, name in raw.items():
            categories.append(Category(name=str(name), slug=str(slug)))
    elif isinstance(raw, list):
        for item in raw:
            if not isinstance(item, dict):
                raise ValueError(f"{path}: each entry must be a mapping")
            if "name" not in item or "slug" not in item:
                raise ValueError(f"{path}: each entry must have 'name' and 'slug'")
            categories.append(Category(name=str(item["name"]), slug=str(item["slug"])))
    else:
        raise ValueError(f"{path}: expected a list or mapping at top level")
    return categories
