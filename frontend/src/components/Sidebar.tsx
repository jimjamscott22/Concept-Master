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
}

export function Sidebar({
  categories, tags, selectedCategory, selectedTag,
  favoritesOnly,
  onSelectCategory, onSelectTag, onToggleFavorites,
}: SidebarProps) {
  return (
    <nav className="flex flex-col h-full text-sm">
      {/* Filters header */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-[10px] text-muted uppercase tracking-[0.2em] font-mono">
          Filters
        </p>
      </div>

      {/* Favorites */}
      <div className="px-3 pb-3 border-b border-border">
        <button
          onClick={onToggleFavorites}
          className={`w-full text-left px-3 py-2 rounded-md transition-colors
            flex items-center gap-2
            ${favoritesOnly ? "bg-green/10 text-green" : "text-muted hover:bg-surface hover:text-text"}`}
        >
          <span className={favoritesOnly ? "text-green" : "text-muted/70"}>★</span>
          <span>Favorites only</span>
        </button>
      </div>

      {/* Categories */}
      <div className="px-3 py-3 border-b border-border flex-shrink-0">
        <p className="text-[10px] text-muted uppercase tracking-[0.2em] font-mono mb-2 px-3">
          Categories
        </p>
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
        <p className="text-[10px] text-muted uppercase tracking-[0.2em] font-mono mb-2 px-3">
          Tags
        </p>
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
