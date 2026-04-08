import { useRef, useEffect } from "react"

interface SearchBarProps {
  value: string
  onChange: (v: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === "k") || e.key === "/") {
        if (document.activeElement?.tagName !== "INPUT" &&
            document.activeElement?.tagName !== "TEXTAREA") {
          e.preventDefault()
          ref.current?.focus()
        }
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  return (
    <div className="relative px-4 py-3">
      <span className="absolute left-7 top-1/2 -translate-y-1/2 text-muted text-sm">⌕</span>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search terms…"
        className="w-full bg-code border border-border rounded-md pl-8 pr-16 py-2 text-sm
                   text-text placeholder:text-muted focus:outline-none focus:border-accent
                   focus:ring-1 focus:ring-accent transition-colors"
      />
      <kbd className="absolute right-7 top-1/2 -translate-y-1/2 text-xs text-muted
                      border border-border rounded px-1 font-mono">
        Ctrl+K
      </kbd>
    </div>
  )
}
