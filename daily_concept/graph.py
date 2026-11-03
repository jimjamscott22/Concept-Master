"""Load and validate the curated curriculum without database or provider access.

Run ``uv run python -m daily_concept.graph validate [--path concepts.yaml]``.
"""
from __future__ import annotations

import argparse
from collections import Counter
from enum import StrEnum
from pathlib import Path
import sys
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, ValidationError
import yaml


DEFAULT_GRAPH_PATH = Path(__file__).resolve().parent.parent / "content/daily_concepts/concepts.yaml"
ConceptId = Annotated[str, StringConstraints(max_length=255, pattern=r"^[a-z0-9]+(-[a-z0-9]+)*$")]
NonEmptyText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class Domain(StrEnum):
    NETWORKING = "networking"
    SYSTEMS = "systems"
    SECURITY = "security"
    AI_ML = "ai-ml"
    PYTHON = "python"
    WEB = "web"
    DATA = "data"
    SOFTWARE_ENGINEERING = "software-engineering"
    HARDWARE = "hardware"


class ConceptDef(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: ConceptId
    title: NonEmptyText
    domain: Domain
    tags: list[NonEmptyText] = Field(default_factory=list)
    difficulty: int = Field(strict=True, ge=1, le=5)
    prerequisites: list[ConceptId] = Field(default_factory=list)
    related: list[ConceptId] = Field(default_factory=list)
    angle: NonEmptyText | None = None


class GraphValidationError(ValueError):
    """Invalid graph document, references, or prerequisite cycle."""


def validate_graph(concepts: list[ConceptDef]) -> None:
    """Validate identities and references, then check prerequisite edges for cycles."""
    by_id: dict[str, ConceptDef] = {}
    for concept in concepts:
        if concept.id in by_id:
            raise GraphValidationError(f"Duplicate concept id: {concept.id}")
        by_id[concept.id] = concept

    for concept in concepts:
        for field in ("prerequisites", "related"):
            for reference in getattr(concept, field):
                if reference not in by_id:
                    raise GraphValidationError(
                        f"{concept.id}: unknown {field} id '{reference}'"
                    )

    # An explicit DFS stack also handles long user-edited chains without recursion limits.
    visited: set[str] = set()
    for root in sorted(by_id):
        if root in visited:
            continue
        path = [root]
        positions = {root: 0}
        stack = [iter(by_id[root].prerequisites)]
        while stack:
            child = next(stack[-1], None)
            if child is None:
                visited.add(path[-1])
                positions.pop(path.pop())
                stack.pop()
            elif child in positions:
                cycle = path[positions[child]:] + [child]
                raise GraphValidationError("Prerequisite cycle: " + " -> ".join(cycle))
            elif child not in visited:
                positions[child] = len(path)
                path.append(child)
                stack.append(iter(by_id[child].prerequisites))


def load_graph(path: Path = DEFAULT_GRAPH_PATH) -> list[ConceptDef]:
    """Read a YAML list, validate it completely, and return concepts sorted by ID."""
    try:
        document = yaml.safe_load(Path(path).read_text(encoding="utf-8"))
    except yaml.YAMLError as exc:
        raise GraphValidationError(f"Invalid YAML in {path}: {exc}") from exc
    if not isinstance(document, list) or not document:
        raise GraphValidationError("Concept graph must be a non-empty YAML list")

    concepts = []
    for index, entry in enumerate(document):
        try:
            concepts.append(ConceptDef.model_validate(entry))
        except ValidationError as exc:
            raise GraphValidationError(f"Concept entry {index + 1}: {exc}") from exc
    validate_graph(concepts)
    return sorted(concepts, key=lambda concept: concept.id)


def format_summary(concepts: list[ConceptDef]) -> str:
    domains = Counter(concept.domain for concept in concepts)
    difficulties = Counter(concept.difficulty for concept in concepts)
    roots = sorted(concept.id for concept in concepts if not concept.prerequisites)
    lines = [f"Valid concept graph: {len(concepts)} concepts", "Domains:"]
    lines.extend(f"  {domain.value}: {domains[domain]}" for domain in Domain)
    lines.append("Difficulty:")
    lines.extend(f"  {level}: {difficulties[level]}" for level in range(1, 6))
    lines.append("Roots: " + ", ".join(roots))
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    validate = commands.add_parser("validate", help="Validate the curated concept graph")
    validate.add_argument("--path", type=Path, default=DEFAULT_GRAPH_PATH)
    args = parser.parse_args(argv)
    try:
        concepts = load_graph(args.path)
    except (OSError, UnicodeError, GraphValidationError) as exc:
        print(f"Graph validation failed: {exc}", file=sys.stderr)
        return 1
    print(format_summary(concepts))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
