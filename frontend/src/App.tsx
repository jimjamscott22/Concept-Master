import { useState, useCallback, useEffect, useRef } from "react"
import useSWR, { mutate } from "swr"
import { Layout }    from "./components/Layout"
import { SearchBar } from "./components/SearchBar"
import { Sidebar }   from "./components/Sidebar"
import { HeaderControls } from "./components/HeaderControls"
import { BrowseNav } from "./components/BrowseNav"
import { CommandPalette } from "./components/CommandPalette"
import { CategoryChipRail } from "./components/CategoryChipRail"
import { JumpToTermPill } from "./components/JumpToTermPill"
import { TermCard }  from "./components/TermCard"
import { TermDetail } from "./components/TermDetail"
import { TermForm }   from "./components/TermForm"
import { StatsPanel } from "./components/StatsPanel"
import { ReviewPanel } from "./components/ReviewPanel"
import { StudyPanel } from "./components/StudyPanel"
import { ArticleCard } from "./components/ArticleCard"
import { ArticleDetail } from "./components/ArticleDetail"
import { ArticleForm } from "./components/ArticleForm"
import { EmptyState } from "./components/EmptyState"
import { DiagramPage } from "./components/DiagramPage"
import { useUiPrefs } from "./hooks/useUiPrefs"
import { useCategories } from "./hooks/useCategories"
import { useTags }       from "./hooks/useTags"
import { useTerms }      from "./hooks/useTerms"
import { useArticles }   from "./hooks/useArticles"
import { api }           from "./api/client"
import type {
  TermDetail as TermDetailType, TermCreatePayload,
  ArticleDetail as ArticleDetailType, ArticleCreatePayload,
} from "./types"

