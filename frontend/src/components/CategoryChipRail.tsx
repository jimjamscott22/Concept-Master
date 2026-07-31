import type { Category } from "../types"

interface CategoryChipRailProps {
  categories: Category[]
  selectedCategory: string | null
  onSelectCategory: (slug: string | null) => void
  totalCount: number
}

export function CategoryChipRail({ categories, selectedCategory, onSelectCategory, totalCount }: CategoryChipRailProps) {
  return (
    <div className="flex items-center gap-[6px] px-[14px] py-3 border-b border-line bg-bg2 overflow-x-auto">
      <button
        onClick={() => onSelectCategory(null)}
        className={`flex-none px-[11px] py-[5px] rounded-full text-[11.5px] whitespace-nowrap transition-colors
          ${!selectedCategory ? "border border-accent bg-bg3 text-fg" : "border border-line text-fg2"}`}
      >
        All <span className="opacity-55">{totalCount}</span>
      </button>
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onSelectCategory(cat.slug === selectedCategory ? null : cat.slug)}
          className={`flex-none px-[11px] py-[5px] rounded-full text-[11.5px] whitespace-nowrap transition-colors
            ${selectedCategory === cat.slug ? "border border-accent bg-bg3 text-fg" : "border border-line text-fg2"}`}
        >
          {cat.name} <span className="opacity-55">{cat.term_count}</span>
        </button>
      ))}
    </div>
  )
}
