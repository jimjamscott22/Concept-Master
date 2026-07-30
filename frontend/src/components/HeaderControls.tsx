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
