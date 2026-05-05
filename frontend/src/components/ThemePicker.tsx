import { useEffect, useRef, useState } from "react"

type Theme = {
  id: string
  name: string
  swatches: [string, string, string]
}

const THEMES: Theme[] = [
  { id: "github-dark",    name: "GitHub Dark",    swatches: ["#0d1117", "#58a6ff", "#39d353"] },
  { id: "dracula",        name: "Dracula",        swatches: ["#282a36", "#bd93f9", "#50fa7b"] },
  { id: "nord",           name: "Nord",           swatches: ["#2e3440", "#88c0d0", "#a3be8c"] },
  { id: "solarized-dark", name: "Solarized Dark", swatches: ["#002b36", "#268bd2", "#859900"] },
  { id: "monokai",        name: "Monokai",        swatches: ["#272822", "#f92672", "#a6e22e"] },
  { id: "gruvbox-light",  name: "Gruvbox Light",  swatches: ["#fbf1c7", "#af3a03", "#79740e"] },
]

const STORAGE_KEY = "concept-master.theme"

function applyTheme(id: string) {
  document.documentElement.setAttribute("data-theme", id)
}

export function ThemePicker() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) ?? "github-dark"
  })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    applyTheme(active)
    localStorage.setItem(STORAGE_KEY, active)
  }, [active])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("mousedown", onClick)
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("mousedown", onClick)
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        title="Change theme"
        aria-label="Change theme"
        className="w-8 h-8 flex items-center justify-center rounded-md text-muted
                   hover:text-text hover:bg-white/5 transition-colors"
      >
        {/* Palette icon */}
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
             stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22a10 10 0 1 1 10-10c0 2.5-2 4-4 4h-2a2 2 0 0 0-1.4 3.4A2 2 0 0 1 12 22Z" />
          <circle cx="7.5"  cy="10.5" r="1" fill="currentColor" />
          <circle cx="12"   cy="7"    r="1" fill="currentColor" />
          <circle cx="16.5" cy="10.5" r="1" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-md border border-border bg-surface shadow-lg p-1 z-30">
          <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted font-mono">
            Theme
          </div>
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => { setActive(t.id); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left
                          hover:bg-white/5 transition-colors
                          ${active === t.id ? "text-accent" : "text-text"}`}
            >
              <span className="flex gap-0.5">
                {t.swatches.map((c, i) => (
                  <span key={i}
                        className="w-3 h-3 rounded-sm border border-border"
                        style={{ background: c }} />
                ))}
              </span>
              <span className="flex-1">{t.name}</span>
              {active === t.id && <span className="text-accent">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
