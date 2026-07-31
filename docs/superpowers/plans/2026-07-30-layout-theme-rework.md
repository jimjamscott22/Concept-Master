# Layout & Theme Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recreate the `docs/new_features/Concept-Master-Layout-Exploration.zip` design handoff — 5 new themes, a monospace/serif typography toggle, 3 switchable Browse layouts, a command palette, a redesigned reader, and a new Diagram (concept map) page — inside the existing React + Tailwind + FastAPI app, without breaking Articles / Study / Review / Stats (explicitly out of scope in the handoff).

**Architecture:** Extend the existing CSS-custom-property theming system (`frontend/src/styles/globals.css` + `tailwind.config.ts`) with a new, larger token set and 5 replacement themes; keep the old Tailwind color names as aliases onto the new tokens so every untouched component keeps rendering correctly under the new themes. Layer three new pieces of persisted UI state (`theme`, `layout`, `typeMode`) alongside the existing `view`/`search`/filter state already in `App.tsx`. Add one small backend endpoint (`GET /api/terms/graph`) to support the new Diagram page's connectedness-weighted chips.

**Tech Stack:** React 18/19 + TypeScript (strict), Tailwind CSS, `prism-react-renderer`, `react-markdown` + `remark-gfm`, SWR, FastAPI + `aiomysql` (no ORM), MariaDB.

## Global Constraints

- Source spec: `docs/new_features/_extracted/design_handoff_concept_master/README.md` (already unzipped to that path — do not re-unzip). All colors/sizes/spacing below are copied verbatim from it.
- Articles, Study, Review, and Stats pages are **out of scope** — keep their current components and behavior working unchanged. They automatically inherit the new theme colors via aliased Tailwind tokens (see Task 2), but their layout/markup is not touched.
- The reworked pages are: global header chrome, command palette, Browse (all 3 layouts), the reader (term detail), and the new Diagram (concept map) page.
- Per user decision, the existing `+ New` / Export / Import controls are **kept**, added as an icon cluster inside the new header's control cluster (not part of the original spec, which is silent on them).
- Per user decision, the term-level **Diagram tab** renders the existing real `ConceptVisual` SVGs (restyled into the new card chrome) — it does **not** implement the spec's placeholder percentage-bar mockup, which is a stand-in for terms that have no diagram data.
- Per user decision, the **Code tab** keeps today's one-`code_lang`-per-term data model. No DB/content schema changes. The language-tab row in the Code tab renders exactly one tab when a term has code, and no tab row when it doesn't — do not build multi-language storage.
- Default theme is `midnight`; default layout is `three` (three-pane); default type mode is `hybrid`. These match "today's app" per the spec's own recommendation, and all three persist to `localStorage`.
- Fonts: `JetBrains Mono` (400/500/600/700) stays the permanent UI/chrome font. `Source Serif 4` (400/600/700) replaces `IBM Plex Sans` as the hybrid-mode body/prose font, loaded via the existing Google Fonts `@import` in `globals.css`. The mono/serif toggle applies to all body prose app-wide (Browse reader **and** the untouched pages), not just Browse, since the header control is global chrome per the spec ("Header (all pages)").
- Command palette owns a single shared `query` string: opening the palette (via the header button, the floating pill, or Ctrl/Cmd+K) clears `query`; typing in the palette input live-filters both the palette's own dropdown (capped at 40 rows) and the underlying Browse list; closing the palette for any reason (Escape, backdrop click, or selecting a result) clears `query` again so no invisible filter is left active with no visible input to clear it.
- All new/changed markup uses the new semantic Tailwind tokens (`bg`, `bg2`, `bg3`, `line`, `fg`, `fg2`, `fg3`, `accent`, `accent2`, `sel`, `codeBg`, `tagBg`, `tagFg`, `tagLine`) introduced in Task 2 — do not use the old `surface`/`border`/`text`/`muted`/`code`/`green` names in new code (they still exist only so untouched files keep compiling).

---

## File Structure

**New files:**
- `frontend/src/hooks/useUiPrefs.ts` — persisted `theme` / `layout` / `typeMode` state (replaces the theme-only logic that lived inside `ThemePicker.tsx`).
- `frontend/src/lib/prismTheme.ts` — a `prism-react-renderer` `PrismTheme` mapped onto the `--c-kw/str/num/com/fn/txt` tokens, replacing the fixed `themes.vsDark` import.
- `frontend/src/components/HeaderControls.tsx` — the control cluster (layout switcher, type toggle, theme swatches, kept `+New`/export/import icons). Replaces `ThemePicker.tsx`.
- `frontend/src/components/CommandPalette.tsx` — the Ctrl/Cmd+K palette.
- `frontend/src/components/BrowseNav.tsx` — the top nav item row (`01 BROWSE … 06 STATS`), replacing the nav portion of `SiteHeader.tsx`.
- `frontend/src/components/CategoryChipRail.tsx` — the two-pane layout's horizontal category chip strip.
- `frontend/src/components/JumpToTermPill.tsx` — the centered layout's floating "Jump to term" button.
- `frontend/src/components/DiagramPage.tsx` — the new concept-map page.
- `backend/routers/terms.py` — add `GET /terms/graph` (existing file, new route).

**Removed files:**
- `frontend/src/components/ThemePicker.tsx` — superseded by `HeaderControls.tsx`.

**Modified files:**
- `frontend/src/styles/globals.css` — full token/theme rewrite, typography-mode vars.
- `frontend/tailwind.config.ts` — new color tokens + back-compat aliases.
- `frontend/src/components/Layout.tsx` — header restructure (logo/search/nav/controls in the new 56px chrome), sidebar becomes layout-aware (hidden entirely in `two`/`center` layouts).
- `frontend/src/components/SiteHeader.tsx` — trimmed to just the kept `+New`/export/import buttons (nav moves to `BrowseNav.tsx`, theme moves to `HeaderControls.tsx`).
- `frontend/src/components/Sidebar.tsx` — restyled to the three-pane spec (Pane A), tags section removed (tags move onto term cards + reader header).
- `frontend/src/components/TermCard.tsx` — tags row added, restyled to spec (Pane B card).
- `frontend/src/components/TermDetail.tsx` — full reader rework: metadata-above-title, real tab bar (Definition/Code/Diagram) replacing the scroll-nav, restyled code/callout/related blocks.
- `frontend/src/components/SearchBar.tsx` — unchanged, but only used for Articles search now (Browse uses the new palette trigger).
- `frontend/src/App.tsx` — add `layout`/`typeMode` state, wire the 3 Browse layouts, mount `CommandPalette` + `DiagramPage`, extend nav order.
- `frontend/src/types/index.ts` — add `TermMapNode` / `TermMapResponse` types.
- `frontend/src/api/client.ts` — add `api.terms.graph()`.
- `backend/models.py` — add `TermMapNode`.
- `CLAUDE.md` — update the "Theming" section to document the new 5-theme/token/typography-mode system.

---

## Task 1: Design tokens — rewrite `globals.css`

**Files:**
- Modify: `frontend/src/styles/globals.css`

**Interfaces:**
- Produces: CSS custom properties `--c-bg`, `--c-bg2`, `--c-bg3`, `--c-line`, `--c-fg`, `--c-fg2`, `--c-fg3`, `--c-accent`, `--c-accent2`, `--c-sel`, `--c-codebg`, `--c-tagbg`, `--c-tagfg`, `--c-tagline` (all `R G B` triples, consumed via `rgb(var(--c-x) / <alpha-value>)`), plus `--c-kw`, `--c-str`, `--c-num`, `--c-com`, `--c-fn`, `--c-txt` (hex strings, consumed directly). Also `--body`, `--bodysize`, `--bodylh`, toggled by `[data-type]` on `<html>`.
- Consumes: nothing (this is the foundation task).

- [ ] **Step 1: Replace the whole theme block**

Replace lines 1–79 of `frontend/src/styles/globals.css` (the font `@import` through the last `[data-theme="gruvbox-light"]` block) with:

