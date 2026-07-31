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
