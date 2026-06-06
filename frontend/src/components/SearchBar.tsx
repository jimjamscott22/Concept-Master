import { useRef, useEffect } from "react"

interface SearchBarProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = "Search…" }: SearchBarProps) {
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
    <div className="relative w-56">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted text-sm pointer-events-none">⌕</span>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-code border border-border rounded-md pl-7 pr-14 py-1.5 text-sm
                   text-text placeholder:text-muted focus:outline-none focus:border-accent
                   focus:ring-1 focus:ring-accent transition-colors"
      />
      <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted
                      border border-border rounded px-1 font-mono pointer-events-none">
        Ctrl+K
      </kbd>
    </div>
  )
}
