# Handoff: Concept-Master mobile (iOS)

## Overview

Concept-Master is an existing desktop app for studying computer-science terms. This handoff covers the iOS companion: a local-first flashcard and reference app that ships the full term set on device and syncs only when the user asks it to. Five surfaces: **Browse**, **Term detail**, **Study (flashcards)**, **Articles**, and **Add term**.

Navigation is a four-item bottom tab bar — `01 BROWSE / 02 STUDY / 03 ARTICLES / 04 ADD`. Detail views push on top of the active tab and keep the tab bar visible.

## About the design files

The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, not production code to copy. The task is to **recreate these designs in the target codebase's environment** (the intent here is React Native / Expo, running via Expo Go) using its established patterns and libraries. If no app scaffold exists yet, create one — Expo + React Native, with `expo-router` or React Navigation for the tab bar — and implement the designs there.

The HTML prototype renders inside an on-page iPhone frame (`ios-frame.jsx`, 402×874pt). That frame is a presentation device only; the real app renders full-screen with real safe-area insets. Where the prototype hard-codes `padding-top: 62px` for the status bar, use the platform safe-area inset instead. The `83px` tab bar height already matches iOS (49pt bar + 34pt home indicator).

## Fidelity

**High-fidelity.** Colors, type, spacing, and interaction states are final. Recreate the UI to match, substituting the target platform's equivalent primitives. Two visual themes exist in the desktop product — **Midnight** (dark) and **Paper** (light). All approved mobile screens are specified in Midnight; Paper values appear at the end of the Design Tokens section and appear in the rejected `1b` exploration in the prototype.

## Screens / Views

Coordinates below assume a 402pt-wide viewport. All screens are a full-height flex column: header (fixed) → scrollable content (`flex: 1`) → tab bar (fixed, 83px).

### 1. Browse (tab 01)

**Purpose:** find a term by scanning, searching, or filtering by category.

**Layout, top to bottom:**

- **Header block** — background `#151a21`, bottom border `1px solid #2b333e`, padding `62px 16px 12px`.
  - Row 1, `space-between`: wordmark on the left — a `>` glyph in `#7cc4ff` (700, 15px) plus `concept-master` (700, 15px, letter-spacing `-0.01em`, `#e9eef4`); sync chip on the right.
  - **Sync chip** — height 30px, padding `0 10px`, border `1px solid #2b333e`, background `#0f1216`, text `#7c8a99`, 10.5px mono, letter-spacing `.06em`, radius 6px. Label is `SYNCED 2h` when clean. When local edits are pending it becomes the accent variant: border `1px solid #7cc4ff`, background `#1c232c`, text `#7cc4ff`, label `SYNC NOW · <n>`. Tapping it runs a sync.
  - **Search field** — `margin-top: 12px`, height 44px, padding `0 12px`, background `#0f1216`, border `1px solid #2b333e`, radius 8px, gap 9px. Leading `⌕` glyph 15px `#7c8a99`; placeholder `Search 187 terms…` at 14px `#7c8a99` (the count is the live local term count).
- **Category chip rail** — horizontal scroll, padding `12px 14px`, background `#151a21`, bottom border `1px solid #2b333e`, gap 6px. Chips: padding `6px 12px`, radius `9999px`, 12px. Unselected — border `1px solid #2b333e`, text `#a9b6c4`. Selected — border `1px solid #7cc4ff`, background `#1c232c`, text `#e9eef4`. Each chip shows its count in a trailing span at `opacity: .55`. First chip is `All`.
- **Term rows** — one per term, padding `15px 16px`, bottom border `1px solid #2b333e`, and a **3px left border** that is `transparent` normally and `#7cc4ff` when the row is selected/active (selected rows also take background `#1c232c`). This 3px left rule is carried over from the desktop app; keep it.
  - Title: 600 16px mono, `#e9eef4`.
  - Right-hand cluster: an optional `Visual` badge (9.5px, uppercase, letter-spacing `.1em`, border `1px solid #2f4356`, text `#9fd0ff`, radius 3px, padding `1px 5px`) for terms that have a diagram, then a star — `#7cc4ff` when favorited, `#7c8a99` at `opacity: .5` when not.
  - Snippet: `margin: 6px 0 0`, 13px, line-height 1.55, `#a9b6c4`, truncated with an ellipsis.
  - Tag pills: `margin-top: 10px`, gap 5px, 11px, text `#9fd0ff`, background `#1d2733`, border `1px solid #2f4356`, radius 4px, padding `2px 7px`.

