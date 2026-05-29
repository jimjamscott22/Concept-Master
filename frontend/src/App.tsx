import { useState, useCallback, useEffect, useRef } from "react"
import { Layout }    from "./components/Layout"
import { SearchBar } from "./components/SearchBar"
import { Sidebar }   from "./components/Sidebar"
import { SiteHeader } from "./components/SiteHeader"
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
import { useCategories } from "./hooks/useCategories"
import { useTags }       from "./hooks/useTags"
import { useTerms }      from "./hooks/useTerms"
import { useArticles }   from "./hooks/useArticles"
import { api }           from "./api/client"
import type {
  TermDetail as TermDetailType, TermCreatePayload, TermSummary,
  ArticleDetail as ArticleDetailType, ArticleCreatePayload, ArticleSummary,
} from "./types"

type View = "terms" | "stats" | "form" | "review" | "study" | "articles" | "article-form"

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
  const [dueCount,         setDueCount]         = useState(0)
  const [allTerms,         setAllTerms]         = useState<TermSummary[]>([])
  const [allArticles,      setAllArticles]      = useState<ArticleSummary[]>([])
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(null)
  const [expandedArticle,  setExpandedArticle]  = useState<ArticleDetailType | null>(null)
  const [editingArticleSlug, setEditingArticleSlug] = useState<string | null | "new">(null)
  const [showArticleDetail, setShowArticleDetail] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const refetchDueCount = useCallback(() => {
    api.review.streak()
      .then(s => setDueCount(s.today_due))
      .catch(() => { /* badge is best-effort */ })
  }, [])

  useEffect(() => { refetchDueCount() }, [refetchDueCount])

  const refetchTermSummaries = useCallback(() => {
    api.terms.summaries()
      .then(setAllTerms)
      .catch(() => { /* related-term selector is best-effort */ })
  }, [])

  useEffect(() => { refetchTermSummaries() }, [refetchTermSummaries])

  const refetchArticleSummaries = useCallback(() => {
    api.articles.summaries()
      .then(setAllArticles)
      .catch(() => { /* related-article selector is best-effort */ })
  }, [])

  useEffect(() => { refetchArticleSummaries() }, [refetchArticleSummaries])

  const { categories } = useCategories()
  const { tags }       = useTags()
  const { terms, loading, error, refetch } = useTerms({
    search, category: selectedCategory, tag: selectedTag, favoritesOnly,
  })
  const {
    articles, loading: articlesLoading, error: articlesError, refetch: refetchArticles,
  } = useArticles({ search, category: selectedCategory, tag: selectedTag })

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
      />
    </div>
  )

  const headerNav = (
    <SiteHeader
      view={view}
      dueCount={dueCount}
      onNavigate={(v) => {
        if (v === "terms") setShowDetail(false)
        if (v === "articles") setShowArticleDetail(false)
        setView(v)
      }}
      onNewTerm={() => {
        if (isArticleView) {
          setExpandedArticle(null)
          setEditingArticleSlug("new")
          setView("article-form")
        } else {
          setEditingSlug("new")
          setView("form")
        }
      }}
      onExport={handleExport}
      onImport={handleImport}
    />
  )

  return (
    <Layout sidebar={sidebar} header={headerNav}>
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
  )
}
