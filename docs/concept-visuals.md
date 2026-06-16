# Concept Visual Workflow

Concept visuals are lightweight SVG diagrams rendered in term details. Keep them small, readable, and consistent with the terminal-style app theme.

## Create a New Visual

Run the generator from the repo root:

```bash
python3 scripts/new_concept_visual.py binary-search-tree "Binary Search Tree" \
  --caption "Visual: BST ordering keeps smaller values left and larger values right." \
  --alt "Binary search tree diagram showing left child values smaller than the parent and right child values larger."
```

The script creates:

```text
frontend/public/concepts/<slug>.svg
```

It also prints the TypeScript registry entry to add to `conceptVisuals` in `frontend/src/components/ConceptVisual.tsx`.

## Registry Rules

Each visual needs one registry entry:

```ts
"binary-search-tree": {
  src: "/concepts/binary-search-tree.svg",
  alt: "Binary search tree diagram showing left values smaller and right values larger.",
  caption: "Visual: BST ordering rule for left and right subtrees.",
  note: "Optional short learning note for extra context.",
},
```

- `src` must match the SVG filename in `frontend/public/concepts`.
- `alt` should describe the diagram, not repeat the term name.
- `caption` should explain the learning takeaway in one sentence.
- `note` is optional and should be used only when the diagram needs extra context.

## SVG Style Rules

- Use `viewBox="0 0 960 540"` unless a specific concept needs a different ratio.
- Keep text readable at the inline detail size and in the zoom modal.
- Prefer the app palette: background `#0d1117`, surface `#161b22`, border `#30363d`, text `#e6edf3`, muted `#8b949e`, accent `#58a6ff`, green `#3fb950`.
- Use simple shapes, arrows, and labels that explain the model directly.
- Avoid tiny labels, dense charts, decorative effects, external images, and embedded scripts.
- Include `<title>` and `<desc>` in the SVG for accessibility.

## Checklist

- SVG exists at `frontend/public/concepts/<slug>.svg`.
- Registry entry exists in `ConceptVisual.tsx`.
- Term card shows the visual badge.
- Term detail shows the visual panel.
- Diagram opens cleanly in the zoom modal.
- Caption and optional note are useful below the diagram.