**Content used in the mock:** ACID, Array, Binary Search (selected), Big O Notation, Closure.

### 2. Term detail (pushed from Browse)

**Purpose:** read one term — prose definition, code in one or more languages, and an optional diagram.

- **Header** — padding `62px 16px 10px`, background `#151a21`, bottom border `1px solid #2b333e`, `space-between`. Left: `← Browse` at 13px `#7c8a99`. Right: two 32×32 icon buttons, border `1px solid #2b333e`, background `#0f1216`, radius 6px — a star (`#7cc4ff` when favorited) and a `⋯` overflow (`#7c8a99`, 15px) holding Edit / Delete / Share.
- **Body** — padding `20px 16px 0`.
  - **Meta row** — wrapping, gap 7px, `margin-bottom: 14px`. Category chip is solid: background `#7cc4ff`, text `#151a21`, 11px, 600, uppercase, letter-spacing `.12em`, radius 4px, padding `3px 9px`. Tag chips follow: 11.5px, `#9fd0ff` on `#1d2733`, border `1px solid #2f4356`, radius 4px, padding `3px 9px`, prefixed with `#`.
  - **Title** — 700 30px/1.15 mono, letter-spacing `-0.025em`, `#e9eef4`, `margin-bottom: 20px`.
  - **Tab bar (in-page)** — three buttons in a row, gap 4px, over a `1px solid #2b333e` bottom border: `Definition`, `Code`, `Diagram`. Active tab is `#e9eef4` with a 2px `#7cc4ff` underline sitting on the border; inactive is `#7c8a99`. Tabs switch content in place; no navigation.
  - **Definition tab** — prose in **Source Serif 4** 17px, line-height 1.7, `#e9eef4`, paragraphs `margin-bottom: 16px`, `<strong>` for emphasized runs. A complexity line follows (`Time complexity: O(log n)`), then a preview code block.
  - **Code tab** — language selector row (gap 6px, `margin-bottom: 12px`): pills at padding `6px 13px`, radius 6px, 12px; selected is border `1px solid #7cc4ff`, background `#1c232c`, text `#e9eef4`; unselected is border `1px solid #2b333e`, text `#7c8a99`. Below it the full snippet.
  - **Code block** — background `#0a0d11`, border `1px solid #2b333e`, radius 10px, padding 16px, font `12px/1.75` mono, base text `#dbe4ee`. Syntax colors: keywords `#82aaff`, function names `#ffcb6b`, numbers `#f78c6c`. Horizontal scroll rather than wrap.
  - **Diagram tab** — the term's SVG, pinch-to-zoom. Placeholder state in the mock: dashed `1px dashed #2b333e` box on `#151a21`, radius 10px, height 250px, centered label `SVG from /concepts` (10.5px, uppercase, letter-spacing `.16em`, `#7c8a99`) over the filename at 12px `#a9b6c4`.
  - **Related** — `margin-top: 24px`, `padding-top: 18px`, top border `1px solid #2b333e`. Label `RELATED` at 11px, letter-spacing `.14em`, `#7c8a99`. Then link chips: 12.5px, `#a9b6c4` on `#151a21`, border `1px solid #2b333e`, radius 6px, padding `8px 12px`, trailing `→` in `#7c8a99`. Each pushes another Term detail.

