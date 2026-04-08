import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { TermDetail, Category, Tag, TermCreatePayload } from "../types"

const CODE_LANGS = ["python", "java", "javascript", "typescript", "sql", "bash", "c", "json"]

interface TermFormProps {
  initial?: TermDetail | null
  categories: Category[]
  allTags: Tag[]
  onSave: (payload: TermCreatePayload) => Promise<void>
  onCancel: () => void
}

export function TermForm({ initial, categories, allTags, onSave, onCancel }: TermFormProps) {
  const [name,        setName]        = useState(initial?.name        ?? "")
  const [definition,  setDefinition]  = useState(initial?.definition  ?? "")
  const [exampleCode, setExampleCode] = useState(initial?.example_code ?? "")
  const [codeLang,    setCodeLang]    = useState(initial?.code_lang    ?? "")
  const [catIds,      setCatIds]      = useState<number[]>(initial?.categories.map(c => c.id) ?? [])
  const [tagInput,    setTagInput]    = useState(initial?.tags.map(t => t.name).join(", ") ?? "")
  const [relatedIds,  setRelatedIds]  = useState<number[]>(initial?.related_terms?.map(r => r.id) ?? [])
  const [preview,     setPreview]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  // relatedIds is stored but not exposed in the form UI (no multi-select widget yet)
  void relatedIds
  void setRelatedIds

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !definition.trim()) {
      setError("Name and definition are required.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const tag_names = tagInput.split(",").map(t => t.trim()).filter(Boolean)
      await onSave({
        name: name.trim(),
        definition,
        example_code: exampleCode.trim() || null,
        code_lang: codeLang || null,
        category_ids: catIds,
        tag_names,
        related_term_ids: relatedIds,
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
        {initial ? `Edit: ${initial.name}` : "New Term"}
      </h2>

      {error && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2">{error}</p>
      )}

      {/* Name */}
      <label className="block mb-4">
        <span className="text-xs text-muted uppercase tracking-wider">Name *</span>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="mt-1 w-full bg-code border border-border rounded-md px-3 py-2 text-sm text-text
                     focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          placeholder="e.g. Binary Search Tree"
        />
      </label>

      {/* Definition */}
      <label className="block mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted uppercase tracking-wider">Definition * (Markdown)</span>
          <button type="button" onClick={() => setPreview(v => !v)}
                  className="text-xs text-accent hover:underline">
            {preview ? "Edit" : "Preview"}
          </button>
        </div>
        {preview ? (
          <div className="min-h-32 bg-code border border-border rounded-md p-3 text-sm text-text
                          prose prose-invert max-w-none [&_code]:font-mono [&_code]:text-accent">
            <ReactMarkdownPreview content={definition} />
          </div>
        ) : (
          <textarea
            value={definition}
            onChange={e => setDefinition(e.target.value)}
            rows={8}
            className="w-full bg-code border border-border rounded-md px-3 py-2 text-sm text-text font-mono
                       focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-y"
            placeholder="Markdown supported…"
          />
        )}
      </label>

      {/* Code lang + example */}
      <div className="flex gap-3 mb-4">
        <label className="w-36 flex-shrink-0">
          <span className="text-xs text-muted uppercase tracking-wider">Language</span>
          <select
            value={codeLang}
            onChange={e => setCodeLang(e.target.value)}
            className="mt-1 w-full bg-code border border-border rounded-md px-2 py-2 text-sm text-text
                       focus:outline-none focus:border-accent"
          >
            <option value="">None</option>
            {CODE_LANGS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
        <label className="flex-1">
          <span className="text-xs text-muted uppercase tracking-wider">Example Code</span>
          <textarea
            value={exampleCode}
            onChange={e => setExampleCode(e.target.value)}
            rows={4}
            className="mt-1 w-full bg-code border border-border rounded-md px-3 py-2 text-xs text-text font-mono
                       focus:outline-none focus:border-accent resize-y"
            placeholder="Optional code snippet…"
          />
        </label>
      </div>

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
          list="tags-datalist"
          className="mt-1 w-full bg-code border border-border rounded-md px-3 py-2 text-sm text-text
                     focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          placeholder="interview-prep, exam-review, …"
        />
        <datalist id="tags-datalist">
          {allTags.map(t => <option key={t.id} value={t.name} />)}
        </datalist>
      </label>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-accent text-bg font-medium text-sm rounded-md
                     hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : (initial ? "Save Changes" : "Create Term")}
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

function ReactMarkdownPreview({ content }: { content: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
}
