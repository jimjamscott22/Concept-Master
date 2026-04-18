import type { Config } from "tailwindcss"

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:      "rgb(var(--c-bg) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        border:  "rgb(var(--c-border) / <alpha-value>)",
        text:    "rgb(var(--c-text) / <alpha-value>)",
        muted:   "rgb(var(--c-muted) / <alpha-value>)",
        accent:  "rgb(var(--c-accent) / <alpha-value>)",
        green:   "rgb(var(--c-green) / <alpha-value>)",
        code:    "rgb(var(--c-code) / <alpha-value>)",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config
