import { useEffect, useMemo, useRef } from "react"
import useSWR from "swr"
import { api } from "../api/client"

interface CommandPaletteProps {
  open: boolean
  query: string
  onQueryChange: (q: string) => void
  onClose: () => void
  onSelect: (slug: string) => void
}

interface PaletteRow {
  slug: string
  name: string
  category: string
  tags: string[]
}

export function CommandPalette({ open, query, onQueryChange, onClose, onSelect }: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Palette needs name + category + tags for every term to filter client-side;
  // fetch once, lazily, only while the palette has ever been opened this session.
  const { data } = useSWR(open ? "/terms?limit=500" : null, () =>
    api.terms.list(new URLSearchParams({ limit: "500" }))
  )

  const rows: PaletteRow[] = useMemo(() => {
    const terms = data?.terms ?? []
    return terms.map(t => ({
      slug: t.slug,
      name: t.name,
      category: t.categories[0]?.name ?? "",
      tags: t.tags.map(tag => tag.name),
    }))
  }, [data])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows.slice(0, 40)
    return rows
      .filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.tags.some(t => t.toLowerCase().includes(q))
      )
      .slice(0, 40)
  }, [rows, query])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex justify-center pt-[12vh]"
      style={{ background: "rgba(0,0,0,.55)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <div
        className="w-[620px] max-w-[92vw] h-fit bg-bg2 border border-line rounded-xl overflow-hidden"
        style={{ boxShadow: "0 24px 70px rgba(0,0,0,.45)" }}
        onClick={e => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder="Search terms, tags, categories…"
          className="w-full h-[52px] px-[18px] bg-transparent border-b border-line text-[15px] text-fg
                     placeholder:text-fg3 focus:outline-none"
        />
        <div className="max-h-[56vh] overflow-y-auto overflow-x-hidden p-2">
          {filtered.map(row => (
            <button
              key={row.slug}
              onClick={() => onSelect(row.slug)}
              className="w-full flex items-center justify-between gap-3 px-3 py-[10px] rounded-[7px]
                         text-[13.5px] text-fg hover:bg-bg3 transition-colors text-left"
            >
              <span className="truncate">{row.name}</span>
              <span className="flex-none text-[11px] text-fg3">{row.category}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-4 text-[13px] text-fg3">No matches.</p>
          )}
        </div>
      </div>
    </div>
  )
}
