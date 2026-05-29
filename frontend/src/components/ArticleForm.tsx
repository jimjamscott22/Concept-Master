import { useMemo, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type {
  ArticleDetail, Category, Tag, ArticleCreatePayload, TermSummary, ArticleSummary,
} from "../types"

interface ArticleFormProps {
  initial?: ArticleDetail | null
  categories: Category[]
  allTags: Tag[]
  allTerms: TermSummary[]
  allArticles: ArticleSummary[]
  onSave: (payload: ArticleCreatePayload) => Promise<void>
  onCancel: () => void
}

export function ArticleForm({
  initial, categories, allTags, allTerms, allArticles, onSave, onCancel,
}: ArticleFormProps) {
  const [title,    setTitle]    = useState(initial?.title    ?? "")
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "")
  const [body,     setBody]     = useState(initial?.body     ?? "")
  const [catIds,   setCatIds]   = useState<number[]>(initial?.categories.map(c => c.id) ?? [])
  const [tagInput, setTagInput] = useState(initial?.tags.map(t => t.name).join(", ") ?? "")
  const [termIds,  setTermIds]  = useState<number[]>(initial?.related_terms?.map(r => r.id) ?? [])
  const [articleIds, setArticleIds] = useState<number[]>(initial?.related_articles?.map(r => r.id) ?? [])
  const [termQuery,    setTermQuery]    = useState("")
  const [articleQuery, setArticleQuery] = useState("")
  const [preview,  setPreview]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const currentArticleId = initial?.id ?? null

  const selectedTerms = useMemo(() => {
    const initialRelated = new Map(initial?.related_terms.map(t => [t.id, t]) ?? [])
    return termIds.flatMap(id => {
      const term = allTerms.find(t => t.id === id) ?? initialRelated.get(id)
      return term ? [term] : []
    })
  }, [allTerms, initial?.related_terms, termIds])

  const termCandidates = useMemo(() => {
    const selected = new Set(termIds)
    const query = termQuery.trim().toLowerCase()
    return allTerms
      .filter(t => !selected.has(t.id))
      .filter(t => !query || t.name.toLowerCase().includes(query) || t.slug.toLowerCase().includes(query))
      .slice(0, 8)
  }, [allTerms, termIds, termQuery])

  const selectedArticles = useMemo(() => {
    const initialRelated = new Map(initial?.related_articles.map(a => [a.id, a]) ?? [])
    return articleIds.flatMap(id => {
      const article = allArticles.find(a => a.id === id) ?? initialRelated.get(id)
      return article ? [article] : []
    })
  }, [allArticles, initial?.related_articles, articleIds])

  const articleCandidates = useMemo(() => {
    const selected = new Set(articleIds)
    const query = articleQuery.trim().toLowerCase()
    return allArticles
      .filter(a => a.id !== currentArticleId)
      .filter(a => !selected.has(a.id))
      .filter(a => !query || a.title.toLowerCase().includes(query) || a.slug.toLowerCase().includes(query))
      .slice(0, 8)
  }, [allArticles, currentArticleId, articleIds, articleQuery])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) {
      setError("Title and body are required.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const tag_names = tagInput.split(",").map(t => t.trim()).filter(Boolean)
      await onSave({
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        body,
        category_ids: catIds,
        tag_names,
        related_term_ids: termIds,
        related_article_ids: articleIds,
      })
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const toggleCat = (id: number) =>
    setCatIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id])

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-6 py-6">
      <h2 className="font-mono font-bold text-lg text-text mb-6">
        {initial ? `Edit: ${initial.title}` : "New Article"}
      </h2>

      {error && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2">{error}</p>
      )}

      {/* Title */}
      <label className="block mb-4">
        <span className="text-xs text-muted uppercase tracking-wider">Title *</span>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="mt-1 w-full bg-code border border-border rounded-md px-3 py-2 text-sm text-text
                     focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          placeholder="e.g. Understanding Hash Maps"
        />
      </label>

      {/* Subtitle */}
      <label className="block mb-4">
        <span className="text-xs text-muted uppercase tracking-wider">Subtitle</span>
        <input
          value={subtitle}
          onChange={e => setSubtitle(e.target.value)}
          className="mt-1 w-full bg-code border border-border rounded-md px-3 py-2 text-sm text-text
                     focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          placeholder="Optional one-line summary"
        />
      </label>

      {/* Body */}
      <label className="block mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted uppercase tracking-wider">Body * (Markdown)</span>
          <button type="button" onClick={() => setPreview(v => !v)}
                  className="text-xs text-accent hover:underline">
            {preview ? "Edit" : "Preview"}
          </button>
        </div>
        {preview ? (
          <div className="min-h-32 bg-code border border-border rounded-md p-3 text-sm text-text
                          prose prose-invert max-w-none [&_code]:font-mono [&_code]:text-accent">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={16}
            className="w-full bg-code border border-border rounded-md px-3 py-2 text-sm text-text font-mono
                       focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-y"
            placeholder="Markdown supported. Use fenced code blocks for examples…"
          />
        )}
      </label>

      {/* Categories */}
      <div className="mb-4">
        <span className="text-xs text-muted uppercase tracking-wider">Categories</span>
        <div className="flex flex-wrap gap-2 mt-2">
          {categories.map(cat => (
            <label key={cat.id} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={catIds.includes(cat.id)}
                onChange={() => toggleCat(cat.id)}
                className="accent-accent"
              />
              <span className="text-sm text-text">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tags */}
      <label className="block mb-6">
        <span className="text-xs text-muted uppercase tracking-wider">Tags (comma-separated)</span>
        <input
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          list="article-tags-datalist"
          className="mt-1 w-full bg-code border border-border rounded-md px-3 py-2 text-sm text-text
                     focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          placeholder="deep-dive, fundamentals, …"
        />
        <datalist id="article-tags-datalist">
          {allTags.map(t => <option key={t.id} value={t.name} />)}
        </datalist>
      </label>

      {/* Related terms */}
      <RelationPicker
        label="Related terms"
        placeholder="Search terms to relate…"
        query={termQuery}
        onQuery={setTermQuery}
        selected={selectedTerms.map(t => ({ id: t.id, label: t.name }))}
        candidates={termCandidates.map(t => ({ id: t.id, label: t.name }))}
        onAdd={id => { setTermIds(ids => ids.includes(id) ? ids : [...ids, id]); setTermQuery("") }}
        onRemove={id => setTermIds(ids => ids.filter(i => i !== id))}
      />

      {/* Related articles */}
      <RelationPicker
        label="Related articles"
        placeholder="Search articles to relate…"
        query={articleQuery}
        onQuery={setArticleQuery}
        selected={selectedArticles.map(a => ({ id: a.id, label: a.title }))}
        candidates={articleCandidates.map(a => ({ id: a.id, label: a.title }))}
        onAdd={id => { setArticleIds(ids => ids.includes(id) ? ids : [...ids, id]); setArticleQuery("") }}
        onRemove={id => setArticleIds(ids => ids.filter(i => i !== id))}
      />

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-accent text-bg font-medium text-sm rounded-md
                     hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : (initial ? "Save Changes" : "Create Article")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 border border-border text-muted text-sm rounded-md
                     hover:border-accent hover:text-text transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

interface RelationOption {
  id: number
  label: string
}

interface RelationPickerProps {
  label: string
  placeholder: string
  query: string
  onQuery: (q: string) => void
  selected: RelationOption[]
  candidates: RelationOption[]
  onAdd: (id: number) => void
  onRemove: (id: number) => void
}

function RelationPicker({
  label, placeholder, query, onQuery, selected, candidates, onAdd, onRemove,
}: RelationPickerProps) {
  return (
    <div className="mb-6">
      <span className="text-xs text-muted uppercase tracking-wider">{label}</span>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selected.map(opt => (
            <span
              key={opt.id}
              className="inline-flex items-center gap-1.5 text-xs bg-accent/10 text-accent border border-accent/20 px-2 py-1 rounded-full"
            >
              {opt.label}
              <button
                type="button"
                onClick={() => onRemove(opt.id)}
                className="text-muted hover:text-text transition-colors"
                aria-label={`Remove ${opt.label}`}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        value={query}
        onChange={e => onQuery(e.target.value)}
        className="mt-2 w-full bg-code border border-border rounded-md px-3 py-2 text-sm text-text
                   focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        placeholder={placeholder}
      />
      {candidates.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {candidates.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onAdd(opt.id)}
              className="text-xs bg-code border border-border text-muted px-2 py-1 rounded font-mono
                         hover:border-accent hover:text-accent transition-colors"
            >
              + {opt.label}
            </button>
          ))}
        </div>
      ) : query.trim() ? (
        <p className="mt-2 text-xs text-muted">No matches found.</p>
      ) : null}
    </div>
  )
}
