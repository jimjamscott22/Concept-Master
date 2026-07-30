type View = "terms" | "diagram" | "stats" | "form" | "review" | "study" | "articles" | "article-form"

interface BrowseNavProps {
  view: View
  dueCount: number
  onNavigate: (view: View) => void
}

interface NavItem {
  id: View
  label: string
  num: string
}

const NAV: NavItem[] = [
  { id: "terms",    label: "Browse",   num: "01" },
  { id: "diagram",  label: "Diagram",  num: "02" },
  { id: "articles", label: "Articles", num: "03" },
  { id: "study",    label: "Study",    num: "04" },
  { id: "review",   label: "Review",   num: "05" },
  { id: "stats",    label: "Stats",    num: "06" },
]

export function BrowseNav({ view, dueCount, onNavigate }: BrowseNavProps) {
  return (
    <nav
      className="flex-1 min-w-0 overflow-x-auto flex items-center gap-0.5"
      style={{ scrollbarWidth: "none" }}
    >
      {NAV.map(item => {
        const active = view === item.id
          || (item.id === "terms" && view === "form")
          || (item.id === "articles" && view === "article-form")
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`h-[34px] px-[9px] flex-none whitespace-nowrap rounded-md text-[12.5px] tracking-[.08em]
                        transition-colors
                        ${active ? "bg-bg3 text-fg font-semibold" : "text-fg3 font-normal hover:text-fg"}`}
          >
            <span className={`text-[10.5px] mr-[7px] ${active ? "" : "opacity-50"}`}>{item.num}</span>
            <span className="uppercase">{item.label}</span>
            {item.id === "review" && dueCount > 0 && (
              <span className="ml-2 text-[10px] text-accent2 border border-line rounded-sm px-1 py-px">
                {dueCount > 99 ? "99+" : dueCount}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