### 3. Study — flashcards (tab 02)

**Purpose:** drill terms one card at a time.

- **Header** — padding `62px 16px 12px`, background `#151a21`, bottom border `1px solid #2b333e`. Kicker `UNSCHEDULED PRACTICE` (10.5px, letter-spacing `.14em`, uppercase, `#7c8a99`), title `Study` (700 22px, `#e9eef4`), then a mode segmented row (`margin-top: 12px`, gap 6px): pills at padding `6px 11px`, radius 6px, 12px — selected `Flashcards` is border `1px solid rgba(124,196,255,.4)`, background `rgba(124,196,255,.1)`, text `#7cc4ff`; unselected `Quiz` is border `1px solid #2b333e`, background `#151a21`, text `#7c8a99`.
- **Body** — padding 16px, column, gap 12px.
  - **Progress row** — 11.5px `#7c8a99`, `space-between`: `Card 14 of 187` (the number in `#e9eef4`) and the direction label `Name → Definition`.
  - **Card** — `flex: 1`, background `#151a21`, border `1px solid #2b333e`, radius 10px, padding `24px 20px`. Prompt centered and vertically middled: kicker `WHAT DOES THIS TERM MEAN?` (11px, letter-spacing `.16em`, uppercase, `#7c8a99`), then the term at 700 28px mono `#e9eef4`.
  - **Answer, hidden state** — a single `Show answer` button, centered, `margin-top: 22px`, padding `12px 24px`, background `rgba(124,196,255,.1)`, border `1px solid rgba(124,196,255,.3)`, text `#7cc4ff`, radius 6px, 500 14px. The whole card is also tappable to reveal.
  - **Answer, revealed state** — replaces the button: `margin-top: 22px`, `padding-top: 22px`, top border `1px solid #2b333e`; label `DEFINITION` (11px, letter-spacing `.16em`, `#7c8a99`); body in Source Serif 4 16px/1.65 `#e9eef4`.
  - **Card nav** — two buttons, gap 8px, padding 13px, radius 6px, 13px mono. `Previous` — border `1px solid #2b333e`, transparent background, text `#a9b6c4`. `Next` — border `1px solid rgba(124,196,255,.3)`, background `rgba(124,196,255,.1)`, text `#7cc4ff`. Advancing resets the card to hidden.

> Note: the original brief mentioned four spaced-repetition rating buttons (Again / Hard / Good / Easy). The approved design ships the simpler Previous/Next model first; add ratings later in the same button row if scheduling is implemented.

### 4. Articles (tab 03)

**Purpose:** read long-form pieces that tie terms together.

- **Header** — padding `62px 16px 10px`, background `#151a21`, bottom border `1px solid #2b333e`, `space-between`: `← Articles` at 13px `#7c8a99`, read time at 11px `#7c8a99`.
- **Body** — padding `22px 18px 0`.
  - Category kicker: 11px, uppercase, letter-spacing `.12em`, `#7c8a99`, `margin-bottom: 10px`.
  - Title: 700 26px/1.2 mono, letter-spacing `-0.02em`, `#e9eef4`.
  - Standfirst: Source Serif 4, italic, 16px, `#a9b6c4`, `margin-bottom: 18px`.
  - A `1px` `#2b333e` rule, then body copy: Source Serif 4 17.5px, line-height 1.72, `#e9eef4`, paragraph `margin-bottom: 18px`.
  - Subheadings inside the article switch back to mono: 600 19px, `#e9eef4`, `margin-bottom: 12px`.
  - Footer chips link to related terms — same `→` chip pattern as Term detail, at 12px.

### 5. Add term (tab 04) — three states

**State A — empty form.**

