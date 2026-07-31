import type { Term } from "../types"
import { hasConceptVisual } from "./ConceptVisual"

interface TermCardProps {
  term: Term
  isSelected: boolean
  onClick: () => void
  onToggleFavorite: () => void
}

export function TermCard({ term, isSelected, onClick, onToggleFavorite }: TermCardProps) {
  const preview = term.definition.replace(/[*_`#[\]]/g, "").slice(0, 120)
  const hasVisual = hasConceptVisual(term.slug)

  return (
    <div
      data-slug={term.slug}
      onClick={onClick}
      className={`px-4 py-[15px] border-b border-line border-l-[3px] cursor-pointer transition-colors
        ${isSelected ? "bg-bg3 border-l-accent" : "border-l-transparent hover:bg-bg3/60"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-[14.5px] tracking-[-0.01em] text-fg truncate">{term.name}</h3>
        <div className="flex-none flex items-center gap-1.5">
          {hasVisual && (
            <span className="text-[9.5px] tracking-[.1em] uppercase border border-tagLine text-tagFg rounded-[3px] px-[5px] py-px">
              Visual
            </span>
          )}
          <button
            onClick={e => { e.stopPropagation(); onToggleFavorite() }}
            className={`text-[13px] ${term.is_favorite ? "text-accent" : "text-fg3 opacity-50"}`}
          >
            ★
          </button>
        </div>
      </div>
      <p className="mt-[5px] text-fg2 text-[12.5px] leading-[1.55] line-clamp-2">{preview}…</p>
      {term.tags.length > 0 && (
        <div className="flex flex-wrap gap-[5px] mt-[9px]">
          {term.tags.map(t => (
            <span key={t.id} className="text-[10.5px] text-tagFg bg-tagBg border border-tagLine rounded px-[7px] py-[2px]">
              {t.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
