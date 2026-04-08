import { useState, useCallback } from "react"
import { Layout }    from "./components/Layout"
import { SearchBar } from "./components/SearchBar"
import { Sidebar }   from "./components/Sidebar"
import { TermCard }  from "./components/TermCard"
import { TermDetail } from "./components/TermDetail"
import { EmptyState } from "./components/EmptyState"
import { useCategories } from "./hooks/useCategories"
import { useTags }       from "./hooks/useTags"
import { useTerms }      from "./hooks/useTerms"
import { api }           from "./api/client"
import type { TermDetail as TermDetailType } from "./types"

type View = "terms" | "stats" | "form"

export default function App() {
  const [search,           setSearch]           = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTag,      setSelectedTag]      = useState<string | null>(null)
  const [favoritesOnly,    setFavoritesOnly]    = useState(false)
  const [selectedSlug,     setSelectedSlug]     = useState<string | null>(null)
  const [expandedTerm,     setExpandedTerm]     = useState<TermDetailType | null>(null)
  const [view,             setView]             = useState<View>("terms")
  const [_editingSlug,     setEditingSlug]      = useState<string | null | "new">(null)

  const { categories } = useCategories()
  const { tags }       = useTags()
  const { terms, loading, error, refetch } = useTerms({
    search, category: selectedCategory, tag: selectedTag, favoritesOnly,
  })

  const handleSelectTerm = useCallback(async (slug: string) => {
    setSelectedSlug(slug)
    const detail = await api.terms.get(slug)
    setExpandedTerm(detail)
    setView("terms")
  }, [])

  const handleToggleFavorite = useCallback(async (slug: string) => {
    await api.terms.toggleFavorite(slug)
    refetch()
    if (expandedTerm?.slug === slug) {
      const updated = await api.terms.get(slug)
      setExpandedTerm(updated)
    }
  }, [expandedTerm, refetch])

  const handleDelete = useCallback(async (slug: string) => {
    if (!confirm(`Delete "${slug}"?`)) return
    await api.terms.delete(slug)
    setSelectedSlug(null)
    setExpandedTerm(null)
    refetch()
  }, [refetch])

  const sidebar = (
    <div>
      <SearchBar value={search} onChange={setSearch} />
      <Sidebar
        categories={categories}
        tags={tags}
        selectedCategory={selectedCategory}
        selectedTag={selectedTag}
        favoritesOnly={favoritesOnly}
        onSelectCategory={setSelectedCategory}
        onSelectTag={setSelectedTag}
        onToggleFavorites={() => setFavoritesOnly(v => !v)}
        onShowStats={() => setView("stats")}
        onNewTerm={() => { setEditingSlug("new"); setView("form") }}
      />
    </div>
  )

  return (
    <Layout sidebar={sidebar}>
      {view === "terms" && (
        <div className="flex h-full">
          {/* Term list */}
          <div className="w-80 flex-shrink-0 border-r border-border overflow-y-auto">
            {loading && <p className="p-4 text-muted text-sm">Loading…</p>}
            {error   && <p className="p-4 text-red-400 text-sm">{error}</p>}
            {!loading && terms.length === 0 && <EmptyState query={search} />}
            {terms.map(term => (
              <TermCard
                key={term.id}
                term={term}
                isSelected={selectedSlug === term.slug}
                onClick={() => handleSelectTerm(term.slug)}
                onToggleFavorite={() => handleToggleFavorite(term.slug)}
              />
            ))}
          </div>

          {/* Term detail */}
          <div className="flex-1 overflow-y-auto">
            {expandedTerm ? (
              <TermDetail
                term={expandedTerm}
                onEdit={() => { setEditingSlug(expandedTerm.slug); setView("form") }}
                onDelete={() => handleDelete(expandedTerm.slug)}
                onToggleFavorite={() => handleToggleFavorite(expandedTerm.slug)}
                onSelectRelated={handleSelectTerm}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted text-sm">
                Select a term to view its definition
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}
