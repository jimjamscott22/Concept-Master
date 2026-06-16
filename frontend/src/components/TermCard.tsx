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
      className={`group card-hover px-4 py-3 border-b border-border cursor-pointer
        hover:bg-surface
        ${isSelected ? "bg-surface border-l-2 border-l-accent" : "border-l-2 border-l-transparent"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-mono font-medium text-sm text-text truncate">{term.name}</h3>
          <p className="text-xs text-muted mt-0.5 leading-relaxed line-clamp-2">{preview}…</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5">
          {hasVisual && (
            <span
              title="Includes concept visual"
              aria-label="Includes concept visual"
              className="rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent"
            >
              Visual
            </span>
          )}
          <button
            onClick={e => { e.stopPropagation(); onToggleFavorite() }}
            className={`text-sm transition-colors
              ${term.is_favorite ? "text-green" : "text-muted hover:text-green"}`}
          >
            {term.is_favorite ? "★" : "☆"}
          </button>
        </div>
      </div>
      {term.categories.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {term.categories.map(c => (
            <span key={c.id} className="text-xs bg-code border border-border text-muted px-1.5 py-0.5 rounded">
              {c.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