- **Header** — padding `62px 16px 12px`, background `#151a21`, bottom border `1px solid #2b333e`, three-up: `Cancel` (13px `#7c8a99`), centered title `NEW TERM` (600 13px, letter-spacing `.04em`, `#e9eef4`), `Save` on the right — disabled at 13px `#7c8a99` `opacity: .45`, enabled at 600 13px `#7cc4ff`. Save enables once Term and Definition are both non-empty.
- **Body** — padding `20px 16px 0`.
  - **Field label** — 600 10.5px mono, uppercase, letter-spacing `.1em`, `#7c8a99`.
  - **Text input** — `margin-top: 7px`, min-height 46px, padding `0 12px`, background `#0f1216`, border `1px solid #2b333e`, radius 8px, 15px. Placeholder `#7c8a99` at `opacity: .6`; filled value `#e9eef4` 600.
  - **Category** — not a select; a wrapping chip row, `margin-top: 9px`, gap 6px, chips at padding `7px 12px`, radius `9999px`, 12px, same selected/unselected treatment as the Browse rail. A trailing `+ New` chip uses `1px dashed #2b333e` with `#7c8a99` text and opens an inline name field.
  - **Definition** — a textarea styled like the input but min-height 132px, padding 12px, set in **Source Serif 4** 16px/1.65 so it matches how the text will read on the detail screen.
  - **Optional blocks** — a two-up row, `margin-top: 18px`, gap 8px: `+ Code snippet` and `+ Diagram`, each `flex: 1`, height 44px, `1px dashed #2b333e`, radius 8px, centered 12.5px `#7c8a99`. Tapping expands the corresponding editor inline (code editor: language picker + monospace field on `#0a0d11`; diagram: file picker for an SVG).

**State B — tag sheet.** A bottom sheet over the form; it covers the tab bar.

- Sheet — background `#151a21`, top border `1px solid #2b333e`, radius `14px 14px 0 0`, padding `16px 16px 40px`, shadow `0 -18px 40px rgba(0,0,0,.45)`, above everything else in the stack.
- Grabber — 36×4px, `#2b333e`, radius 2px, centered.
- Header row — `TAGS` label on the left (same field-label style), `Done` on the right at 12.5px `#7cc4ff`.
- Tag list — wrapping, gap 7px, `margin-top: 13px`. **Selected** tags invert: background `#7cc4ff`, border `1px solid #7cc4ff`, text `#151a21`, radius 4px, padding `5px 10px`, 12px, with a trailing `✕` that deselects. **Unselected** use the standard pill (`#9fd0ff` on `#1d2733`, border `1px solid #2f4356`).
- Create row — `margin-top: 13px`, height 42px, padding `0 12px`, background `#0f1216`, `1px dashed #2b333e`, radius 8px, `+ Create a new tag` at 13px `#7c8a99`.
- While the sheet is open the Definition field shows a 1.5×17px `#7cc4ff` caret at the end of the text.

**State C — saved.** Dismisses to Browse with the new term at the top.

- The new row is the selected row (3px `#7cc4ff` left rule, `#1c232c` background) and carries an `Unsynced` badge in place of the star — same badge style as `Visual` (9.5px, uppercase, border `1px solid #2f4356`, `#9fd0ff`).
- Header sync chip switches to the accent `SYNC NOW · 1` variant; the search placeholder count increments (`Search 188 terms…`).
- **Toast** — absolutely positioned, `left/right: 14px`, `bottom: 97px` (clears the 83px tab bar), background `#1c232c`, border `1px solid #2f4356`, radius 10px, padding `12px 14px`, shadow `0 10px 30px rgba(0,0,0,.5)`, `space-between`: `Saved locally · 1 term pending` at 13px `#e9eef4`, and a `Sync` action at 600 12.5px `#7cc4ff`. Auto-dismisses after ~4s; the header chip persists until synced.

### Tab bar (all tabs)

