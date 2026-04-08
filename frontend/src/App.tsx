import { useState, useCallback, useEffect, useRef } from "react"
import { Layout }    from "./components/Layout"
import { SearchBar } from "./components/SearchBar"
import { Sidebar }   from "./components/Sidebar"
import { TermCard }  from "./components/TermCard"
import { TermDetail } from "./components/TermDetail"
import { TermForm }   from "./components/TermForm"
import { StatsPanel } from "./components/StatsPanel"
import { EmptyState } from "./components/EmptyState"
import { useCategories } from "./hooks/useCategories"
import { useTags }       from "./hooks/useTags"
import { useTerms }      from "./hooks/useTerms"
import { api }           from "./api/client"
import type { TermDetail as TermDetailType, TermCreatePayload } from "./types"

type View = "terms" | "stats" | "form"

export default function App() {
  const [search,           setSearch]           = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTag,      setSelectedTag]      = useState<string | null>(null)
  const [favoritesOnly,    setFavoritesOnly]    = useState(false)
  const [selectedSlug,     setSelectedSlug]     = useState<string | null>(null)
  const [expandedTerm,     setExpandedTerm]     = useState<TermDetailType | null>(null)
  const [view,             setView]             = useState<View>("terms")
  const [editingSlug,      setEditingSlug]      = useState<string | null | "new">(null)
  const [showDetail,       setShowDetail]       = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

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
    setShowDetail(true)
  }, [])

  const handleToggleFavorite = useCallback(async (slug: string) => {
    await api.terms.toggleFavorite(slug)
    refetch()
    if (expandedTerm?.slug === slug) {
      const updated = await api.terms.get(slug)
      setExpandedTerm(updated)
    }
  }, [expandedTerm, refetch])

  const handleSaveTerm = useCallback(async (payload: TermCreatePayload) => {
    if (editingSlug === "new") {
      const created = await api.terms.create(payload)
      setEditingSlug(null)
      setView("terms")
      refetch()
      await handleSelectTerm(created.slug)
    } else if (editingSlug) {
      const updated = await api.terms.update(editingSlug, payload)
      setEditingSlug(null)
      setView("terms")
      refetch()
      setExpandedTerm(updated)
    }
  }, [editingSlug, refetch, handleSelectTerm])

  const handleDelete = useCallback(async (slug: string) => {
    if (!confirm(`Delete "${slug}"?`)) return
    await api.terms.delete(slug)
    setSelectedSlug(null)
    setExpandedTerm(null)
    setShowDetail(false)
    refetch()
  }, [refetch])

  const handleExport = useCallback(async () => {
    const data = await api.terms.export()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `concept-master-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const items = JSON.parse(text)
    const result = await api.terms.import(items)
    alert(`Imported ${result.imported} terms, skipped ${result.skipped} duplicates.`)
    refetch()
    e.target.value = ""
  }, [refetch])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (view !== "terms") return
      if (document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA") return

      const currentIndex = terms.findIndex(t => t.slug === selectedSlug)

      if (e.key === "ArrowDown") {
        e.preventDefault()
        const next = terms[currentIndex + 1]
        if (next) handleSelectTerm(next.slug)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        const prev = terms[currentIndex - 1]
        if (prev) handleSelectTerm(prev.slug)
      } else if (e.key === "Escape") {
        setSelectedSlug(null)
        setExpandedTerm(null)
        setShowDetail(false)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [view, terms, selectedSlug, handleSelectTerm])

  useEffect(() => {
    if (!selectedSlug || !listRef.current) return
    const el = listRef.current.querySelector(`[data-slug="${selectedSlug}"]`)
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [selectedSlug])

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
        onExport={handleExport}
        onImport={handleImport}
      />
    </div>
  )

  return (
    <Layout sidebar={sidebar}>
      {view === "terms" && (
        <div className="flex h-full">
          {/* Term list */}
          <div
            ref={listRef}
            className={`w-80 flex-shrink-0 border-r border-border overflow-y-auto ${showDetail ? "hidden md:block" : "block"}`}
          >
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
          <div className={`flex-1 overflow-y-auto ${showDetail ? "block" : "hidden md:block"}`}>
            {expandedTerm ? (
              <TermDetail
                term={expandedTerm}
                onEdit={() => { setEditingSlug(expandedTerm.slug); setView("form") }}
                onDelete={() => handleDelete(expandedTerm.slug)}
                onToggleFavorite={() => handleToggleFavorite(expandedTerm.slug)}
                onSelectRelated={handleSelectTerm}
                onBack={() => setShowDetail(false)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted text-sm">
                Select a term to view its definition
              </div>
            )}
          </div>
        </div>
      )}

      {view === "stats" && (
        <StatsPanel
          onSelectTerm={(slug) => {
            setView("terms")
            handleSelectTerm(slug)
          }}
        />
      )}

      {view === "form" && (
        <TermForm
          initial={editingSlug !== "new" ? expandedTerm : null}
          categories={categories}
          allTags={tags}
          onSave={handleSaveTerm}
          onCancel={() => setView("terms")}
        />
      )}
    </Layout>
  )
}