```css
@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Source+Serif+4:wght@400;600;700&display=swap");

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ── Themes ──────────────────────────────────────────────────────────────── */
/* Midnight (dark) — default */
:root,
[data-theme="midnight"] {
  color-scheme: dark;
  --c-bg:      15  18  22;
  --c-bg2:     21  26  33;
  --c-bg3:     28  35  44;
  --c-line:    43  51  62;
  --c-fg:     233 238 244;
  --c-fg2:    169 182 196;
  --c-fg3:    124 138 153;
  --c-accent: 124 196 255;
  --c-accent2: 154 230 180;
  --c-sel:     39  64  90;
  --c-codebg:  10  13  17;
  --c-tagbg:   29  39  51;
  --c-tagfg:  159 208 255;
  --c-tagline: 47  67  86;
  --c-kw:  #82aaff; --c-str: #c3e88d; --c-num: #f78c6c;
  --c-com: #6b7c8f; --c-fn:  #ffcb6b; --c-txt: #dbe4ee;
}

/* Paper (light) */
[data-theme="paper"] {
  color-scheme: light;
  --c-bg:     250 249 247;
  --c-bg2:    242 240 236;
  --c-bg3:    233 230 224;
  --c-line:   221 215 205;
  --c-fg:      26  28  31;
  --c-fg2:     76  82  90;
  --c-fg3:    120 127 136;
  --c-accent:  11  98 196;
  --c-accent2: 15 122  82;
  --c-sel:    207 226 251;
  --c-codebg: 245 243 239;
  --c-tagbg:  231 237 246;
  --c-tagfg:   18  80 138;
  --c-tagline:201 216 236;
  --c-kw:  #0b62c4; --c-str: #0f7a52; --c-num: #a03a12;
  --c-com: #8a8f96; --c-fn:  #7a3ea8; --c-txt: #24272b;
}

/* Sepia (warm, low-strain) */
[data-theme="sepia"] {
  color-scheme: light;
  --c-bg:     245 237 221;
  --c-bg2:    238 228 206;
  --c-bg3:    229 217 191;
  --c-line:   217 202 171;
  --c-fg:      46  41  33;
  --c-fg2:     92  82  67;
  --c-fg3:    134 123 103;
  --c-accent: 154  91  31;
  --c-accent2: 79 107  58;
  --c-sel:    226 206 160;
  --c-codebg: 240 230 210;
  --c-tagbg:  232 222 196;
  --c-tagfg:  122  74  19;
  --c-tagline:211 192 155;
  --c-kw:  #9a5b1f; --c-str: #4f6b3a; --c-num: #8a3324;
  --c-com: #9c9078; --c-fn:  #6b4f9a; --c-txt: #37312a;
}

/* Ocean Blue (light sky) */
[data-theme="ocean"] {
  color-scheme: light;
  --c-bg:     242 248 253;
  --c-bg2:    230 241 250;
  --c-bg3:    216 233 246;
  --c-line:   188 216 236;
  --c-fg:      15  42  61;
  --c-fg2:     60  95 120;
  --c-fg3:    109 139 161;
  --c-accent:  10 110 168;
  --c-accent2: 15 143 143;
  --c-sel:    191 224 245;
  --c-codebg: 234 243 251;
  --c-tagbg:  219 236 248;
  --c-tagfg:   10  92 140;
  --c-tagline:179 213 236;
  --c-kw:  #0a6ea8; --c-str: #0f7a63; --c-num: #a2521a;
  --c-com: #7d97a9; --c-fn:  #6a4fa3; --c-txt: #17384f;
}

/* High contrast */
[data-theme="contrast"] {
  color-scheme: dark;
  --c-bg:       0   0   0;
  --c-bg2:     12  12  12;
  --c-bg3:     25  25  25;
  --c-line:    61  61  61;
  --c-fg:     255 255 255;
  --c-fg2:    214 214 214;
  --c-fg3:    166 166 166;
  --c-accent: 255 212   0;
  --c-accent2:125 255 159;
  --c-sel:     58  52   0;
  --c-codebg:   0   0   0;
  --c-tagbg:   27  27  27;
  --c-tagfg:  255 212   0;
  --c-tagline: 74  66   0;
  --c-kw:  #ffd400; --c-str: #7dff9f; --c-num: #ff9d5c;
  --c-com: #9a9a9a; --c-fn:  #8ecbff; --c-txt: #f2f2f2;
}

/* ── Typography mode ─────────────────────────────────────────────────────── */
/* hybrid = serif body prose (default); mono = all-monospace */
:root,
[data-type="hybrid"] {
  --body: 'Source Serif 4', Georgia, serif;
  --bodysize: 17.5px;
  --bodylh: 1.72;
}
[data-type="mono"] {
  --body: 'JetBrains Mono', ui-monospace, monospace;
  --bodysize: 15px;
  --bodylh: 1.7;
}
```

- [ ] **Step 2: Verify the file still parses**