Height 83px, `flex: none`, background `#151a21`, top border `1px solid #2b333e`, `padding-top: 9px`, items aligned to the top of the bar. Four equal-width items, each a column with `gap: 5px`: a two-digit numeral above a label. Active item — numeral and label `#7cc4ff`, label 600. Inactive — numeral `#7c8a99` at `opacity: .5`, label `#7c8a99` 400. Labels are 10.5px mono, uppercase, letter-spacing `.08em`: `BROWSE`, `STUDY`, `ARTICLES`, `ADD`. There are no icons; the numerals are the icons. Hit targets are the full item width × 49pt.

## Interactions & behavior

- **Tab bar** — switches root stacks; each tab keeps its own navigation state. Tapping the active tab pops to root.
- **Term row → Term detail** — push, standard iOS slide; back returns with the row still marked selected.
- **Detail tabs** — local state, instant swap, no cross-fade. Content height changes are not animated.
- **Flashcards** — tapping the card body or `Show answer` reveals; `Next`/`Previous` step through the deck and reset to the hidden state. Reveal is instant in the prototype; if animated, a 150ms fade on the answer block is acceptable — do not add a 3D flip.
- **Add term** — Save is disabled until Term and Definition are filled. Save writes to the local store and dismisses immediately; there is no network round trip and no spinner.
- **Sync** — manual only, from the header chip or the toast action. States: `SYNCED <n>h` (clean), `SYNC NOW · <n>` (pending local writes), and an in-progress state (not yet designed — suggest the chip label swapping to `SYNCING…` while disabled).
- **Search** — filters the term list live as typed; the chip rail filters by category and composes with the search string.
- **Favorites** — the star toggles on both the row and the detail header; it is a local flag.
- **Focus / press states** — rows and chips take the `#1c232c` background on press. Nothing in this design relies on hover.

## State management

Local, on-device, no backend at runtime:

- `terms: Term[]` — `{ id, name, definition, category, tags[], snippets: {lang: code}[], diagram?: svgRef, favorite: bool, updatedAt, synced: bool }`. Ships bundled with the app (187 terms at time of design) and is the single source of truth.
- `articles: Article[]` — `{ id, title, standfirst, category, body, readMinutes, relatedTermIds[] }`.
- `ui.activeTab`, `ui.searchQuery`, `ui.activeCategory` — Browse filter state.
- `detail.activeTab` — `definition | code | diagram`; `detail.activeLanguage`.
- `study.deck`, `study.index`, `study.revealed`, `study.mode` (`flashcards | quiz`).
- `addTerm.draft` + `addTerm.tagSheetOpen` — the draft should survive backgrounding; persist it.
- `sync.lastSyncedAt`, `sync.pendingCount` — derived from `terms.filter(t => !t.synced).length`.

Storage: a JSON document or SQLite (expo-sqlite) is fine; the data set is small and read-heavy. Writes are synchronous from the user's point of view. Sync is an explicit user action that pushes unsynced records and pulls updates — conflict handling is not yet designed.

## Design tokens

**Midnight (the approved theme)**

| Role | Value |
| --- | --- |
| App background | `#0f1216` |
| Raised surface / header / tab bar / card | `#151a21` |
| Code block background | `#0a0d11` |
| Selected row / pressed / accent tint | `#1c232c` |
| Border | `#2b333e` |
| Border on tinted chips | `#2f4356` |
| Tag chip background | `#1d2733` |
| Primary text | `#e9eef4` |
| Secondary text | `#a9b6c4` |
| Muted text | `#7c8a99` |
| Accent | `#7cc4ff` |
| Accent text on tinted chips | `#9fd0ff` |
| Accent soft fill | `rgba(124,196,255,.1)` |
| Accent soft border | `rgba(124,196,255,.3)` — `.4` on selected |
| Code: keyword / function / number | `#82aaff` / `#ffcb6b` / `#f78c6c` |
| Code base text | `#dbe4ee` |

**Paper (light theme, from the desktop app)** — background `#faf9f7`, secondary surface `#f2f0ec`, text `#1a1c1f`, muted `#787f88`, border `#ddd7cd`, strong rule `2px solid #1a1c1f`, accent `#0b62c4`.

