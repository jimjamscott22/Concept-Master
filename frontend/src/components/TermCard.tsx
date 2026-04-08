import type { Term } from "../types"

interface TermCardProps {
  term: Term
  isSelected: boolean
  onClick: () => void
  onToggleFavorite: () => void
}

export function TermCard({ term, isSelected, onClick, onToggleFavorite }: TermCardProps) {
  const preview = term.definition.replace(/[*_`#\[\]]/g, "").slice(0, 120)

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
        <button
          onClick={e => { e.stopPropagation(); onToggleFavorite() }}
          className={`flex-shrink-0 text-sm transition-colors
            ${term.is_favorite ? "text-green" : "text-muted hover:text-green"}`}
        >
          {term.is_favorite ? "★" : "☆"}
        </button>
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
