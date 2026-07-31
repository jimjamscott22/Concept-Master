# Concept Master Design System

## Product

Concept Master is a local-first study and reference application for programming concepts. Its primary job is to let a student scan categories, select a concise concept entry, and read a structured explanation with commands or code nearby. The requested feature adds a Git category containing ten practical command-family terms.

## Architecture and Main Surfaces

- A persistent 56 px header contains the wordmark, search, numbered primary navigation, view controls, and CRUD actions.
- The default power-user Browse layout uses three panes: a 256 px category sidebar, a 336 px term list, and a flexible reader.
- The same category data also appears as a horizontal chip rail in the two-pane layout.
- Git is a normal category, not a promoted product area. It must use the existing category row, count, selected-state, term-card, and reader patterns.

## Visual Direction

The interface is a restrained terminal/editor workspace. Keep it dense, precise, and educational. Do not introduce marketing-page patterns, oversized cards, decorative gradients, glass effects, or a new Git-specific brand treatment.

## Typography

- UI and headings: `JetBrains Mono`, weights 400–700.
- Long-form definition prose: `Source Serif 4`, 17.5 px, 1.72 line height in hybrid mode.
- Optional all-monospace reading mode: `JetBrains Mono`, 15 px, 1.7 line height.
- Category headings: uppercase, approximately 10.5 px, 0.14 em tracking.
- Category rows: 13 px.
- Counts: 11 px, muted.

## Default Midnight Tokens

- Background: `rgb(15 18 22)`
- Header/sidebar: `rgb(21 26 33)`
- Hover/selected surface: `rgb(28 35 44)`
- Border: `rgb(43 51 62)`
- Primary text: `rgb(233 238 244)`
- Secondary text: `rgb(169 182 196)`
- Muted text: `rgb(124 138 153)`
- Accent: `rgb(124 196 255)`
- Secondary accent: `rgb(154 230 180)`
- Selection: `rgb(39 64 90)`
- Code background: `rgb(10 13 17)`

Paper, Sepia, Ocean, and High Contrast themes use the exact token sets in `frontend/src/styles/globals.css`. Every design must remain token-based and readable in all five themes.

## Shape and Spacing

- Borders are 1 px using the line token.
- Category selection uses a 2 px accent border on the left.
- Category rows use approximately 10 px horizontal and 8 px vertical padding with 6 px radius.
- Header controls use 7 px radius.
- Tags use compact 3–4 px radii.
- Avoid large shadows; the app relies on pane borders and background steps for hierarchy.

## Interaction

- Category rows highlight on hover and use the accent border when selected.
- Clicking an already-selected category clears the filter.
- Counts remain aligned at the far right.
- The Git category filters the list to ten terms.
- Selecting a Git term opens its existing reader view. Command examples use the Code tab and Bash syntax highlighting.

## Motion

- Color transitions are short and restrained.
- Detail content uses a 150 ms fade and 8 px horizontal entrance.
- No new motion is needed for the Git category.

## Feature-Specific Constraints

- Add exactly one ordinary category row labeled `Git`, with a term count of 10.
- Preserve alphabetical category ordering as supplied by the backend.
- Do not add GitHub, GitLab, hosting-service, or `gh` CLI content.
- Do not create category icons, Git logos, nested navigation, accordions, or Git-specific colors.
- On the content surface, use one term per command family and keep terminology action-oriented.