**Type**

- Interface/mono: **JetBrains Mono** — 400, 500, 600, 700.
- Reading: **Source Serif 4** — 400, 600, 700, plus italic for standfirsts.
- Scale in use: 9.5, 10.5, 11, 11.5, 12, 12.5, 13, 14, 15, 16, 17, 17.5, 19, 22, 26, 28, 30px.
- Letter-spacing: `-0.025em` on the 30px title, `-0.02em` on 26px, `.08em` on tab labels, `.1em`–`.16em` on uppercase kickers.
- Line-height: 1.55 for row snippets, 1.65–1.72 for serif body, 1.7–1.75 for code, 1.15–1.2 for large titles.

**Spacing** — 5, 6, 7, 8, 9, 10, 12, 13, 14, 16, 18, 20, 22, 24px. Screen gutter is 16px (18px in the article reader, 20px in the Paper exploration).

**Radius** — 3px (small badges), 4px (tag pills), 6px (buttons, icon buttons, language pills), 8px (inputs, search), 10px (cards, code blocks, toast), 14px top-only (bottom sheet), `9999px` (category chips).

**Shadows** — bottom sheet `0 -18px 40px rgba(0,0,0,.45)`; toast `0 10px 30px rgba(0,0,0,.5)`. Nothing else is elevated.

**Borders** — `1px solid #2b333e` everywhere; the one exception is the **3px left rule** on active term rows, and `2px solid #1a1c1f` section rules in the Paper theme.

## Assets

- **Fonts** — JetBrains Mono and Source Serif 4, both Google Fonts / SIL Open Font License. Bundle them with the app rather than loading remotely.
- **Diagrams** — per-term SVGs sourced from the existing desktop app's `/concepts` directory (e.g. `binary-search.svg`). Not included in this bundle; pull them from the desktop repo and bundle them on device.
- **Icons** — none. Glyphs used are plain text characters: `>`, `⌕`, `★`, `⋯`, `←`, `→`, `✕`. Substituting a real icon set is fine as long as weights match the surrounding mono type.
- **Term and article content** — the mock uses real entries from the desktop app (ACID, Array, Binary Search, Big O Notation, Closure, Hash Table, and the article "Understanding Big-O Notation").

## Files

- `Concept Master Mobile.dc.html` — the prototype. Two turns: **turn 1** holds `1a` (the approved five screens) and `1b` (a rejected hub-navigation exploration, shown in the Paper theme — useful as context for what was ruled out); **turn 2** holds `2a` (the Add term flow). Open it in a browser; detail tabs and the flashcard reveal are interactive.
- `ios-frame.jsx` — the on-page iPhone frame used to present the screens. Presentation only; not part of the app.
- `support.js` — runtime for the prototype format. Not part of the app.
- `Concept Master Desktop.dc.html` — the existing desktop design the mobile app derives from. Reference for vocabulary, the Paper theme, and terminology.
- `screenshots/1a-core-screens.png` — Browse, Term detail, Study, Articles.
- `screenshots/1a-alt-states-code-tab-and-revealed-card.png` — the same four with the Code tab selected and the flashcard answer revealed.
- `screenshots/2a-add-term-flow.png` — Add term: empty form, tag sheet, saved and pending sync.

## Open questions

These were not resolved during design and need a decision before or during implementation:

1. **Code snippet editor** — full screen push or inline expansion within the Add form?
2. **Sync conflicts** — what happens when the same term changed on both device and desktop.
3. **Sync in progress** — the chip's loading state is unspecified.
4. **Spaced repetition** — whether Study gets scheduling and rating buttons, or stays a plain deck.
5. **Quiz mode** — present in the Study header as a segmented option but never designed.
6. **Stats / review-queue screens** — mentioned early, not in scope for these five screens.
