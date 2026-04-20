from pathlib import Path

import pytest

from backend.content_loader import load_term, load_all_terms, load_categories


def _write(tmp_path: Path, slug: str, text: str) -> Path:
    terms = tmp_path / "terms"
    terms.mkdir(exist_ok=True)
    path = terms / f"{slug}.md"
    path.write_text(text, encoding="utf-8")
    return path


def test_load_term_basic(tmp_path: Path):
    path = _write(
        tmp_path,
        "array",
        """---
name: Array
categories: [data-structures]
tags: [fundamentals]
code_lang: python
---

A contiguous block of memory.

```python
nums = [1, 2, 3]
```
""",
    )
    term = load_term(path)
    assert term.slug == "array"
    assert term.name == "Array"
    assert term.categories == ["data-structures"]
    assert term.tags == ["fundamentals"]
    assert term.code_lang == "python"
    assert term.example_code == "nums = [1, 2, 3]"
    assert "contiguous block" in term.definition
    assert "```" not in term.definition


def test_load_term_prefers_matching_lang(tmp_path: Path):
    path = _write(
        tmp_path,
        "thing",
        """---
name: Thing
code_lang: python
---

Inline Java:

```java
int x = 1;
```

Python translation:

```python
x = 1
```
""",
    )
    term = load_term(path)
    assert term.example_code == "x = 1"
    assert term.code_lang == "python"
    assert "int x = 1;" in term.definition


def test_load_term_no_code_block(tmp_path: Path):
    path = _write(
        tmp_path,
        "plain",
        """---
name: Plain
---

Just prose, no code.
""",
    )
    term = load_term(path)
    assert term.example_code is None
    assert term.code_lang is None
    assert "Just prose" in term.definition


def test_load_term_missing_name(tmp_path: Path):
    path = _write(tmp_path, "bad", "---\ncategories: []\n---\n\nbody\n")
    with pytest.raises(ValueError):
        load_term(path)


def test_load_all_terms_sorted(tmp_path: Path):
    _write(tmp_path, "b", "---\nname: B\n---\n")
    _write(tmp_path, "a", "---\nname: A\n---\n")
    terms = load_all_terms(tmp_path)
    assert [t.slug for t in terms] == ["a", "b"]


def test_load_categories_list(tmp_path: Path):
    p = tmp_path / "categories.yml"
    p.write_text(
        "- name: Data Structures\n  slug: data-structures\n"
        "- name: Algorithms\n  slug: algorithms\n",
        encoding="utf-8",
    )
    cats = load_categories(p)
    assert [(c.slug, c.name) for c in cats] == [
        ("data-structures", "Data Structures"),
        ("algorithms", "Algorithms"),
    ]


def test_load_categories_missing(tmp_path: Path):
    assert load_categories(tmp_path / "nope.yml") == []
