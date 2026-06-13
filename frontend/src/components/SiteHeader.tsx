import type React from "react"

type View = "terms" | "stats" | "form" | "review" | "study" | "articles" | "article-form"

interface SiteHeaderProps {
  view: View
  dueCount: number
  onNavigate: (view: View) => void
  onNewTerm: () => void
  onExport: () => void
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void
}

interface NavItem {
  id: View
  label: string
  shortcut: string
}

const NAV: NavItem[] = [
  { id: "terms",    label: "Browse",   shortcut: "01" },
  { id: "articles", label: "Articles", shortcut: "02" },
  { id: "study",    label: "Study",    shortcut: "03" },
  { id: "review",   label: "Review",   shortcut: "04" },
  { id: "stats",    label: "Stats",    shortcut: "05" },
]

export function SiteHeader({
  view, dueCount, onNavigate, onNewTerm, onExport, onImport,
}: SiteHeaderProps) {
  const newLabel = view === "articles" || view === "article-form" ? "New Article" : "Create a new term"
  return (
    <nav className="flex items-center gap-1 h-full">
      {NAV.map(item => {
        const active = view === item.id
          || (item.id === "terms" && view === "form")
          || (item.id === "articles" && view === "article-form")
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`group relative h-full px-3 flex items-center gap-2
                        transition-colors text-xs font-mono tracking-wide
                        ${active ? "text-text" : "text-muted hover:text-text"}`}
          >
            <span className={`text-[9px] tabular-nums transition-colors
                              ${active ? "text-accent" : "text-muted/50 group-hover:text-muted"}`}>
              {item.shortcut}
            </span>
            <span className="uppercase">{item.label}</span>
            {item.id === "review" && dueCount > 0 && (
              <span className="ml-0.5 text-[9px] font-mono px-1.5 py-0.5 rounded-sm
                               bg-green/15 text-green border border-green/30 leading-none">
                {dueCount > 99 ? "99+" : dueCount}
              </span>
            )}
            <span className={`absolute left-2 right-2 bottom-0 h-px transition-all
                              ${active ? "bg-accent" : "bg-transparent group-hover:bg-border"}`} />
          </button>
        )
      })}

      <span className="mx-2 h-5 w-px bg-border" />

      <button
        onClick={onNewTerm}
        className="h-7 px-3 rounded-md bg-accent/10 text-accent border border-accent/30
                   hover:bg-accent/20 hover:border-accent/50 transition-colors
                   text-xs font-mono font-medium tracking-wide flex items-center gap-1.5"
        title={newLabel}
      >
        <span className="text-sm leading-none">+</span>
        <span className="uppercase">New</span>
      </button>

      <button
        onClick={onExport}
        title="Export glossary as JSON"
        aria-label="Export"
        className="ml-1 h-7 w-7 flex items-center justify-center rounded-md
                   text-muted hover:text-text hover:bg-white/5 transition-colors"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
             stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4v12" />
          <path d="m6 10 6 6 6-6" />
          <path d="M5 20h14" />
        </svg>
      </button>

      <label
        title="Import JSON"
        aria-label="Import"
        className="h-7 w-7 flex items-center justify-center rounded-md cursor-pointer
                   text-muted hover:text-text hover:bg-white/5 transition-colors"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
             stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20V8" />
          <path d="m6 14 6-6 6 6" />
          <path d="M5 4h14" />
        </svg>
        <input type="file" accept=".json" className="hidden" onChange={onImport} />
      </label>
    </nav>
  )
}
