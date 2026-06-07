---
title: Learning How to Build Well-Styled React Apps
subtitle: A practical path from inline styles to a consistent, themeable design system
is_published: true
categories: [design, web]
tags: [fundamentals, web]
related_terms: [immutability, pure-function, higher-order-function, encapsulation]
related_articles: [designing-react-uis]
---

"Well-styled" is not the same as "uses a fancy CSS library." It means the look is
*consistent*, *changeable*, and *intentional* — spacing follows a rhythm, colors come
from a fixed set, and you can restyle the whole app without hunting through dozens of
files. This article is a learning path: it walks from the naive way most people start,
through the decisions that actually move the needle, to a small design system you can
grow. It's the visual companion to *Designing UIs for a React App*, which covers the
component and state side.

## Start by understanding what you're choosing between

Before picking tools, know the four broad ways to style React, because each pushes your
code in a different direction:

| Approach | What it is | Best when |
| --- | --- | --- |
| **Plain CSS / CSS Modules** | `.css` files, scoped per component with Modules | You want zero runtime and standard CSS |
| **Utility-first (Tailwind)** | Compose styling from small classes in markup | You value speed and a built-in design scale |
| **CSS-in-JS** (styled-components, Emotion) | Styles written in JS, co-located with components | You need styles that depend heavily on props |
| **Component libraries** (MUI, shadcn/ui) | Pre-built, styled components | You want to ship fast and accept their look |

There's no universally correct choice. This very app uses **Tailwind**, because a
utility framework hands you a spacing/type/color *scale* for free — and a scale is the
single biggest lever on whether an app looks designed or thrown together.

## The lesson that matters most: design with tokens, not values

The defining habit of well-styled apps is that **raw values rarely appear in
components**. Instead of `color: #58a6ff` scattered everywhere, you define a *token* —
a named decision — once, and reference it. Tokens are to styling what constants are to
code: change the definition in one place, and every use updates.

This app makes the pattern concrete. Every Tailwind color (`bg`, `surface`, `border`,
`text`, `muted`, `accent`) resolves to a CSS variable defined in `globals.css`:

```css
:root, [data-theme="github-dark"] {
  --c-bg: #0d1117;
  --c-surface: #161b22;
  --c-accent: #58a6ff;
  /* ...one place to change the brand... */
}
```

Because components reference the token (`bg-accent`) and never the hex value, swapping
`[data-theme="dracula"]` on the `<html>` element re-skins the entire UI. **That is the
payoff of tokens**: theming becomes a data change, not a refactor. Spacing and type
deserve the same treatment — pick a 4px/8px spacing scale and two or three font sizes,
and use *only* those.

## Then learn to keep styling consistent across components

Tokens prevent random values; the next skill is preventing *inconsistent components* —
five slightly different buttons across an app. Two complementary techniques:

**1. Encapsulate each visual element once.** Build a `<Button>`, `<Card>`, `<Badge>`
once, with variants as props, and import them everywhere. The styling lives in one
file. This is just the **single source of truth** idea applied to appearance.

**2. Manage class combinations deliberately.** As variants multiply, conditional class
strings get messy. A tiny helper that maps a `variant` to its classes keeps things
honest. This is a small but real design decision in any Tailwind app — so it's a good
one to write yourself.

```tsx
// src/components/ui/buttonStyles.ts
type Variant = "primary" | "ghost" | "danger";

const BASE =
  "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium " +
  "transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

// TODO(you): fill in the variant → classes map.
// Each variant should use TOKEN classes (bg-accent, bg-surface, border-border,
// text-text, text-muted, hover:...) — never raw hex values — so the button
// re-themes automatically. Think about which variant needs a border, which
// needs a hover state, and how `danger` should read as destructive.
const VARIANTS: Record<Variant, string> = {
  // primary: "...",
  // ghost: "...",
  // danger: "...",
};

export function buttonClass(variant: Variant = "primary") {
  return `${BASE} ${VARIANTS[variant]}`;
}
```

Why hand this to you? Because the *vocabulary of variants* is a genuine design choice:
how many you need, which states each one reflects (hover, focus, disabled), and how
they map onto this app's token names. Filling in that `VARIANTS` map — using token
classes so the buttons re-theme automatically — is the exact muscle that "well-styled"
trains. (A `clsx` / `tailwind-merge` helper is worth adopting once this grows.)

## Design the states, not just the happy path

Beginners style the "button with text on it." Finished apps style the **hover, focus,
active, disabled, loading, empty, and error** states too. Keyboard users in particular
rely on a visible focus ring — never delete it without replacing it. A practical drill:
for every interactive component you build, list its states first, then style each one.
If you skip this, the app will *feel* unfinished even when the colors are nice.

## Accessibility and motion are part of "styled"

- **Contrast is a styling constraint.** Body text wants a 4.5:1 contrast ratio (WCAG
  AA). A gorgeous low-contrast gray that no one can read is a bug, not a style.
- **Use semantic elements** (`<button>`, `<nav>`, `<label>`) so you get focus and
  screen-reader behavior for free, then style those rather than `<div>`s.
- **Motion should be subtle and purposeful** — short transitions on hover/expand, not
  bouncing everything. Respect `prefers-reduced-motion` for users who opt out.

## A learning path to actually follow

1. **Style one component three ways** — plain CSS, a CSS Module, and Tailwind. Feeling
   the difference beats reading about it.
2. **Replace every hardcoded color and spacing value with a token.** Notice how the
   component shrinks and reads better.
3. **Extract your first reusable `<Button>`/`<Card>`** and delete the duplicated markup
   it replaces.
4. **Add a second theme** by defining a new `[data-theme]` block of the same tokens.
   If your app re-skins cleanly, your token discipline is working.
5. **Audit one screen for states** — does every control have hover, focus, disabled?
   Is there an empty and error state? Fix the gaps.

## A checklist for "well-styled"

- Do components reference tokens, never raw hex/pixel values?
- Is spacing on one fixed scale, with a small palette and a single reserved accent?
- Does each visual element exist once, reused everywhere, with variants as props?
- Have I styled focus, hover, disabled, empty, and error — not just the default?
- Can I re-skin the whole app by changing one set of token definitions?
- Does text meet contrast minimums and does motion respect user preferences?

Get the tokens and the reusable components right, and "styling" stops being a chore you
redo on every screen — it becomes a small set of decisions you made once and now just
*use*.
