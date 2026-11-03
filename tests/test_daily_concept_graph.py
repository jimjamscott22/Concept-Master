from pathlib import Path

import pytest
import yaml

from daily_concept.graph import (
    DEFAULT_GRAPH_PATH,
    Domain,
    GraphValidationError,
    load_graph,
    main,
)


def _concept(concept_id: str, **overrides) -> dict:
    return {
        "id": concept_id,
        "title": f"Concept {concept_id}",
        "domain": "python",
        "difficulty": 1,
        **overrides,
    }


def _write(tmp_path: Path, concepts) -> Path:
    path = tmp_path / "concepts.yaml"
    path.write_text(yaml.safe_dump(concepts), encoding="utf-8")
    return path


def test_load_valid_graph_sorted_with_optional_fields(tmp_path):
    path = _write(tmp_path, [
        _concept("child", prerequisites=["root"], related=["root"]),
        _concept("root"),
    ])
    concepts = load_graph(path)
    assert [concept.id for concept in concepts] == ["child", "root"]
    assert concepts[0].prerequisites == ["root"]
    assert concepts[1].domain == Domain.PYTHON
    assert concepts[1].tags == []
    assert concepts[1].angle is None


def test_duplicate_ids_rejected(tmp_path):
    with pytest.raises(GraphValidationError, match="Duplicate concept id: root"):
        load_graph(_write(tmp_path, [_concept("root"), _concept("root")]))


@pytest.mark.parametrize("field", ["prerequisites", "related"])
def test_missing_reference_identifies_source_and_field(tmp_path, field):
    with pytest.raises(GraphValidationError, match=f"root: unknown {field} id 'missing'"):
        load_graph(_write(tmp_path, [_concept("root", **{field: ["missing"]})]))


def test_prerequisite_cycle_reports_path(tmp_path):
    concepts = [
        _concept("a", prerequisites=["b"]),
        _concept("b", prerequisites=["c"]),
        _concept("c", prerequisites=["a"]),
    ]
    with pytest.raises(GraphValidationError, match="a -> b -> c -> a"):
        load_graph(_write(tmp_path, concepts))


def test_self_cycle_reports_path(tmp_path):
    with pytest.raises(GraphValidationError, match="a -> a"):
        load_graph(_write(tmp_path, [_concept("a", prerequisites=["a"])]))


def test_related_cycles_are_allowed(tmp_path):
    concepts = load_graph(_write(tmp_path, [
        _concept("a", related=["b"]), _concept("b", related=["a"]),
    ]))
    assert len(concepts) == 2


def test_shared_prerequisite_is_not_a_cycle(tmp_path):
    concepts = load_graph(_write(tmp_path, [
        _concept("a", prerequisites=["b", "c"]),
        _concept("b", prerequisites=["d"]),
        _concept("c", prerequisites=["d"]),
        _concept("d"),
    ]))
    assert len(concepts) == 4


@pytest.mark.parametrize("changes", [
    {"id": "Bad_slug"},
    {"id": "bad\n"},
    {"difficulty": 0},
    {"difficulty": 6},
    {"difficulty": True},
    {"difficulty": 2.5},
    {"difficulty": "2"},
    {"domain": "unknown"},
    {"title": "  "},
    {"tags": [""]},
    {"prerequisites": "root"},
    {"related": [123]},
    {"typo": "unexpected field"},
])
def test_invalid_fields_rejected(tmp_path, changes):
    with pytest.raises(GraphValidationError, match="Concept entry 1"):
        load_graph(_write(tmp_path, [_concept("root", **changes)]))


@pytest.mark.parametrize("document", [None, [], {}, "text", ["text"]])
def test_invalid_document_shape(tmp_path, document):
    with pytest.raises(GraphValidationError):
        load_graph(_write(tmp_path, document))


def test_invalid_yaml(tmp_path):
    path = tmp_path / "broken.yaml"
    path.write_text("- id: [unterminated", encoding="utf-8")
    with pytest.raises(GraphValidationError, match="Invalid YAML"):
        load_graph(path)


def test_seed_curriculum_coverage():
    concepts = load_graph(DEFAULT_GRAPH_PATH)
    assert len(concepts) == 30
    assert {concept.domain for concept in concepts} == set(Domain)
    assert all(concept.angle for concept in concepts)
    assert sum(not concept.prerequisites and concept.difficulty == 1 for concept in concepts) >= 5
    by_id = {concept.id: concept for concept in concepts}

    def depth(concept_id):
        return 1 + max((depth(parent) for parent in by_id[concept_id].prerequisites), default=0)

    assert max(depth(concept.id) for concept in concepts) >= 4


def test_cli_summary(tmp_path, capsys):
    path = _write(tmp_path, [_concept("root")])
    assert main(["validate", "--path", str(path)]) == 0
    output = capsys.readouterr()
    assert "Valid concept graph: 1 concepts" in output.out
    assert "python: 1" in output.out
    assert "1: 1" in output.out
    assert "Roots: root" in output.out
    assert output.err == ""


def test_cli_invalid_graph_returns_failure(tmp_path, capsys):
    path = _write(tmp_path, [_concept("root", prerequisites=["missing"])])
    assert main(["validate", "--path", str(path)]) == 1
    output = capsys.readouterr()
    assert output.out == ""
    assert "unknown prerequisites id 'missing'" in output.err


def test_cli_missing_file_returns_failure(tmp_path, capsys):
    assert main(["validate", "--path", str(tmp_path / "missing.yaml")]) == 1
    assert "Graph validation failed:" in capsys.readouterr().err


def test_default_path_independent_of_working_directory(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    assert len(load_graph()) == 30
