import type { Article } from "../types"

interface ArticleCardProps {
  article: Article
  isSelected: boolean
  onClick: () => void
}

export function ArticleCard({ article, isSelected, onClick }: ArticleCardProps) {
  const preview = (article.summary ?? article.body).replace(/[*_`#[\]]/g, "").slice(0, 120)

  return (
    <div
      data-slug={article.slug}
      onClick={onClick}
      className={`group card-hover px-4 py-3 border-b border-border cursor-pointer
        hover:bg-surface
        ${isSelected ? "bg-surface border-l-2 border-l-accent" : "border-l-2 border-l-transparent"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-mono font-medium text-sm text-text truncate">{article.title}</h3>
          {article.subtitle && (
            <p className="text-xs text-muted/80 mt-0.5 truncate italic">{article.subtitle}</p>
          )}
          <p className="text-xs text-muted mt-0.5 leading-relaxed line-clamp-2">{preview}…</p>
        </div>
        {!article.is_published && (
          <span className="flex-shrink-0 text-[9px] font-mono uppercase tracking-wide
                           px-1.5 py-0.5 rounded-sm border border-border text-muted">
            Draft
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1 mt-2">
        <span className="text-[10px] font-mono text-muted/70">{article.reading_time_minutes} min read</span>
        {article.categories.map(c => (
          <span key={c.id} className="text-xs bg-code border border-border text-muted px-1.5 py-0.5 rounded">
            {c.name}
          </span>
        ))}
      </div>
    </div>
  )
}