type View = "terms" | "diagram" | "stats" | "form" | "review" | "study" | "articles" | "article-form"

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
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(null)
  const [expandedArticle,  setExpandedArticle]  = useState<ArticleDetailType | null>(null)
  const [editingArticleSlug, setEditingArticleSlug] = useState<string | null | "new">(null)
  const [showArticleDetail, setShowArticleDetail] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const { theme, setTheme, layout, setLayout, typeMode, setTypeMode } = useUiPrefs()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteQuery, setPaletteQuery] = useState("")

  const openPalette = useCallback(() => { setPaletteQuery(""); setPaletteOpen(true) }, [])
  const closePalette = useCallback(() => { setPaletteOpen(false); setPaletteQuery("") }, [])

  const { data: streakData } = useSWR("/review/streak", api.review.streak)
  const dueCount = streakData?.today_due ?? 0
  const refetchDueCount = useCallback(() => mutate("/review/streak"), [])

  const isFormView = view === "form" || view === "article-form"

  const { data: allTermsData } = useSWR(isFormView ? "/terms/summaries" : null, api.terms.summaries)
  const allTerms = allTermsData ?? []
  const refetchTermSummaries = useCallback(() => mutate("/terms/summaries"), [])

  const { data: allArticlesData } = useSWR(isFormView ? "/articles/summaries" : null, api.articles.summaries)
  const allArticles = allArticlesData ?? []
  const refetchArticleSummaries = useCallback(() => mutate("/articles/summaries"), [])

  const { categories } = useCategories()
  const { tags }       = useTags()
  const { terms, loading, error, refetch } = useTerms({
    search, category: selectedCategory, favoritesOnly,
    enabled: view === "terms" || view === "form"
  })
  const {
    articles, loading: articlesLoading, error: articlesError, refetch: refetchArticles,
  } = useArticles({
    search, category: selectedCategory, tag: selectedTag,
    enabled: view === "articles" || view === "article-form"
  })

  const handleSelectTerm = useCallback(async (slug: string) => {
    setSelectedSlug(slug)
    const detail = await api.terms.get(slug)
    setExpandedTerm(detail)
    setView("terms")
    setShowDetail(true)
  }, [])

  const handleSelectArticle = useCallback(async (slug: string) => {
    setSelectedArticleSlug(slug)
    const detail = await api.articles.get(slug)
    setExpandedArticle(detail)
    setView("articles")
    setShowArticleDetail(true)
  }, [])

  const handleSaveArticle = useCallback(async (payload: ArticleCreatePayload) => {
    if (editingArticleSlug === "new") {
      const created = await api.articles.create(payload)
      setEditingArticleSlug(null)
      setView("articles")
      refetchArticles()
      refetchArticleSummaries()
      await handleSelectArticle(created.slug)
    } else if (editingArticleSlug) {
      const updated = await api.articles.update(editingArticleSlug, payload)
      setEditingArticleSlug(null)
      setView("articles")
      refetchArticles()
      refetchArticleSummaries()
      setExpandedArticle(updated)
      setSelectedArticleSlug(updated.slug)
    }
  }, [editingArticleSlug, refetchArticles, refetchArticleSummaries, handleSelectArticle])

  const handleTogglePublish = useCallback(async (slug: string) => {
    await api.articles.togglePublish(slug)
    refetchArticles()
    if (expandedArticle?.slug === slug) {
      const updated = await api.articles.get(slug)
      setExpandedArticle(updated)
    }
  }, [expandedArticle, refetchArticles])

  const handleDeleteArticle = useCallback(async (slug: string) => {
    if (!confirm(`Delete "${slug}"?`)) return
    await api.articles.delete(slug)
    setSelectedArticleSlug(null)
    setExpandedArticle(null)
    setShowArticleDetail(false)
    refetchArticles()
    refetchArticleSummaries()
  }, [refetchArticles, refetchArticleSummaries])

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
      refetchTermSummaries()
      await handleSelectTerm(created.slug)
    } else if (editingSlug) {
      const updated = await api.terms.update(editingSlug, payload)
      setEditingSlug(null)
      setView("terms")
      refetch()
      refetchTermSummaries()
      setExpandedTerm(updated)
    }
  }, [editingSlug, refetch, refetchTermSummaries, handleSelectTerm])

  const handleDelete = useCallback(async (slug: string) => {
    if (!confirm(`Delete "${slug}"?`)) return
    await api.terms.delete(slug)
    setSelectedSlug(null)
    setExpandedTerm(null)
    setShowDetail(false)
    refetch()
    refetchTermSummaries()
  }, [refetch, refetchTermSummaries])

  const isArticleView = view === "articles" || view === "article-form"

  const handleExport = useCallback(async () => {
    const data = isArticleView ? await api.articles.export() : await api.terms.export()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const kind = isArticleView ? "articles" : "export"
    a.download = `concept-master-${kind}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [isArticleView])

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const items = JSON.parse(text)
      if (isArticleView) {
        const result = await api.articles.import(items)
        alert(`Imported ${result.imported} articles, skipped ${result.skipped} duplicates.`)
        refetchArticles()
        refetchArticleSummaries()
      } else {
        const result = await api.terms.import(items)
        alert(`Imported ${result.imported} terms, skipped ${result.skipped} duplicates.`)
        refetch()
        refetchTermSummaries()
      }
    } catch (err) {
      alert(`Import failed: ${err instanceof Error ? err.message : "Invalid file"}`)
    } finally {
      e.target.value = ""
    }
  }, [isArticleView, refetch, refetchTermSummaries, refetchArticles, refetchArticleSummaries])

  const handlePaletteSelect = useCallback((slug: string) => {
    closePalette()
    handleSelectTerm(slug)
  }, [closePalette, handleSelectTerm])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        openPalette()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [openPalette])

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

  const isBrowseTermsView = view === "terms" || view === "form"
  const isArticleSidebarView = view === "articles" || view === "article-form"

  const sidebar = isBrowseTermsView && layout === "three" ? (
    <Sidebar
      categories={categories}
      selectedCategory={selectedCategory}
      favoritesOnly={favoritesOnly}
      onSelectCategory={setSelectedCategory}
      onToggleFavorites={() => setFavoritesOnly(v => !v)}
    />
  ) : isArticleSidebarView ? (
    <Sidebar
      categories={categories}
      selectedCategory={selectedCategory}
      favoritesOnly={favoritesOnly}
      onSelectCategory={setSelectedCategory}
      onToggleFavorites={() => setFavoritesOnly(v => !v)}
      tags={tags}
      selectedTag={selectedTag}
      onSelectTag={setSelectedTag}
    />
  ) : null

  const isBrowseView = view === "terms" || view === "form" || view === "diagram"

  const headerNav = isBrowseView ? (
    <div className="flex items-center gap-3 h-full pl-3 pr-1 flex-1 min-w-0">
      <button
        onClick={openPalette}
        className="w-[220px] min-w-[150px] flex-shrink h-[34px] px-3 bg-bg border border-line rounded-[7px]
                   text-[13px] text-fg3 flex items-center gap-2 hover:border-accent hover:text-fg2 transition-colors"
      >
        <span>⌕</span>
        <span className="flex-1 text-left">Search terms…</span>
        <span className="text-[10.5px] border border-line rounded px-[5px] py-px">CTRL+K</span>
      </button>
      <BrowseNav view={view} dueCount={dueCount} onNavigate={(v) => { if (v === "terms") setShowDetail(false); setView(v) }} />
      <HeaderControls
        layout={layout} onLayoutChange={setLayout}
        typeMode={typeMode} onTypeModeChange={setTypeMode}
        theme={theme} onThemeChange={setTheme}
        onNewTerm={() => { setEditingSlug("new"); setView("form") }}
        newLabel="Create a new term"
        onExport={handleExport}
        onImport={handleImport}
      />
    </div>
  ) : (
    <div className="flex items-center gap-2 h-full pl-3 pr-1 flex-1">
      <SearchBar value={search} onChange={setSearch} placeholder={
        (view === "articles" || view === "article-form") ? "Search articles…" : "Search…"
      } />
      <span className="h-5 w-px bg-line flex-shrink-0 mx-1" aria-hidden />
      <BrowseNav view={view} dueCount={dueCount} onNavigate={(v) => { if (v === "articles") setShowArticleDetail(false); setView(v) }} />
      <HeaderControls
        layout={layout} onLayoutChange={setLayout}
        typeMode={typeMode} onTypeModeChange={setTypeMode}
        theme={theme} onThemeChange={setTheme}
        onNewTerm={() => {
          if (isArticleView) { setExpandedArticle(null); setEditingArticleSlug("new"); setView("article-form") }
          else { setEditingSlug("new"); setView("form") }
        }}
        newLabel={isArticleView ? "New Article" : "Create a new term"}
        onExport={handleExport}
        onImport={handleImport}
      />
    </div>
  )

  return (
    <>
    <Layout sidebar={sidebar} header={headerNav}>
      {view === "terms" && (
        <div className="flex h-full relative">
          {layout === "two" && (
            <div className={`w-[380px] flex-shrink-0 border-r border-line flex flex-col overflow-hidden ${showDetail ? "hidden md:flex" : "flex"}`}>
              <CategoryChipRail
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                totalCount={terms.length}
              />
              <div ref={listRef} className="flex-1 overflow-y-auto">
                {loading && <p className="p-4 text-fg3 text-sm">Loading…</p>}
                {error && <p className="p-4 text-red-400 text-sm">{error}</p>}
                {!loading && terms.length === 0 && <EmptyState query={search} />}
                {terms.map(term => (
                  <TermCard key={term.id} term={term} isSelected={selectedSlug === term.slug}
                    onClick={() => handleSelectTerm(term.slug)} onToggleFavorite={() => handleToggleFavorite(term.slug)} />
                ))}
              </div>
            </div>
          )}

          {layout === "three" && (
            <div ref={listRef} className={`w-[336px] flex-shrink-0 border-r border-line bg-bg2 overflow-y-auto ${showDetail ? "hidden md:block" : "block"}`}>
              <div className="flex justify-between px-4 py-[11px] border-b border-line text-[11px] tracking-[.1em] text-fg3">
                <span>{terms.length} TERMS</span>
                <span>{selectedCategory ? categories.find(c => c.slug === selectedCategory)?.name.toUpperCase() : "ALL CATEGORIES"}</span>
              </div>
              {loading && <p className="p-4 text-fg3 text-sm">Loading…</p>}
              {error && <p className="p-4 text-red-400 text-sm">{error}</p>}
              {!loading && terms.length === 0 && <EmptyState query={search} />}
              {terms.map(term => (
                <TermCard key={term.id} term={term} isSelected={selectedSlug === term.slug}
                  onClick={() => handleSelectTerm(term.slug)} onToggleFavorite={() => handleToggleFavorite(term.slug)} />
              ))}
            </div>
          )}

          <div className={`flex-1 overflow-y-auto ${showDetail || layout !== "three" ? "block" : "hidden md:block"}`}>
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
              <div className="flex items-center justify-center h-full text-fg3 text-sm">Select a term to view its definition</div>
            )}
          </div>

          {layout === "center" && <JumpToTermPill onClick={openPalette} />}
        </div>
      )}

      {view === "diagram" && (
        <DiagramPage
          selectedSlug={selectedSlug}
          onSelectTerm={(slug) => { setView("terms"); handleSelectTerm(slug) }}
        />
      )}

      {view === "articles" && (
        <div className="flex h-full">
          {/* Article list */}
          <div
            className={`w-80 flex-shrink-0 border-r border-border overflow-y-auto ${showArticleDetail ? "hidden md:block" : "block"}`}
          >
            {articlesLoading && <p className="p-4 text-muted text-sm">Loading…</p>}
            {articlesError   && <p className="p-4 text-red-400 text-sm">{articlesError}</p>}
            {!articlesLoading && articles.length === 0 && <EmptyState query={search} />}
            {articles.map(article => (
              <ArticleCard
                key={article.id}
                article={article}
                isSelected={selectedArticleSlug === article.slug}
                onClick={() => handleSelectArticle(article.slug)}
              />
            ))}
          </div>

          {/* Article detail */}
          <div className={`flex-1 overflow-y-auto ${showArticleDetail ? "block" : "hidden md:block"}`}>
            {expandedArticle ? (
              <ArticleDetail
                article={expandedArticle}
                onEdit={() => { setEditingArticleSlug(expandedArticle.slug); setView("article-form") }}
                onDelete={() => handleDeleteArticle(expandedArticle.slug)}
                onTogglePublish={() => handleTogglePublish(expandedArticle.slug)}
                onSelectRelatedTerm={(slug) => { setShowArticleDetail(false); handleSelectTerm(slug) }}
                onSelectRelatedArticle={handleSelectArticle}
                onBack={() => setShowArticleDetail(false)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted text-sm">
                Select an article to read
              </div>
            )}
          </div>
        </div>
      )}

      {view === "article-form" && (
        <ArticleForm
          key={editingArticleSlug ?? "new"}
          initial={editingArticleSlug !== "new" ? expandedArticle : null}
          categories={categories}
          allTags={tags}
          allTerms={allTerms}
          allArticles={allArticles}
          onSave={handleSaveArticle}
          onCancel={() => setView("articles")}
        />
      )}

      {view === "stats" && (
        <StatsPanel
          onSelectTerm={(slug) => {
            setView("terms")
            handleSelectTerm(slug)
          }}
          onStartReview={() => setView("review")}
        />
      )}

      {view === "review" && (
        <ReviewPanel
          onDone={() => { setView("terms"); refetchDueCount() }}
          onReviewSubmitted={refetchDueCount}
        />
      )}

      {view === "study" && (
        <StudyPanel onDone={() => setView("terms")} />
      )}

      {view === "form" && (
        <TermForm
          key={editingSlug ?? "new"}
          initial={editingSlug !== "new" ? expandedTerm : null}
          categories={categories}
          allTags={tags}
          allTerms={allTerms}
          onSave={handleSaveTerm}
          onCancel={() => setView("terms")}
        />
      )}
    </Layout>
    <CommandPalette
      open={paletteOpen}
      query={paletteQuery}
      onQueryChange={setPaletteQuery}
      onClose={closePalette}
      onSelect={handlePaletteSelect}
    />
    </>
  )
}
