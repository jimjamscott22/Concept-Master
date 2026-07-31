import useSWR from "swr"
import { api } from "../api/client"
import { hasConceptVisual } from "./ConceptVisual"
import type { TermMapNode } from "../types"

interface DiagramPageProps {
  selectedSlug: string | null
  onSelectTerm: (slug: string) => void
}

interface CategoryGroup {
  id: number
  name: string
  slug: string
  terms: TermMapNode[]
}

export function DiagramPage({ selectedSlug, onSelectTerm }: DiagramPageProps) {
  const { data, error, isLoading } = useSWR("/terms/graph", api.terms.graph)

  if (isLoading) return <p className="p-8 text-fg3 text-sm">Loading concept map…</p>
  if (error) return <p className="p-8 text-red-400 text-sm">Failed to load: {error.message}</p>

  const nodes = data ?? []
  const groupsByCategory = new Map<number, CategoryGroup>()
  for (const node of nodes) {
    for (const cat of node.categories) {
      if (!groupsByCategory.has(cat.id)) {
        groupsByCategory.set(cat.id, { id: cat.id, name: cat.name, slug: cat.slug, terms: [] })
      }
      groupsByCategory.get(cat.id)!.terms.push(node)
    }
  }
  const groups = [...groupsByCategory.values()].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="h-full overflow-y-auto px-10 py-[34px] pb-[70px]">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex flex-wrap justify-between items-end gap-4">
          <div>
            <h1 className="text-[30px] tracking-[-0.025em] font-bold text-fg m-0">Concept map</h1>
            <p className="mt-2 text-fg2 text-[13.5px] leading-[1.6] max-w-[60ch]">
              Every term grouped by topic. Chip weight shows how many other concepts link to it — click any chip to open it in Browse.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="flex items-center gap-[7px] border border-line rounded-md px-[10px] py-[5px] text-[11.5px] text-fg3">
              <span className="w-[9px] h-[9px] rounded-full bg-accent" /> Core term
            </span>
            <span className="flex items-center gap-[7px] border border-line rounded-md px-[10px] py-[5px] text-[11.5px] text-fg3">
              <span className="w-[9px] h-[9px] rounded-full bg-accent2" /> Has diagram
            </span>
            <span className="flex items-center gap-[7px] border border-line rounded-md px-[10px] py-[5px] text-[11.5px] text-fg3">
              <span className="w-[9px] h-[9px] rounded-[2px] bg-tagFg" /> Favorited
            </span>
          </div>
        </div>

        <div className="grid gap-4 mt-[26px] items-start" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
          {groups.map(group => (
            <div key={group.id} className="border border-line rounded-xl bg-bg2 overflow-hidden">
              <div className="flex justify-between items-center px-4 py-[13px] border-b border-line bg-bg3">
                <span className="flex items-center gap-2 font-semibold text-[13.5px] text-fg">
                  <span className="w-[9px] h-[9px] rounded-full bg-accent" />
                  {group.name}
                </span>
                <span className="text-[11px] text-fg3">{group.terms.length} terms</span>
              </div>
              <div className="flex flex-wrap gap-[7px] px-4 pt-[14px] pb-4">
                {group.terms.map(term => {
                  const hasVisual = hasConceptVisual(term.slug)
                  const fontSize = 11.5 + Math.min(3, term.related_count)
                  const isSelected = term.slug === selectedSlug
                  return (
                    <button
                      key={term.id}
                      onClick={() => onSelectTerm(term.slug)}
                      style={{ fontSize: `${fontSize}px` }}
                      className={`px-[11px] py-[6px] rounded-md transition-colors font-mono
                        ${hasVisual ? "bg-bg3" : "bg-transparent"}
                        ${term.is_favorite ? "border border-tagLine" : "border border-line"}
                        ${isSelected ? "text-accent" : "text-fg2"}
                        hover:border-accent hover:text-fg`}
                    >
                      {term.name}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
