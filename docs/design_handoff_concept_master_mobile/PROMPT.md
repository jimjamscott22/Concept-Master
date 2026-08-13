# Implementation prompt

Paste this into Claude Code from the root of the target repo, with this handoff folder available.

---

Implement the Concept-Master iOS app from the design handoff in `design_handoff_concept_master_mobile/`.

Read `README.md` in that folder first — it is the complete spec: five screens (Browse, Term detail, Study, Articles, Add term), exact colors, type, spacing, component measurements, interaction behavior, and state shape. The screenshots in `screenshots/` show the intended result.

Important context:

- The `.dc.html` files in the bundle are **design references**, not production code. Do not copy their markup. Recreate the screens in this repo's environment using its existing patterns, components, and conventions. If the repo has no app scaffold yet, set up Expo + React Native (targeting Expo Go) with a four-tab navigator.
- The designs are **high fidelity** — match the colors, type, and spacing in the README exactly. Where the prototype hard-codes a 62px status-bar padding, use real safe-area insets instead. The 83px tab bar height is already correct for iOS.
- The app is **local-first**: all terms ship on device, every write is local and immediate, and sync happens only when the user taps the sync chip. There is no runtime backend and no loading spinners on save.
- Bundle JetBrains Mono and Source Serif 4 locally rather than loading them over the network.

Work in this order:

1. Scaffold the app and the tab navigator, with the tab bar built exactly as specified (numeral above label, no icons).
2. Build the local store and seed it with the term and article data — define the `Term` and `Article` types from the README's state section.
3. Browse, then Term detail (including the three in-page tabs and the code block's syntax colors).
4. Study (flashcards, tap to reveal, Previous/Next).
5. Articles list and reader.
6. Add term — the form, the tag bottom sheet, and the saved state with the pending-sync chip and toast.
7. Manual sync.

Before starting, read the README's **Open questions** section and ask me about anything on it that blocks your work — particularly whether the code snippet editor is a full screen or an inline expansion.
