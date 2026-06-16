#!/usr/bin/env python3
"""Create a starter SVG asset and registry snippet for a concept visual."""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from textwrap import dedent
from xml.sax.saxutils import escape


SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create frontend/public/concepts/<slug>.svg from the Concept Master template."
    )
    parser.add_argument("slug", help="Term slug, for example binary-search-tree")
    parser.add_argument("name", help="Display name, for example Binary Search Tree")
    parser.add_argument(
        "--caption",
        default=None,
        help="Optional caption to store in the ConceptVisual registry snippet.",
    )
    parser.add_argument(
        "--note",
        default=None,
        help="Optional learning note to store in the ConceptVisual registry snippet.",
    )
    parser.add_argument(
        "--alt",
        default=None,
        help="Alt text to store in the ConceptVisual registry snippet.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite an existing SVG file for this slug.",
    )
    return parser.parse_args()


def svg_template(name: str) -> str:
    safe_name = escape(name)
    return dedent(
        f"""\
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540" role="img" aria-labelledby="title desc">
          <title id="title">{safe_name} concept diagram</title>
          <desc id="desc">Starter concept diagram template for {safe_name}.</desc>
          <rect width="960" height="540" rx="28" fill="#0d1117"/>
          <rect x="32" y="32" width="896" height="476" rx="24" fill="#161b22" stroke="#30363d" stroke-width="2"/>
          <text x="64" y="88" fill="#8b949e" font-family="JetBrains Mono, monospace" font-size="20" letter-spacing="2">CONCEPT VISUAL</text>
          <text x="64" y="138" fill="#e6edf3" font-family="IBM Plex Sans, system-ui, sans-serif" font-size="44" font-weight="600">{safe_name}</text>
          <g transform="translate(128 210)">
            <rect x="0" y="0" width="220" height="96" rx="18" fill="#1c2128" stroke="#58a6ff" stroke-width="3"/>
            <rect x="306" y="0" width="220" height="96" rx="18" fill="#1c2128" stroke="#3fb950" stroke-width="3"/>
            <rect x="612" y="0" width="220" height="96" rx="18" fill="#1c2128" stroke="#f0883e" stroke-width="3"/>
            <path d="M232 48h58" stroke="#8b949e" stroke-width="4" stroke-linecap="round"/>
            <path d="M520 48h76" stroke="#8b949e" stroke-width="4" stroke-linecap="round"/>
            <path d="M290 48l-14 -12m14 12l-14 12M596 48l-14 -12m14 12l-14 12" stroke="#8b949e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <text x="110" y="56" text-anchor="middle" fill="#e6edf3" font-family="JetBrains Mono, monospace" font-size="22">Input</text>
            <text x="416" y="56" text-anchor="middle" fill="#e6edf3" font-family="JetBrains Mono, monospace" font-size="22">Process</text>
            <text x="722" y="56" text-anchor="middle" fill="#e6edf3" font-family="JetBrains Mono, monospace" font-size="22">Result</text>
          </g>
          <text x="64" y="462" fill="#8b949e" font-family="IBM Plex Sans, system-ui, sans-serif" font-size="22">Replace the placeholder boxes with the smallest useful visual model for this concept.</text>
        </svg>
        """
    )


def ts_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def main() -> int:
    args = parse_args()
    slug = args.slug.strip()
    name = args.name.strip()

    if not SLUG_RE.fullmatch(slug):
        raise SystemExit("Slug must be lowercase kebab-case, for example binary-search-tree.")
    if not name:
        raise SystemExit("Name must not be empty.")

    repo_root = Path(__file__).resolve().parents[1]
    svg_path = repo_root / "frontend" / "public" / "concepts" / f"{slug}.svg"
    svg_path.parent.mkdir(parents=True, exist_ok=True)

    if svg_path.exists() and not args.force:
        raise SystemExit(f"{svg_path} already exists. Re-run with --force to overwrite it.")

    svg_path.write_text(svg_template(name), encoding="utf-8")

    alt = args.alt or f"Diagram explaining the core idea of {name}."
    caption = args.caption or f"Visual: {name} at a glance."

    lines = [
        f'  "{slug}": {{',
        f'    src: "/concepts/{slug}.svg",',
        f"    alt: {ts_string(alt)},",
        f"    caption: {ts_string(caption)},",
    ]
    if args.note:
        lines.append(f"    note: {ts_string(args.note)},")
    lines.append("  },")

    print(f"Created {svg_path.relative_to(repo_root)}")
    print()
    print("Add this entry to conceptVisuals in frontend/src/components/ConceptVisual.tsx:")
    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