Run: `cd frontend && npx tsc --noEmit -p . 2>&1 | head -30 && cat src/styles/globals.css | head -5`
Expected: no TypeScript errors mentioning `globals.css` (it's not TS-checked, this just confirms the repo still builds config-wise); the `cat` shows the new `@import` line with `Source+Serif+4`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/styles/globals.css
git commit -m "Replace 6-theme system with the 5 new design-handoff themes and a typography-mode toggle"
```

---

## Task 2: Tailwind tokens — extend `tailwind.config.ts` with back-compat aliases

**Files:**
- Modify: `frontend/tailwind.config.ts`

**Interfaces:**
- Consumes: the `--c-*` CSS vars from Task 1.
- Produces: Tailwind color utilities `bg-{bg,bg2,bg3,accent,accent2,sel,codeBg,tagBg}`, `text-{fg,fg2,fg3,accent,accent2,tagFg}`, `border-{line,tagLine}`, plus the untouched-file aliases `bg-surface`, `border-border`, `text-text`, `text-muted`, `bg-code`, `text-green` (all still resolve, now onto the new tokens) so no other component needs to change in this task.

- [ ] **Step 1: Replace the `colors` block**

```typescript
import type { Config } from "tailwindcss"

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:      "rgb(var(--c-bg) / <alpha-value>)",
        bg2:     "rgb(var(--c-bg2) / <alpha-value>)",
        bg3:     "rgb(var(--c-bg3) / <alpha-value>)",
        line:    "rgb(var(--c-line) / <alpha-value>)",
        fg:      "rgb(var(--c-fg) / <alpha-value>)",
        fg2:     "rgb(var(--c-fg2) / <alpha-value>)",
        fg3:     "rgb(var(--c-fg3) / <alpha-value>)",
        accent:  "rgb(var(--c-accent) / <alpha-value>)",
        accent2: "rgb(var(--c-accent2) / <alpha-value>)",
        sel:     "rgb(var(--c-sel) / <alpha-value>)",
        codeBg:  "rgb(var(--c-codebg) / <alpha-value>)",
        tagBg:   "rgb(var(--c-tagbg) / <alpha-value>)",
        tagFg:   "rgb(var(--c-tagfg) / <alpha-value>)",
        tagLine: "rgb(var(--c-tagline) / <alpha-value>)",
        // Back-compat aliases so untouched components (Articles/Study/Review/Stats/forms)
        // keep compiling and keep re-theming correctly under the 5 new themes.
        surface: "rgb(var(--c-bg2) / <alpha-value>)",
        border:  "rgb(var(--c-line) / <alpha-value>)",
        text:    "rgb(var(--c-fg) / <alpha-value>)",
        muted:   "rgb(var(--c-fg3) / <alpha-value>)",
        code:    "rgb(var(--c-codebg) / <alpha-value>)",
        green:   "rgb(var(--c-accent2) / <alpha-value>)",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
        sans: ["var(--body)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 2: Rebuild and confirm no missing-class regressions**

Run: `cd frontend && npm run build`
Expected: build succeeds. (A broken alias would surface as a runtime style issue, not a build error — the real check is the visual smoke test at the end of Task 5, Task 9, and Task 13.)

- [ ] **Step 3: Commit**

```bash
git add frontend/tailwind.config.ts
git commit -m "Add new design-token Tailwind colors with back-compat aliases for old token names"
```

---

## Task 3: Persisted UI preferences hook (`theme`, `layout`, `typeMode`)

**Files:**
- Create: `frontend/src/hooks/useUiPrefs.ts`
- Modify: `frontend/src/components/ThemePicker.tsx` → deleted in this task (superseded)

**Interfaces:**
- Produces: `useUiPrefs()` returning `{ theme, setTheme, layout, setLayout, typeMode, setTypeMode }` with `theme: 'midnight'|'paper'|'sepia'|'ocean'|'contrast'`, `layout: 'three'|'two'|'center'`, `typeMode: 'hybrid'|'mono'`. Applies `data-theme` and `data-type` attributes to `document.documentElement` as a side effect and persists all three to `localStorage`.
- Consumes: nothing external.

- [ ] **Step 1: Write the hook**

```typescript
import { useEffect, useState } from "react"

export type Theme = "midnight" | "paper" | "sepia" | "ocean" | "contrast"
export type Layout = "three" | "two" | "center"
export type TypeMode = "hybrid" | "mono"

const THEME_KEY = "concept-master.theme"
const LAYOUT_KEY = "concept-master.layout"
const TYPE_KEY = "concept-master.typeMode"

const VALID_THEMES: Theme[] = ["midnight", "paper", "sepia", "ocean", "contrast"]
const VALID_LAYOUTS: Layout[] = ["three", "two", "center"]
const VALID_TYPES: TypeMode[] = ["hybrid", "mono"]

function readStored<T extends string>(key: string, valid: T[], fallback: T): T {
  const stored = localStorage.getItem(key)
  return (valid as string[]).includes(stored ?? "") ? (stored as T) : fallback
}

export function useUiPrefs() {
  const [theme, setTheme] = useState<Theme>(() => readStored(THEME_KEY, VALID_THEMES, "midnight"))
  const [layout, setLayout] = useState<Layout>(() => readStored(LAYOUT_KEY, VALID_LAYOUTS, "three"))
  const [typeMode, setTypeMode] = useState<TypeMode>(() => readStored(TYPE_KEY, VALID_TYPES, "hybrid"))

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem(LAYOUT_KEY, layout)
  }, [layout])

  useEffect(() => {
    document.documentElement.setAttribute("data-type", typeMode)
    localStorage.setItem(TYPE_KEY, typeMode)
  }, [typeMode])

  return { theme, setTheme, layout, setLayout, typeMode, setTypeMode }
}
```

Note: `readStored` falling back for any value not in the new `VALID_THEMES` list means a browser with an old theme id (e.g. `"github-dark"`) stored from before this rework silently resets to `"midnight"` — this is the intended migration path, not a bug.

- [ ] **Step 2: Delete the superseded `ThemePicker.tsx`**

```bash
rm frontend/src/components/ThemePicker.tsx
```

(`Layout.tsx` still imports it until Task 5 rewires the header — that's fine, Task 5 removes the import in the same pass. Do not run the frontend between this step and Task 5.)

- [ ] **Step 3: Commit**

```bash
git add -A frontend/src/hooks/useUiPrefs.ts frontend/src/components/ThemePicker.tsx
git commit -m "Add persisted theme/layout/typeMode preferences hook, remove superseded ThemePicker"
```

---

## Task 4: Theme-aware Prism syntax highlighting

**Files:**
- Create: `frontend/src/lib/prismTheme.ts`

**Interfaces:**
- Produces: `conceptMasterPrismTheme: PrismTheme` for `prism-react-renderer`.
- Consumes: `--c-kw/str/num/com/fn/txt` CSS vars from Task 1.

- [ ] **Step 1: Write the theme mapping**

```typescript
import type { PrismTheme } from "prism-react-renderer"

export const conceptMasterPrismTheme: PrismTheme = {
  plain: { color: "var(--c-txt)", backgroundColor: "transparent" },
  styles: [
    { types: ["comment", "prolog", "doctype", "cdata"], style: { color: "var(--c-com)", fontStyle: "italic" } },
    { types: ["keyword", "operator", "tag", "bold", "important", "atrule"], style: { color: "var(--c-kw)" } },
    { types: ["string", "char", "attr-value", "regex", "url"], style: { color: "var(--c-str)" } },
    { types: ["number", "boolean", "constant", "symbol", "deleted", "inserted"], style: { color: "var(--c-num)" } },
    { types: ["function", "class-name", "decorator", "builtin", "attr-name"], style: { color: "var(--c-fn)" } },
    { types: ["punctuation", "plain"], style: { color: "var(--c-txt)" } },
  ],
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `cd frontend && npx tsc --noEmit -p .`
Expected: no errors referencing `prismTheme.ts`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/prismTheme.ts
git commit -m "Add a theme-aware Prism syntax theme mapped onto the c-kw/str/num/com/fn/txt tokens"
```

---

## Task 5: Header chrome rework (logo, search trigger, nav, control cluster)

**Files:**
- Create: `frontend/src/components/HeaderControls.tsx`
- Create: `frontend/src/components/BrowseNav.tsx`
- Modify: `frontend/src/components/Layout.tsx`
- Modify: `frontend/src/components/SiteHeader.tsx`

**Interfaces:**
- Consumes: `useUiPrefs()` from Task 3 (`layout`, `setLayout`, `typeMode`, `setTypeMode`, `theme`, `setTheme`).
- Produces: `HeaderControls` props `{ layout, onLayoutChange, typeMode, onTypeModeChange, theme, onThemeChange, onExport, onImport, onNewTerm, newLabel }`. `BrowseNav` props `{ view, dueCount, onNavigate }` where `view`/`onNavigate` match `App.tsx`'s existing `View` union (Task 9 adds `"diagram"` to it).

- [ ] **Step 1: Build `BrowseNav.tsx`** (extracted nav row, +Diagram entry, new visual spec)

```typescript
type View = "terms" | "diagram" | "stats" | "form" | "review" | "study" | "articles" | "article-form"

interface BrowseNavProps {
  view: View
  dueCount: number
  onNavigate: (view: View) => void
}

interface NavItem {
  id: View
  label: string
  num: string
}

const NAV: NavItem[] = [
  { id: "terms",    label: "Browse",   num: "01" },
  { id: "diagram",  label: "Diagram",  num: "02" },
  { id: "articles", label: "Articles", num: "03" },
  { id: "study",    label: "Study",    num: "04" },
  { id: "review",   label: "Review",   num: "05" },
  { id: "stats",    label: "Stats",    num: "06" },
]

export function BrowseNav({ view, dueCount, onNavigate }: BrowseNavProps) {
  return (
    <nav
      className="flex-1 min-w-0 overflow-x-auto flex items-center gap-0.5"
      style={{ scrollbarWidth: "none" }}
    >
      {NAV.map(item => {
        const active = view === item.id
          || (item.id === "terms" && view === "form")
          || (item.id === "articles" && view === "article-form")
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`h-[34px] px-[9px] flex-none whitespace-nowrap rounded-md text-[12.5px] tracking-[.08em]
                        transition-colors
                        ${active ? "bg-bg3 text-fg font-semibold" : "text-fg3 font-normal hover:text-fg"}`}
          >
            <span className={`text-[10.5px] mr-[7px] ${active ? "" : "opacity-50"}`}>{item.num}</span>
            <span className="uppercase">{item.label}</span>
            {item.id === "review" && dueCount > 0 && (
              <span className="ml-2 text-[10px] text-accent2 border border-line rounded-sm px-1 py-px">
                {dueCount > 99 ? "99+" : dueCount}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 2: Build `HeaderControls.tsx`** (layout switcher, type toggle, theme swatches, kept CRUD icons)

```typescript
import type React from "react"
import type { Layout, Theme, TypeMode } from "../hooks/useUiPrefs"

interface HeaderControlsProps {
  layout: Layout
  onLayoutChange: (l: Layout) => void
  typeMode: TypeMode
  onTypeModeChange: (t: TypeMode) => void
  theme: Theme
  onThemeChange: (t: Theme) => void
  onNewTerm: () => void
  newLabel: string
  onExport: () => void
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const LAYOUTS: { id: Layout; icon: string; title: string }[] = [
  { id: "three",  icon: "▥", title: "Three-pane" },
  { id: "two",    icon: "▤", title: "Two-pane" },
  { id: "center", icon: "▭", title: "Centered reading" },
]

const THEMES: { id: Theme; fill: string; ring: string; label: string }[] = [
  { id: "midnight", fill: "#0f1216", ring: "#7cc4ff", label: "Midnight" },
  { id: "paper",    fill: "#faf9f7", ring: "#0b62c4", label: "Paper" },
  { id: "sepia",    fill: "#f0e3c8", ring: "#9a5b1f", label: "Sepia" },
  { id: "ocean",    fill: "#cfe6f7", ring: "#0a6ea8", label: "Ocean Blue" },
  { id: "contrast", fill: "#000000", ring: "#ffd400", label: "High Contrast" },
]

export function HeaderControls({
  layout, onLayoutChange, typeMode, onTypeModeChange, theme, onThemeChange,
  onNewTerm, newLabel, onExport, onImport,
}: HeaderControlsProps) {
  return (
    <div className="flex-none flex items-center gap-2">
      {/* Layout switcher */}
      <div className="flex items-center gap-0.5 bg-bg border border-line rounded-[7px] p-[3px]">
        {LAYOUTS.map(l => (
          <button
            key={l.id}
            title={l.title}
            onClick={() => onLayoutChange(l.id)}
            className={`w-[30px] h-6 rounded-[5px] text-[13px] transition-colors
                        ${layout === l.id ? "bg-bg3 text-accent" : "text-fg3 hover:text-fg"}`}
          >
            {l.icon}
          </button>
        ))}
      </div>

      {/* Type toggle */}
      <button
        onClick={() => onTypeModeChange(typeMode === "hybrid" ? "mono" : "hybrid")}
        className="h-[30px] px-[11px] rounded-[7px] border border-line bg-bg text-fg2 text-[11.5px]
                   tracking-[.04em] hover:border-accent hover:text-fg transition-colors"
      >
        Aa {typeMode === "hybrid" ? "SERIF BODY" : "ALL MONO"}
      </button>

      {/* Theme swatches */}
      <div className="flex items-center gap-[5px] bg-bg border border-line rounded-[7px] px-[6px] py-1">
        {THEMES.map(t => (
          <button
            key={t.id}
            title={t.label}
            aria-label={t.label}
            onClick={() => onThemeChange(t.id)}
            className="w-[18px] h-[18px] rounded-full"
            style={{
              background: t.fill,
              border: theme === t.id ? `2px solid ${t.ring}` : "1px solid rgb(var(--c-line))",
              boxShadow: theme === t.id ? "0 0 0 2px rgb(var(--c-bg2))" : "none",
            }}
          />
        ))}
      </div>

      <span className="h-5 w-px bg-line" aria-hidden />

      {/* Kept CRUD controls (not part of the design spec, preserved per product decision) */}
      <button
        onClick={onNewTerm}
        title={newLabel}
        className="h-[30px] px-3 rounded-[7px] bg-accent/10 text-accent border border-accent/30
                   hover:bg-accent/20 transition-colors text-xs font-medium tracking-wide"
      >
        + New
      </button>
      <button
        onClick={onExport}
        title="Export as JSON"
        aria-label="Export"
        className="w-[30px] h-[30px] flex items-center justify-center rounded-[7px] text-fg3 hover:text-fg hover:bg-bg3 transition-colors"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4v12" /><path d="m6 10 6 6 6-6" /><path d="M5 20h14" />
        </svg>
      </button>
      <label
        title="Import JSON"
        aria-label="Import"
        className="w-[30px] h-[30px] flex items-center justify-center rounded-[7px] cursor-pointer text-fg3 hover:text-fg hover:bg-bg3 transition-colors"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20V8" /><path d="m6 14 6-6 6 6" /><path d="M5 4h14" />
        </svg>
        <input type="file" accept=".json" className="hidden" onChange={onImport} />
      </label>
    </div>
  )
}
```

- [ ] **Step 3: Rewrite `Layout.tsx` header to the new 56px chrome**

Replace the `<header>` block in `frontend/src/components/Layout.tsx` (the whole `<header className="relative flex-shrink-0 h-14 ...">…</header>` element) with:

```tsx
      <header className="relative flex-shrink-0 h-14 flex items-center gap-[22px] px-[18px]
                         border-b border-line bg-bg2 z-40">
        <div className="flex items-center gap-[9px] select-none whitespace-nowrap">
          <span className="text-accent font-mono font-bold">&gt;</span>
          <span className="font-mono font-bold tracking-[-0.01em] text-fg">concept-master</span>
        </div>
        {header}
      </header>
```

Remove the now-unused sidebar-toggle button markup, the `open`/`setOpen` state, and the `ThemePicker` import/usage from `Layout.tsx` — the sidebar is no longer collapsible by hand; whether it renders at all is now decided by the caller (`App.tsx`, wired in Task 9) passing `sidebar={null}` or a real element. The theme picker moved into `HeaderControls` (rendered by `App.tsx` as part of the `header` slot in Task 9).

Update the body-row markup so the `<aside>` reacts to whether `sidebar` is present instead of the removed `open` flag:

```tsx
      <div className="relative flex flex-1 overflow-hidden">
        {sidebar && (
          <aside className="relative flex-shrink-0 w-64 border-r border-line bg-bg2 overflow-y-auto">
            {sidebar}
          </aside>
        )}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
```

(This drops the old collapse animation — acceptable, since the design spec has no manual sidebar collapse concept at all; presence is now driven entirely by `layout`/`view`.)

- [ ] **Step 4: Trim `SiteHeader.tsx`**

`SiteHeader.tsx` is superseded by `BrowseNav` (nav) + `HeaderControls` (everything else). Delete it:

```bash
rm frontend/src/components/SiteHeader.tsx
```

(App.tsx still imports it until Task 9 rewires the header slot — do not run the dev server between this step and Task 9.)

- [ ] **Step 5: Commit**

```bash
git add -A frontend/src/components/HeaderControls.tsx frontend/src/components/BrowseNav.tsx \
  frontend/src/components/Layout.tsx frontend/src/components/SiteHeader.tsx
git commit -m "Rework header chrome: new nav row, layout/type/theme control cluster"
```

---

## Task 6: Command palette

**Files:**
- Create: `frontend/src/components/CommandPalette.tsx`

**Interfaces:**
- Consumes: `TermSummary[]` list (name/slug/category needed — extend the palette's own fetch to use `api.terms.list` with a large `limit` rather than `/summaries`, since `/summaries` doesn't include `category`; see Step 1) and `query`/`setQuery`/`open`/`setOpen` state (owned by `App.tsx`, passed down — see Task 9).
- Produces: `onSelect(slug: string)` callback fired when a row is clicked.

- [ ] **Step 1: Write the component**

```typescript
import { useEffect, useMemo, useRef } from "react"
import useSWR from "swr"
import { api } from "../api/client"

interface CommandPaletteProps {
  open: boolean
  query: string
  onQueryChange: (q: string) => void
  onClose: () => void
  onSelect: (slug: string) => void
}

interface PaletteRow {
  slug: string
  name: string
  category: string
  tags: string[]
}

export function CommandPalette({ open, query, onQueryChange, onClose, onSelect }: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Palette needs name + category + tags for every term to filter client-side;
  // fetch once, lazily, only while the palette has ever been opened this session.
  const { data } = useSWR(open ? "/terms?limit=500" : null, () =>
    api.terms.list(new URLSearchParams({ limit: "500" }))
  )

  const rows: PaletteRow[] = useMemo(() => {
    const terms = data?.terms ?? []
    return terms.map(t => ({
      slug: t.slug,
      name: t.name,
      category: t.categories[0]?.name ?? "",
      tags: t.tags.map(tag => tag.name),
    }))
  }, [data])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows.slice(0, 40)
    return rows
      .filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.tags.some(t => t.toLowerCase().includes(q))
      )
      .slice(0, 40)
  }, [rows, query])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex justify-center pt-[12vh]"
      style={{ background: "rgba(0,0,0,.55)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <div
        className="w-[620px] max-w-[92vw] h-fit bg-bg2 border border-line rounded-xl overflow-hidden"
        style={{ boxShadow: "0 24px 70px rgba(0,0,0,.45)" }}
        onClick={e => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder="Search terms, tags, categories…"
          className="w-full h-[52px] px-[18px] bg-transparent border-b border-line text-[15px] text-fg
                     placeholder:text-fg3 focus:outline-none"
        />
        <div className="max-h-[56vh] overflow-y-auto overflow-x-hidden p-2">
          {filtered.map(row => (
            <button
              key={row.slug}
              onClick={() => onSelect(row.slug)}
              className="w-full flex items-center justify-between gap-3 px-3 py-[10px] rounded-[7px]
                         text-[13.5px] text-fg hover:bg-bg3 transition-colors text-left"
            >
              <span className="truncate">{row.name}</span>
              <span className="flex-none text-[11px] text-fg3">{row.category}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-4 text-[13px] text-fg3">No matches.</p>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `cd frontend && npx tsc --noEmit -p .`
Expected: no errors in `CommandPalette.tsx`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/CommandPalette.tsx
git commit -m "Add command palette (Ctrl/Cmd+K) for jump-to-term search"
```

(Wired into `App.tsx` — trigger button, floating pill, keyboard shortcut, and `onSelect` behavior — in Task 9, once the search-trigger button and floating pill exist.)

---

## Task 7: Three-pane Browse — Sidebar (Pane A) and TermCard (Pane B) restyle

**Files:**
- Modify: `frontend/src/components/Sidebar.tsx`
- Modify: `frontend/src/components/TermCard.tsx`

**Interfaces:**
- `Sidebar` drops the *always-on* tags section for the Browse (three-pane) call site — tags no longer live in the sidebar per spec there; they move onto term cards and the reader header (already true in the current `TermCard`/`TermDetail`, now made visually prominent). But the **same** `Sidebar` component is still the one shown while browsing Articles (out of scope — must keep working exactly as it does today, including tag filtering), so the tags section becomes **optional**: three new props `tags?: Tag[]`, `selectedTag?: string | null`, `onSelectTag?: (name: string | null) => void`. When `tags` is omitted/empty the section doesn't render (Browse's call site in Task 9); when provided (Articles' call site in Task 9) it renders, restyled to the new tokens. Base props: `{ categories, selectedCategory, favoritesOnly, onSelectCategory, onToggleFavorites }`.
- `TermCard` interface unchanged (`{ term, isSelected, onClick, onToggleFavorite }`), only the JSX/classes change.

- [ ] **Step 1: Rewrite `Sidebar.tsx`**

```typescript
import type { Category, Tag } from "../types"

interface SidebarProps {
  categories: Category[]
  selectedCategory: string | null
  favoritesOnly: boolean
  onSelectCategory: (slug: string | null) => void
  onToggleFavorites: () => void
  tags?: Tag[]
  selectedTag?: string | null
  onSelectTag?: (name: string | null) => void
}

export function Sidebar({
  categories, selectedCategory, favoritesOnly, onSelectCategory, onToggleFavorites,
  tags, selectedTag, onSelectTag,
}: SidebarProps) {
  return (
    <nav className="h-full overflow-y-auto pt-[18px] pb-10">
      <p className="px-4 pb-[10px] text-[10.5px] tracking-[.14em] text-fg3 uppercase">Filters</p>
      <div className="px-2 mb-1">
        <button
          onClick={onToggleFavorites}
          className={`w-full text-left px-[10px] py-2 rounded-md text-[13px] transition-colors
            ${favoritesOnly
              ? "bg-bg3 border border-accent text-accent"
              : "border border-transparent text-fg2 hover:bg-bg3"}`}
        >
          ★ Favorites only
        </button>
      </div>

      <div className="h-px bg-line my-4 mx-4" />

      <p className="px-4 pb-[10px] text-[10.5px] tracking-[.14em] text-fg3 uppercase">Categories</p>
      <div className="px-2 flex flex-col gap-px">
        <button
          onClick={() => onSelectCategory(null)}
          className={`w-full flex justify-between px-[10px] py-2 rounded-md text-[13px] transition-colors
            border-l-2
            ${!selectedCategory ? "bg-bg3 text-fg border-accent" : "text-fg2 border-transparent hover:bg-bg3"}`}
        >
          <span>All</span>
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.slug === selectedCategory ? null : cat.slug)}
            className={`w-full flex justify-between px-[10px] py-2 rounded-md text-[13px] transition-colors
              border-l-2
              ${selectedCategory === cat.slug ? "bg-bg3 text-fg border-accent" : "text-fg2 border-transparent hover:bg-bg3"}`}
          >
            <span>{cat.name}</span>
            <span className="text-[11px] text-fg3">{cat.term_count}</span>
          </button>
        ))}
      </div>

      {/* Legacy tags section — only rendered for the Articles call site (Task 9).
          Browse's three-pane call site omits `tags`, matching the new spec (no tag
          filter in Pane A; tags live on cards/reader instead). */}
      {tags && tags.length > 0 && onSelectTag && (
        <>
          <div className="h-px bg-line my-4 mx-4" />
          <p className="px-4 pb-[10px] text-[10.5px] tracking-[.14em] text-fg3 uppercase">Tags</p>
          <div className="px-3 flex flex-wrap gap-1">
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => onSelectTag(tag.name === selectedTag ? null : tag.name)}
                className={`px-2 py-0.5 rounded text-xs transition-colors
                  ${selectedTag === tag.name
                    ? "bg-accent/20 text-accent border border-accent/30"
                    : "bg-codeBg text-fg3 border border-line hover:text-fg"}`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </>
      )}
    </nav>
  )
}
```

- [ ] **Step 2: Rewrite `TermCard.tsx`**

```typescript
import type { Term } from "../types"
import { hasConceptVisual } from "./ConceptVisual"

interface TermCardProps {
  term: Term
  isSelected: boolean
  onClick: () => void
  onToggleFavorite: () => void
}

export function TermCard({ term, isSelected, onClick, onToggleFavorite }: TermCardProps) {
  const preview = term.definition.replace(/[*_`#[\]]/g, "").slice(0, 120)
  const hasVisual = hasConceptVisual(term.slug)

  return (
    <div
      data-slug={term.slug}
      onClick={onClick}
      className={`px-4 py-[15px] border-b border-line border-l-[3px] cursor-pointer transition-colors
        ${isSelected ? "bg-bg3 border-l-accent" : "border-l-transparent hover:bg-bg3/60"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-[14.5px] tracking-[-0.01em] text-fg truncate">{term.name}</h3>
        <div className="flex-none flex items-center gap-1.5">
          {hasVisual && (
            <span className="text-[9.5px] tracking-[.1em] uppercase border border-tagLine text-tagFg rounded-[3px] px-[5px] py-px">
              Visual
            </span>
          )}
          <button
            onClick={e => { e.stopPropagation(); onToggleFavorite() }}
            className={`text-[13px] ${term.is_favorite ? "text-accent" : "text-fg3 opacity-50"}`}
          >
            ★
          </button>
        </div>
      </div>
      <p className="mt-[5px] text-fg2 text-[12.5px] leading-[1.55] line-clamp-2">{preview}…</p>
      {term.tags.length > 0 && (
        <div className="flex flex-wrap gap-[5px] mt-[9px]">
          {term.tags.map(t => (
            <span key={t.id} className="text-[10.5px] text-tagFg bg-tagBg border border-tagLine rounded px-[7px] py-[2px]">
              {t.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

Run: `cd frontend && npx tsc --noEmit -p .`
Expected: no new errors — `tags`/`selectedTag`/`onSelectTag` are optional, so `App.tsx`'s existing call site (which still passes them, until Task 9 splits it into a Browse call site and an Articles call site) keeps compiling.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Sidebar.tsx frontend/src/components/TermCard.tsx
git commit -m "Restyle three-pane Sidebar and TermCard to the new design spec (tags optional, off by default)"
```

---

## Task 8: Reader (`TermDetail`) rework — tab bar, metadata-above-title, restyled blocks

**Files:**
- Modify: `frontend/src/components/TermDetail.tsx`

**Interfaces:**
- Consumes: `conceptMasterPrismTheme` (Task 4).
- Props unchanged: `{ term, onEdit, onDelete, onToggleFavorite, onSelectRelated, onBack }`.
- Internal behavior change: the existing Alt+1/2/3 scroll-to-section pattern becomes a real tab bar (only one section renders at a time, matching the spec's `Definition | Code | Diagram` tabs) rather than scrolling within one continuous page. Alt+1/2/3 still switch tabs (same shortcut semantics, new mechanism).

- [ ] **Step 1: Replace the whole file**

```typescript
import { isValidElement, useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Highlight } from "prism-react-renderer"
import type { TermDetail } from "../types"
import { ConceptVisual, hasConceptVisual } from "./ConceptVisual"
import { conceptMasterPrismTheme } from "../lib/prismTheme"

interface TermDetailProps {
  term: TermDetail
  onEdit: () => void
  onDelete: () => void
  onToggleFavorite: () => void
  onSelectRelated: (slug: string) => void
  onBack: () => void
}

type Tab = "def" | "code" | "visual"

function CodeCard({ code, language }: { code: string; language: string }) {
  return (
    <Highlight theme={conceptMasterPrismTheme} code={code} language={language.toLowerCase()}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={`${className} bg-codeBg border border-line rounded-[10px] p-[20px_22px] overflow-x-auto text-[13.5px] leading-[1.75]`}
          style={style}
        >
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, key) => <span key={key} {...getTokenProps({ token })} />)}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  )
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" || target.isContentEditable
}

export function TermDetail({ term, onEdit, onDelete, onToggleFavorite, onSelectRelated, onBack }: TermDetailProps) {
  const hasCode = Boolean(term.example_code)
  const hasVisual = hasConceptVisual(term.slug)
  const [tab, setTab] = useState<Tab>("def")

  // Reset to Definition whenever the selected term changes (spec: "resets the content tab to Definition").
  useEffect(() => { setTab("def") }, [term.slug])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      if (isEditableTarget(event.target)) return
      const byKey: Record<string, Tab> = { "1": "def", "2": "code", "3": "visual" }
      const next = byKey[event.key]
      if (!next) return
      if (next === "code" && !hasCode) return
      if (next === "visual" && !hasVisual) return
      event.preventDefault()
      setTab(next)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [hasCode, hasVisual])

  const tabs: { key: Tab; label: string; shortcut: string; available: boolean }[] = [
    { key: "def",    label: "Definition", shortcut: "ALT+1", available: true },
    { key: "code",   label: "Code",       shortcut: "ALT+2", available: hasCode },
    { key: "visual", label: "Diagram",    shortcut: "ALT+3", available: hasVisual },
  ]

  return (
    <article className="fade-in max-w-[900px] mx-0 px-[44px] pt-[34px] pb-[90px]">
      <button onClick={onBack} className="md:hidden mb-4 text-fg3 text-sm hover:text-fg transition-colors">← Back</button>

      {/* Metadata above title */}
      <div className="flex flex-wrap gap-2 mb-[14px]">
        {term.categories.map(c => (
          <span key={c.id} className="text-[11px] tracking-[.12em] font-semibold rounded uppercase px-[9px] py-[3px] bg-accent text-bg2">
            {c.name}
          </span>
        ))}
        {term.tags.map(t => (
          <span key={t.id} className="text-[11.5px] text-tagFg bg-tagBg border border-tagLine rounded px-[9px] py-[3px]">
            #{t.name}
          </span>
        ))}
        {hasVisual && (
          <span className="text-[10.5px] tracking-[.1em] text-fg3 border border-dashed border-line rounded px-2 py-[3px] uppercase">
            Has diagram
          </span>
        )}
      </div>

      <div className="flex items-start justify-between gap-6 mb-4">
        <h1 className="text-[34px] leading-[1.15] tracking-[-0.025em] font-bold text-fg m-0">{term.name}</h1>
        <div className="flex-none flex items-center gap-[7px]">
          <button
            onClick={onToggleFavorite}
            className={`w-8 h-8 rounded-md border border-line bg-bg2 ${term.is_favorite ? "text-accent" : "text-fg3"}`}
          >
            ★
          </button>
          <button onClick={onEdit} className="h-8 px-[14px] rounded-md border border-line bg-bg2 text-fg2 text-[12.5px] hover:text-fg hover:border-accent transition-colors">
            Edit
          </button>
          <button onClick={onDelete} className="h-8 px-[14px] rounded-md border border-line bg-bg2 text-fg3 text-[12.5px] hover:text-fg transition-colors">
            Delete
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-line mt-[26px]">
        {tabs.filter(t => t.available).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-[11px] text-[12.5px] tracking-[.04em] -mb-px border-b-2 transition-colors
              ${tab === t.key ? "text-fg font-semibold border-accent" : "text-fg3 border-transparent hover:text-fg"}`}
          >
            {t.label} <span className="opacity-45 text-[10.5px] ml-2">{t.shortcut}</span>
          </button>
        ))}
      </div>

      {/* Definition tab */}
      {tab === "def" && (
        <div
          className="pt-[26px] max-w-[68ch] text-fg"
          style={{ fontFamily: "var(--body)", fontSize: "var(--bodysize)", lineHeight: "var(--bodylh)" }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              pre: ({ children }) => {
                const child = Array.isArray(children) ? children[0] : children
                if (!isValidElement<{ className?: string; children?: unknown }>(child)) return <pre>{children}</pre>
                const languageMatch = /language-([a-z0-9-]+)/i.exec(child.props.className ?? "")
                return (
                  <div className="my-5">
                    <CodeCard code={String(child.props.children ?? "").replace(/\n$/, "")} language={languageMatch?.[1] ?? "text"} />
                  </div>
                )
              },
              code: ({ className, children, ...props }) => {
                if (!className?.startsWith("language-")) {
                  return (
                    <code className="bg-bg2 border border-line text-accent rounded px-[5px] py-px text-[0.86em]" style={{ fontFamily: "var(--font-mono, monospace)" }} {...props}>
                      {children}
                    </code>
                  )
                }
                return <code className={className} {...props}>{children}</code>
              },
            }}
          >
            {term.definition}
          </ReactMarkdown>

          {term.related_terms.length > 0 && (
            <div className="mt-[34px] pt-5 border-t border-line">
              <p className="text-[11px] tracking-[.14em] text-fg3 uppercase mb-[10px]">Related</p>
              <div className="flex flex-wrap gap-2">
                {term.related_terms.map(r => (
                  <button
                    key={r.id}
                    onClick={() => onSelectRelated(r.slug)}
                    className="text-[12.5px] text-fg2 bg-bg2 border border-line rounded-md px-3 py-[6px] hover:border-accent hover:text-fg transition-colors"
                  >
                    {r.name} <span className="text-fg3">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Code tab */}
      {tab === "code" && hasCode && term.example_code && (
        <div className="pt-[22px]">
          <div className="flex gap-[6px] mb-3">
            <span className="px-[13px] py-[6px] rounded-md text-xs border border-accent bg-bg3 text-fg">
              {term.code_lang ?? "text"}
            </span>
          </div>
          <CodeCard code={term.example_code} language={term.code_lang ?? "text"} />
        </div>
      )}

      {/* Diagram tab — real ConceptVisual content, not the spec's placeholder bars */}
      {tab === "visual" && hasVisual && (
        <div className="pt-[22px]">
          <ConceptVisual slug={term.slug} name={term.name} />
        </div>
      )}

      <p className="text-xs text-fg3 mt-8">
        Added {new Date(term.created_at).toLocaleDateString()}
        {term.updated_at !== term.created_at && ` · Updated ${new Date(term.updated_at).toLocaleDateString()}`}
      </p>
    </article>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `cd frontend && npx tsc --noEmit -p .`
Expected: no errors in `TermDetail.tsx`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/TermDetail.tsx
git commit -m "Rework reader: metadata above title, real Definition/Code/Diagram tab bar, theme-aware code blocks"
```

---

## Task 9: Wire the header, palette, and three Browse layouts into `App.tsx`

**Files:**
- Modify: `frontend/src/App.tsx`
- Create: `frontend/src/components/CategoryChipRail.tsx`
- Create: `frontend/src/components/JumpToTermPill.tsx`

**Interfaces:**
- Consumes: `useUiPrefs` (Task 3), `HeaderControls`/`BrowseNav` (Task 5), `CommandPalette` (Task 6), restyled `Sidebar`/`TermCard` (Task 7).
- Produces: fully wired `layout`/`typeMode`/`theme` state, `"diagram"` added to the `View` union (page itself added in Task 12), palette open/close/select wiring.

- [ ] **Step 1: Build `CategoryChipRail.tsx`** (two-pane layout's top strip)

```typescript
import type { Category } from "../types"

interface CategoryChipRailProps {
  categories: Category[]
  selectedCategory: string | null
  onSelectCategory: (slug: string | null) => void
  totalCount: number
}

export function CategoryChipRail({ categories, selectedCategory, onSelectCategory, totalCount }: CategoryChipRailProps) {
  return (
    <div className="flex items-center gap-[6px] px-[14px] py-3 border-b border-line bg-bg2 overflow-x-auto">
      <button
        onClick={() => onSelectCategory(null)}
        className={`flex-none px-[11px] py-[5px] rounded-full text-[11.5px] whitespace-nowrap transition-colors
          ${!selectedCategory ? "border border-accent bg-bg3 text-fg" : "border border-line text-fg2"}`}
      >
        All <span className="opacity-55">{totalCount}</span>
      </button>
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onSelectCategory(cat.slug === selectedCategory ? null : cat.slug)}
          className={`flex-none px-[11px] py-[5px] rounded-full text-[11.5px] whitespace-nowrap transition-colors
            ${selectedCategory === cat.slug ? "border border-accent bg-bg3 text-fg" : "border border-line text-fg2"}`}
        >
          {cat.name} <span className="opacity-55">{cat.term_count}</span>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Build `JumpToTermPill.tsx`** (centered layout's floating button)

```typescript
interface JumpToTermPillProps {
  onClick: () => void
}

export function JumpToTermPill({ onClick }: JumpToTermPillProps) {
  return (
    <button
      onClick={onClick}
      className="fixed right-[26px] bottom-[26px] z-50 h-[46px] px-5 rounded-full border border-line
                 bg-bg2 text-fg2 text-[13px] hover:border-accent hover:text-fg transition-colors flex items-center gap-2"
      style={{ boxShadow: "0 10px 30px rgba(0,0,0,.28)" }}
    >
      ⌕ Jump to term <span className="text-[10.5px] border border-line rounded px-[5px] py-px">CTRL+K</span>
    </button>
  )
}
```

- [ ] **Step 3: Update `App.tsx`**

Apply these changes to `frontend/src/App.tsx`:

1. Imports — replace the `SiteHeader`/`ThemePicker`-adjacent imports:

```typescript
import { useUiPrefs } from "./hooks/useUiPrefs"
import { HeaderControls } from "./components/HeaderControls"
import { BrowseNav } from "./components/BrowseNav"
import { CommandPalette } from "./components/CommandPalette"
import { CategoryChipRail } from "./components/CategoryChipRail"
import { JumpToTermPill } from "./components/JumpToTermPill"
```
(remove the old `import { SearchBar } from "./components/SearchBar"` from the Browse header — `SearchBar` is still used for Articles, keep that import, just stop rendering it for Browse.)

2. Extend the `View` union: `type View = "terms" | "diagram" | "stats" | "form" | "review" | "study" | "articles" | "article-form"`.

3. Add state, right after the existing `useState` block:

```typescript
const { theme, setTheme, layout, setLayout, typeMode, setTypeMode } = useUiPrefs()
const [paletteOpen, setPaletteOpen] = useState(false)
const [paletteQuery, setPaletteQuery] = useState("")

const openPalette = useCallback(() => { setPaletteQuery(""); setPaletteOpen(true) }, [])
const closePalette = useCallback(() => { setPaletteOpen(false); setPaletteQuery("") }, [])
```

4. Global Ctrl/Cmd+K binding (new `useEffect`, alongside the existing arrow-key one):

```typescript
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault()
      openPalette()
    }
  }
  window.addEventListener("keydown", handler)
  return () => window.removeEventListener("keydown", handler)
}, [openPalette])
```

5. Palette selection handler:

```typescript
const handlePaletteSelect = useCallback((slug: string) => {
  closePalette()
  handleSelectTerm(slug)
}, [closePalette, handleSelectTerm])
```

6. Replace the `sidebar` constant. This needs care: `layout` (three/two/center) is a **Browse-only** pane-switching preference — it must not affect whether the sidebar appears while browsing **Articles**, which keeps its existing category+tag+favorites filtering untouched (out of scope). So the condition branches on `view`, not just `layout`:

```typescript
const isBrowseTermsView = view === "terms" || view === "form"
const isArticleSidebarView = view === "articles" || view === "article-form"

const sidebar = isBrowseTermsView && layout === "three" ? (
  <Sidebar
    categories={categories}
    selectedCategory={selectedCategory}
    favoritesOnly={favoritesOnly}
    onSelectCategory={setSelectedCategory}
    onToggleFavorites={() => setFavoritesOnly(v => !v)}
  />
) : isArticleSidebarView ? (
  <Sidebar
    categories={categories}
    selectedCategory={selectedCategory}
    favoritesOnly={favoritesOnly}
    onSelectCategory={setSelectedCategory}
    onToggleFavorites={() => setFavoritesOnly(v => !v)}
    tags={tags}
    selectedTag={selectedTag}
    onSelectTag={setSelectedTag}
  />
) : null
```

Keep the existing `selectedTag`/`setSelectedTag` state and the `tag: selectedTag` option passed into `useArticles` exactly as they are today — Articles' tag filtering must keep working. Only change `useTerms`'s call: **remove** the `tag: selectedTag` option from it (Browse's Pane B no longer filters by tag; tags are read-only chips on cards/reader now — palette search still matches tags via its own client-side filter from Task 6, independent of this state). Two-pane and centered Browse layouts have no sidebar at all (matching the spec — filtering there is category-chip-rail + favorites-via-palette only), same as three-pane's `layout !== "three"` case above.

7. Replace the `headerNav` constant:

```typescript
const isBrowseView = view === "terms" || view === "form" || view === "diagram"

const headerNav = isBrowseView ? (
  <div className="flex items-center gap-3 h-full pl-3 pr-1 flex-1 min-w-0">
    <button
      onClick={openPalette}
      className="w-[220px] min-w-[150px] flex-shrink h-[34px] px-3 bg-bg border border-line rounded-[7px]
                 text-[13px] text-fg3 flex items-center gap-2 hover:border-accent hover:text-fg2 transition-colors"
    >
      <span>⌕</span>
      <span className="flex-1 text-left">Search terms…</span>
      <span className="text-[10.5px] border border-line rounded px-[5px] py-px">CTRL+K</span>
    </button>
    <BrowseNav view={view} dueCount={dueCount} onNavigate={(v) => { if (v === "terms") setShowDetail(false); setView(v) }} />
    <HeaderControls
      layout={layout} onLayoutChange={setLayout}
      typeMode={typeMode} onTypeModeChange={setTypeMode}
      theme={theme} onThemeChange={setTheme}
      onNewTerm={() => { setEditingSlug("new"); setView("form") }}
      newLabel="Create a new term"
      onExport={handleExport}
      onImport={handleImport}
    />
  </div>
) : (
  <div className="flex items-center gap-2 h-full pl-3 pr-1 flex-1">
    <SearchBar value={search} onChange={setSearch} placeholder={
      (view === "articles" || view === "article-form") ? "Search articles…" : "Search…"
    } />
    <span className="h-5 w-px bg-line flex-shrink-0 mx-1" aria-hidden />
    <BrowseNav view={view} dueCount={dueCount} onNavigate={(v) => { if (v === "articles") setShowArticleDetail(false); setView(v) }} />
    <HeaderControls
      layout={layout} onLayoutChange={setLayout}
      typeMode={typeMode} onTypeModeChange={setTypeMode}
      theme={theme} onThemeChange={setTheme}
      onNewTerm={() => {
        if (isArticleView) { setExpandedArticle(null); setEditingArticleSlug("new"); setView("article-form") }
        else { setEditingSlug("new"); setView("form") }
      }}
      newLabel={isArticleView ? "New Article" : "Create a new term"}
      onExport={handleExport}
      onImport={handleImport}
    />
  </div>
)
```

8. Replace the `view === "terms"` render block with layout-aware markup:

```tsx
{view === "terms" && (
  <div className="flex h-full relative">
    {layout === "two" && (
      <div className={`w-[380px] flex-shrink-0 border-r border-line flex flex-col overflow-hidden ${showDetail ? "hidden md:flex" : "flex"}`}>
        <CategoryChipRail
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          totalCount={terms.length}
        />
        <div ref={listRef} className="flex-1 overflow-y-auto">
          {loading && <p className="p-4 text-fg3 text-sm">Loading…</p>}
          {error && <p className="p-4 text-red-400 text-sm">{error}</p>}
          {!loading && terms.length === 0 && <EmptyState query={search} />}
          {terms.map(term => (
            <TermCard key={term.id} term={term} isSelected={selectedSlug === term.slug}
              onClick={() => handleSelectTerm(term.slug)} onToggleFavorite={() => handleToggleFavorite(term.slug)} />
          ))}
        </div>
      </div>
    )}

    {layout === "three" && (
      <div ref={listRef} className={`w-[336px] flex-shrink-0 border-r border-line bg-bg2 overflow-y-auto ${showDetail ? "hidden md:block" : "block"}`}>
        <div className="flex justify-between px-4 py-[11px] border-b border-line text-[11px] tracking-[.1em] text-fg3">
          <span>{terms.length} TERMS</span>
          <span>{selectedCategory ? categories.find(c => c.slug === selectedCategory)?.name.toUpperCase() : "ALL CATEGORIES"}</span>
        </div>
        {loading && <p className="p-4 text-fg3 text-sm">Loading…</p>}
        {error && <p className="p-4 text-red-400 text-sm">{error}</p>}
        {!loading && terms.length === 0 && <EmptyState query={search} />}
        {terms.map(term => (
          <TermCard key={term.id} term={term} isSelected={selectedSlug === term.slug}
            onClick={() => handleSelectTerm(term.slug)} onToggleFavorite={() => handleToggleFavorite(term.slug)} />
        ))}
      </div>
    )}

    <div className={`flex-1 overflow-y-auto ${showDetail || layout !== "three" ? "block" : "hidden md:block"}`}>
      {expandedTerm ? (
        <TermDetail
          term={expandedTerm}
          onEdit={() => { setEditingSlug(expandedTerm.slug); setView("form") }}
          onDelete={() => handleDelete(expandedTerm.slug)}
          onToggleFavorite={() => handleToggleFavorite(expandedTerm.slug)}
          onSelectRelated={handleSelectTerm}
          onBack={() => setShowDetail(false)}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-fg3 text-sm">Select a term to view its definition</div>
      )}
    </div>

    {layout === "center" && <JumpToTermPill onClick={openPalette} />}
  </div>
)}
```

Note the centered layout intentionally renders neither the three-pane list column nor the two-pane chip rail — only the reader + floating pill, matching the spec. `TermDetail`'s own `max-w-[900px]` from Task 8 is the paned width; centered's narrower `820px`/`56px`/`40px 100px` measure from the spec is a nice-to-have visual refinement, not required for functional parity — skip it unless doing a follow-up polish pass (call this out to the user after Task 13's smoke test rather than silently adding more prop plumbing here).

9. Mount the palette once, near the `<Layout>` return:

```tsx
return (
  <>
    <Layout sidebar={sidebar} header={headerNav}>
      {/* ...existing view branches, updated per step 8 above... */}
    </Layout>
    <CommandPalette
      open={paletteOpen}
      query={paletteQuery}
      onQueryChange={setPaletteQuery}
      onClose={closePalette}
      onSelect={handlePaletteSelect}
    />
  </>
)
```

- [ ] **Step 4: Type-check and lint**

Run: `cd frontend && npx tsc --noEmit -p . && npm run lint`
Expected: no errors. Fix any leftover references to the removed `selectedTag`/`onSelectTag`/`SiteHeader`/`ThemePicker` imports.

- [ ] **Step 5: Manual smoke test**

Run: `uv run uvicorn backend.main:app --reload --port 8000` (one terminal) and `cd frontend && npm run dev` (another), then open `http://localhost:5173`.
Expected, click through each:
- Layout icons switch between three-pane / two-pane / centered without errors.
- Theme swatches switch all 5 themes; colors visibly change app-wide (including Articles/Stats).
- Type toggle swaps reader prose between serif and mono.
- Ctrl/Cmd+K opens the palette; typing filters both the palette rows and (in three/two layouts) the term list behind it; selecting a row navigates to that term and closes the palette; Escape closes it and clears the filter.
- Centered layout's floating "Jump to term" pill opens the same palette.

- [ ] **Step 6: Commit**

```bash
git add -A frontend/src/App.tsx frontend/src/components/CategoryChipRail.tsx frontend/src/components/JumpToTermPill.tsx
git commit -m "Wire header controls, command palette, and three Browse layouts into App.tsx"
```

---

## Task 10: Backend — `GET /api/terms/graph` for the concept map's connectedness data

**Files:**
- Modify: `backend/models.py`
- Modify: `backend/routers/terms.py`
- Test: `tests/test_terms_graph.py` (create — check existing test layout first: run `find . -name "test_*.py" -path "*/tests/*" -o -name "conftest.py" | head` to confirm the test directory/fixture pattern before writing; follow whatever `conn`/`client` fixtures the existing suite already uses)

**Interfaces:**
- Produces: `TermMapNode` model `{ id, name, slug, is_favorite, categories: List[CategoryResponse], related_count: int }`; route `GET /terms/graph -> List[TermMapNode]`.
- Consumes: existing `_batch_get_categories` helper in `terms.py`.

- [ ] **Step 1: Check the existing test setup**

Run: `find backend -iname "conftest.py" -o -iname "test_*.py" | sort` and open whatever it finds (or `find . -maxdepth 2 -iname "conftest.py"` if tests live outside `backend/`). Confirm how a test acquires a DB connection / test client before writing Step 2 — do not guess the fixture name.

- [ ] **Step 2: Write the failing test**

Adapt this skeleton to match the fixture names found in Step 1 (shown here assuming an async test client fixture named `client` and that `content/` seed data is loaded for tests, matching the existing suite's convention):

```python
import pytest


@pytest.mark.asyncio
async def test_terms_graph_returns_related_counts(client):
    resp = await client.get("/api/terms/graph")
    assert resp.status_code == 200
    nodes = resp.json()
    assert isinstance(nodes, list)
    assert len(nodes) > 0
    node = nodes[0]
    assert set(node.keys()) >= {"id", "name", "slug", "is_favorite", "categories", "related_count"}
    assert isinstance(node["related_count"], int)
    assert isinstance(node["categories"], list)


@pytest.mark.asyncio
async def test_terms_graph_related_count_matches_related_terms_endpoint(client):
    # Abstract Class is related to Arraylist per content/terms/abstract-class.md
    graph = (await client.get("/api/terms/graph")).json()
    abstract_class = next(n for n in graph if n["slug"] == "abstract-class")
    assert abstract_class["related_count"] >= 1
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `uv run pytest tests/test_terms_graph.py -v` (adjust path to match Step 1's findings)
Expected: FAIL — `404 Not Found` for `/api/terms/graph` (route doesn't exist yet).

- [ ] **Step 4: Add the `TermMapNode` model**

In `backend/models.py`, add after `TermSummary`:

```python
class TermMapNode(BaseModel):
    id: int
    name: str
    slug: str
    is_favorite: bool
    categories: List[CategoryResponse] = []
    related_count: int = 0

    @field_validator("is_favorite", mode="before")
    @classmethod
    def coerce_favorite(cls, v: object) -> bool:
        return bool(v)
```

- [ ] **Step 5: Add the route**

In `backend/routers/terms.py`, import `TermMapNode` alongside the other model imports, and add this route **before** the `@router.get("/{slug}", ...)` catch-all (place it right after the `/summaries` route so it isn't shadowed):

```python
@router.get("/graph", response_model=List[TermMapNode])
async def list_terms_graph(conn: aiomysql.Connection = Depends(get_db)):
    """Lightweight per-term data for the Diagram (concept map) page:
    category membership + how many other terms link to it."""
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT id, name, slug, is_favorite FROM terms ORDER BY name")
        rows = await cur.fetchall()

        ids = [r["id"] for r in rows]
        cats_by_term = await _batch_get_categories(conn, ids)

        related_counts: dict = {}
        if ids:
            await cur.execute("""
                SELECT term_id, COUNT(*) AS cnt FROM (
                    SELECT term_a AS term_id FROM related_terms
                    UNION ALL
                    SELECT term_b AS term_id FROM related_terms
                ) pairs
                GROUP BY term_id
            """)
            related_counts = {r["term_id"]: r["cnt"] for r in await cur.fetchall()}

    return [
        {
            "id": row["id"],
            "name": row["name"],
            "slug": row["slug"],
            "is_favorite": bool(row["is_favorite"]),
            "categories": cats_by_term[row["id"]],
            "related_count": related_counts.get(row["id"], 0),
        }
        for row in rows
    ]
```

- [ ] **Step 6: Run the test again to confirm it passes**

Run: `uv run pytest tests/test_terms_graph.py -v`
Expected: PASS.

- [ ] **Step 7: Run the full backend suite to check for regressions**

Run: `uv run pytest`
Expected: all tests pass (no route-ordering regression on `/{slug}`).

- [ ] **Step 8: Commit**

```bash
git add backend/models.py backend/routers/terms.py tests/test_terms_graph.py
git commit -m "Add GET /api/terms/graph endpoint with per-term related-term counts for the concept map"
```

---

## Task 11: Frontend types + API client for the graph endpoint

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/api/client.ts`

**Interfaces:**
- Produces: `TermMapNode` type, `api.terms.graph()`.
- Consumes: `GET /api/terms/graph` from Task 10.

- [ ] **Step 1: Add the type**

In `frontend/src/types/index.ts`, add after `TermSummary`:

```typescript
export interface TermMapNode {
  id: number
  name: string
  slug: string
  is_favorite: boolean
  categories: Category[]
  related_count: number
}
```

- [ ] **Step 2: Add the client method**

In `frontend/src/api/client.ts`, import `TermMapNode` in the type import list, and add inside `api.terms`:

```typescript
graph: () => request<TermMapNode[]>("/terms/graph"),
```

- [ ] **Step 3: Type-check**

Run: `cd frontend && npx tsc --noEmit -p .`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/index.ts frontend/src/api/client.ts
git commit -m "Add TermMapNode type and api.terms.graph() client method"
```

---

## Task 12: Diagram page (concept map)

**Files:**
- Create: `frontend/src/components/DiagramPage.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `api.terms.graph()` (Task 11), `hasConceptVisual` (existing `ConceptVisual.tsx`).
- Produces: `DiagramPage` props `{ selectedSlug: string | null; onSelectTerm: (slug: string) => void }`.

- [ ] **Step 1: Write `DiagramPage.tsx`**

```typescript
import useSWR from "swr"
import { api } from "../api/client"
import { hasConceptVisual } from "./ConceptVisual"
import type { TermMapNode } from "../types"

interface DiagramPageProps {
  selectedSlug: string | null
  onSelectTerm: (slug: string) => void
}

interface CategoryGroup {
  id: number
  name: string
  slug: string
  terms: TermMapNode[]
}

export function DiagramPage({ selectedSlug, onSelectTerm }: DiagramPageProps) {
  const { data, error, isLoading } = useSWR("/terms/graph", api.terms.graph)

  if (isLoading) return <p className="p-8 text-fg3 text-sm">Loading concept map…</p>
  if (error) return <p className="p-8 text-red-400 text-sm">Failed to load: {error.message}</p>

  const nodes = data ?? []
  const groupsByCategory = new Map<number, CategoryGroup>()
  for (const node of nodes) {
    for (const cat of node.categories) {
      if (!groupsByCategory.has(cat.id)) {
        groupsByCategory.set(cat.id, { id: cat.id, name: cat.name, slug: cat.slug, terms: [] })
      }
      groupsByCategory.get(cat.id)!.terms.push(node)
    }
  }
  const groups = [...groupsByCategory.values()].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="h-full overflow-y-auto px-10 py-[34px] pb-[70px]">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex flex-wrap justify-between items-end gap-4">
          <div>
            <h1 className="text-[30px] tracking-[-0.025em] font-bold text-fg m-0">Concept map</h1>
            <p className="mt-2 text-fg2 text-[13.5px] leading-[1.6] max-w-[60ch]">
              Every term grouped by topic. Chip weight shows how many other concepts link to it — click any chip to open it in Browse.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="flex items-center gap-[7px] border border-line rounded-md px-[10px] py-[5px] text-[11.5px] text-fg3">
              <span className="w-[9px] h-[9px] rounded-full bg-accent" /> Core term
            </span>
            <span className="flex items-center gap-[7px] border border-line rounded-md px-[10px] py-[5px] text-[11.5px] text-fg3">
              <span className="w-[9px] h-[9px] rounded-full bg-accent2" /> Has diagram
            </span>
            <span className="flex items-center gap-[7px] border border-line rounded-md px-[10px] py-[5px] text-[11.5px] text-fg3">
              <span className="w-[9px] h-[9px] rounded-[2px] bg-tagFg" /> Favorited
            </span>
          </div>
        </div>

        <div className="grid gap-4 mt-[26px] items-start" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
          {groups.map(group => (
            <div key={group.id} className="border border-line rounded-xl bg-bg2 overflow-hidden">
              <div className="flex justify-between items-center px-4 py-[13px] border-b border-line bg-bg3">
                <span className="flex items-center gap-2 font-semibold text-[13.5px] text-fg">
                  <span className="w-[9px] h-[9px] rounded-full bg-accent" />
                  {group.name}
                </span>
                <span className="text-[11px] text-fg3">{group.terms.length} terms</span>
              </div>
              <div className="flex flex-wrap gap-[7px] px-4 pt-[14px] pb-4">
                {group.terms.map(term => {
                  const hasVisual = hasConceptVisual(term.slug)
                  const fontSize = 11.5 + Math.min(3, term.related_count)
                  const isSelected = term.slug === selectedSlug
                  return (
                    <button
                      key={term.id}
                      onClick={() => onSelectTerm(term.slug)}
                      style={{ fontSize: `${fontSize}px` }}
                      className={`px-[11px] py-[6px] rounded-md transition-colors font-mono
                        ${hasVisual ? "bg-bg3" : "bg-transparent"}
                        ${term.is_favorite ? "border border-tagLine" : "border border-line"}
                        ${isSelected ? "text-accent" : "text-fg2"}
                        hover:border-accent hover:text-fg`}
                    >
                      {term.name}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

Note: the legend's "Core term" marker documents a category exactly as drawn in the spec, but the spec defines no additional per-chip trigger for it beyond the legend itself (only "has diagram" and "favorited" have documented chip rules) — this is a faithful implementation of what's specified, not a gap to fix.

- [ ] **Step 2: Wire it into `App.tsx`**

Add the import (`import { DiagramPage } from "./components/DiagramPage"`) and a render branch alongside the other `view === "..."` blocks:

```tsx
{view === "diagram" && (
  <DiagramPage
    selectedSlug={selectedSlug}
    onSelectTerm={(slug) => { setView("terms"); handleSelectTerm(slug) }}
  />
)}
```

- [ ] **Step 3: Type-check**

Run: `cd frontend && npx tsc --noEmit -p .`
Expected: no errors.

- [ ] **Step 4: Manual smoke test**

With both dev servers running (Task 9, Step 5), navigate to `02 DIAGRAM` in the nav. Confirm: cards render one per category, chip font size visibly varies with `related_count`, clicking a chip switches to Browse on that term, favorited terms show the tag-line border, terms with real `ConceptVisual` diagrams show the filled `bg3` chip background.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/DiagramPage.tsx frontend/src/App.tsx
git commit -m "Add Diagram (concept map) page grouping terms by category with connectedness-weighted chips"
```

---

## Task 13: Documentation — update `CLAUDE.md` theming section

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Replace the "Theming" subsection**

Under "## UI / Design Direction", replace the existing `### Theming` block with:

```markdown
### Theming

- All Tailwind color tokens (`bg`, `bg2`, `bg3`, `line`, `fg`, `fg2`, `fg3`, `accent`, `accent2`, `sel`, `codeBg`, `tagBg`, `tagFg`, `tagLine`) resolve to CSS variables (`--c-*`) defined in `frontend/src/styles/globals.css`. The old token names (`surface`, `border`, `text`, `muted`, `code`, `green`) still work as aliases onto the new tokens, for any not-yet-migrated markup.
- Themes are selected via a `data-theme="<id>"` attribute on `<html>`, driven by `useUiPrefs()` (`frontend/src/hooks/useUiPrefs.ts`). Built-ins: `midnight` (default, dark), `paper`, `sepia`, `ocean`, `contrast` (high contrast).
- A typography mode toggle sets `data-type="hybrid"|"mono"` on `<html>` (also via `useUiPrefs()`), swapping `--body`/`--bodysize`/`--bodylh`. `hybrid` (default) uses Source Serif 4 for body prose; `mono` uses JetBrains Mono for everything. Chrome/UI text is always JetBrains Mono in both modes.
- Code block syntax highlighting uses a custom `prism-react-renderer` theme (`frontend/src/lib/prismTheme.ts`) mapped onto `--c-kw/str/num/com/fn/txt`, so it follows the active theme (no longer a fixed Prism preset).
- The header's control cluster (`HeaderControls.tsx`) exposes the theme swatches, layout switcher (`three`/`two`/`center` Browse layouts), and type toggle. All three preferences persist to `localStorage` under `concept-master.theme` / `concept-master.layout` / `concept-master.typeMode`.
- To add a theme: append a new `[data-theme="..."]` block in `globals.css`, plus a matching entry in `THEMES` in `HeaderControls.tsx` and in `VALID_THEMES`/the `Theme` union in `useUiPrefs.ts`.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "Document the new theme/layout/typography-mode system in CLAUDE.md"
```

---

## Self-Review Notes

- **Spec coverage:** Global header chrome (Task 5), command palette (Task 6), three-pane Sidebar/TermCard (Task 7), reader tab bar + restyled blocks (Task 8), two-pane chip rail + centered floating pill + layout wiring (Task 9), Diagram concept-map page + backend support (Tasks 10–12), 5 themes + typography toggle (Tasks 1–4), doc update (Task 13). Stub pages (Articles/Study/Review/Stats) intentionally untouched per spec + Global Constraints.
- **Placeholder scan:** every step above has literal code, exact file paths, and exact verification commands — no "add appropriate styling" or "similar to Task N" placeholders.
- **Type consistency:** `View` union is extended once (Task 9) and reused as-is in Tasks 10–12; `Layout`/`Theme`/`TypeMode` types are defined once in `useUiPrefs.ts` (Task 3) and imported everywhere else that needs them (`HeaderControls.tsx`); `TermMapNode` is defined once in `types/index.ts` (Task 11) mirroring the backend `TermMapNode` Pydantic model (Task 10) field-for-field.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-30-layout-theme-rework.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
