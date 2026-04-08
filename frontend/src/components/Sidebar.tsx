import type { Category, Tag } from "../types"

interface SidebarProps {
  categories: Category[]
  tags: Tag[]
  selectedCategory: string | null
  selectedTag: string | null
  favoritesOnly: boolean
  onSelectCategory: (slug: string | null) => void
  onSelectTag: (name: string | null) => void
  onToggleFavorites: () => void
  onShowStats: () => void
  onNewTerm: () => void
}

export function Sidebar({
  categories, tags, selectedCategory, selectedTag,
  favoritesOnly, onSelectCategory, onSelectTag,
  onToggleFavorites, onShowStats, onNewTerm,
}: SidebarProps) {
  return (
    <nav className="flex flex-col h-full text-sm">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border">
        <h1 className="text-accent font-mono font-bold text-lg tracking-tight">
          &gt; concept-master
        </h1>
      </div>

      {/* Actions */}
      <div className="px-3 py-3 border-b border-border space-y-1">
        <button
          onClick={onNewTerm}
          className="w-full text-left px-3 py-2 rounded-md bg-accent/10 text-accent
                     hover:bg-accent/20 transition-colors font-medium text-xs"
        >
          + New Term
        </button>
        <button
          onClick={onShowStats}
          className="w-full text-left px-3 py-2 rounded-md text-muted
                     hover:bg-surface hover:text-text transition-colors"
        >
          Stats
        </button>
      </div>

      {/* Favorites */}
      <div className="px-3 py-3 border-b border-border">
        <button
          onClick={onToggleFavorites}
          className={`w-full text-left px-3 py-2 rounded-md transition-colors
            ${favoritesOnly ? "bg-green/10 text-green" : "text-muted hover:bg-surface hover:text-text"}`}
        >
          ★ Favorites
        </button>
      </div>

      {/* Categories */}
      <div className="px-3 py-3 border-b border-border overflow-y-auto flex-shrink-0">
        <p className="text-xs text-muted uppercase tracking-widest mb-2 px-3">Categories</p>
        <button
          onClick={() => onSelectCategory(null)}
          className={`w-full text-left px-3 py-1.5 rounded-md transition-colors mb-0.5
            ${!selectedCategory ? "text-accent bg-accent/10" : "text-muted hover:text-text hover:bg-surface"}`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.slug === selectedCategory ? null : cat.slug)}
            className={`w-full text-left px-3 py-1.5 rounded-md transition-colors mb-0.5 flex justify-between
              ${selectedCategory === cat.slug ? "text-accent bg-accent/10" : "text-muted hover:text-text hover:bg-surface"}`}
          >
            <span>{cat.name}</span>
            <span className="text-xs opacity-60">{cat.term_count}</span>
          </button>
        ))}
      </div>

      {/* Tags */}
      <div className="px-3 py-3 overflow-y-auto flex-1">
        <p className="text-xs text-muted uppercase tracking-widest mb-2 px-3">Tags</p>
        <div className="flex flex-wrap gap-1 px-1">
          {tags.map(tag => (
            <button
              key={tag.id}
              onClick={() => onSelectTag(tag.name === selectedTag ? null : tag.name)}
              className={`px-2 py-0.5 rounded text-xs transition-colors
                ${selectedTag === tag.name
                  ? "bg-accent/20 text-accent border border-accent/30"
                  : "bg-code text-muted border border-border hover:text-text"}`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
