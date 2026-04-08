import type { Config } from "tailwindcss"

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:      "#0d1117",
        surface: "#161b22",
        border:  "#30363d",
        text:    "#e6edf3",
        muted:   "#8b949e",
        accent:  "#58a6ff",
        green:   "#39d353",
        code:    "#1c2128",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config
