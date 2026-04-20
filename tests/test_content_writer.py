from pathlib import Path

from backend.content_loader import TermFile, load_term
from backend.content_writer import write_term, delete_term


def _sample() -> TermFile:
    return TermFile(
        slug="binary-search",
        name="Binary Search",
        definition="A divide-and-conquer search on a **sorted** array.",
        example_code="def binary_search(arr, target):\n    pass",
        code_lang="python",
        is_favorite=True,
        categories=["algorithms"],
        tags=["interview-prep", "exam-review"],
        related=["array"],
    )


def test_round_trip(tmp_path: Path):
    original = _sample()
    path = write_term(original, tmp_path)
    loaded = load_term(path)
    assert loaded.slug == original.slug
    assert loaded.name == original.name
    assert loaded.example_code == original.example_code
    assert loaded.code_lang == original.code_lang
    assert loaded.is_favorite == original.is_favorite
    assert loaded.categories == original.categories
    assert loaded.tags == original.tags
    assert loaded.related == original.related
    assert original.definition.strip() in loaded.definition


def test_round_trip_idempotent(tmp_path: Path):
    path = write_term(_sample(), tmp_path)
    first = load_term(path)
    write_term(first, tmp_path)
    second = load_term(path)
    assert first == second


def test_delete_term(tmp_path: Path):
    path = write_term(_sample(), tmp_path)
    assert path.exists()
    delete_term("binary-search", tmp_path)
    assert not path.exists()
    delete_term("binary-search", tmp_path)  # idempotent
