import type { Category, Tag } from "../types"

interface SidebarProps {
  categories: Category[]
  selectedCategory: string | null
  favoritesOnly: boolean
  onSelectCategory: (slug: string | null) => void
  onToggleFavorites: () => void
  tags?: Tag[]
  selectedTag?: string | null
  onSelectTag?: (name: string | null) => void
}

export function Sidebar({
  categories, selectedCategory, favoritesOnly, onSelectCategory, onToggleFavorites,
  tags, selectedTag, onSelectTag,
}: SidebarProps) {
  return (
    <nav className="h-full overflow-y-auto pt-[18px] pb-10">
      <p className="px-4 pb-[10px] text-[10.5px] tracking-[.14em] text-fg3 uppercase">Filters</p>
      <div className="px-2 mb-1">
        <button
          onClick={onToggleFavorites}
          className={`w-full text-left px-[10px] py-2 rounded-md text-[13px] transition-colors
            ${favoritesOnly
              ? "bg-bg3 border border-accent text-accent"
              : "border border-transparent text-fg2 hover:bg-bg3"}`}
        >
          ★ Favorites only
        </button>
      </div>

      <div className="h-px bg-line my-4 mx-4" />

      <p className="px-4 pb-[10px] text-[10.5px] tracking-[.14em] text-fg3 uppercase">Categories</p>
      <div className="px-2 flex flex-col gap-px">
        <button
          onClick={() => onSelectCategory(null)}
          className={`w-full flex justify-between px-[10px] py-2 rounded-md text-[13px] transition-colors
            border-l-2
            ${!selectedCategory ? "bg-bg3 text-fg border-accent" : "text-fg2 border-transparent hover:bg-bg3"}`}
        >
          <span>All</span>
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.slug === selectedCategory ? null : cat.slug)}
            className={`w-full flex justify-between px-[10px] py-2 rounded-md text-[13px] transition-colors
              border-l-2
              ${selectedCategory === cat.slug ? "bg-bg3 text-fg border-accent" : "text-fg2 border-transparent hover:bg-bg3"}`}
          >
            <span>{cat.name}</span>
            <span className="text-[11px] text-fg3">{cat.term_count}</span>
          </button>
        ))}
      </div>

      {/* Legacy tags section — only rendered for the Articles call site (Task 9).
          Browse's three-pane call site omits `tags`, matching the new spec (no tag
          filter in Pane A; tags live on cards/reader instead). */}
      {tags && tags.length > 0 && onSelectTag && (
        <>
          <div className="h-px bg-line my-4 mx-4" />
          <p className="px-4 pb-[10px] text-[10.5px] tracking-[.14em] text-fg3 uppercase">Tags</p>
          <div className="px-3 flex flex-wrap gap-1">
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => onSelectTag(tag.name === selectedTag ? null : tag.name)}
                className={`px-2 py-0.5 rounded text-xs transition-colors
                  ${selectedTag === tag.name
                    ? "bg-accent/20 text-accent border border-accent/30"
                    : "bg-codeBg text-fg3 border border-line hover:text-fg"}`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </>
      )}
    </nav>
  )
}
