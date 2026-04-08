import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Highlight, themes } from "prism-react-renderer"
import type { TermDetail } from "../types"

interface TermDetailProps {
  term: TermDetail
  onEdit: () => void
  onDelete: () => void
  onToggleFavorite: () => void
  onSelectRelated: (slug: string) => void
}

export function TermDetail({ term, onEdit, onDelete, onToggleFavorite, onSelectRelated }: TermDetailProps) {
  return (
    <article className="max-w-3xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h2 className="font-mono font-bold text-xl text-text">{term.name}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFavorite}
            className={`text-lg transition-colors ${term.is_favorite ? "text-green" : "text-muted hover:text-green"}`}
          >
            {term.is_favorite ? "★" : "☆"}
          </button>
          <button
            onClick={onEdit}
            className="text-xs px-3 py-1.5 border border-border rounded-md text-muted
                       hover:border-accent hover:text-accent transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-xs px-3 py-1.5 border border-border rounded-md text-muted
                       hover:border-red-500 hover:text-red-400 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Category badges */}
      {term.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {term.categories.map(c => (
            <span key={c.id} className="text-xs bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded-full">
              {c.name}
            </span>
          ))}
        </div>
      )}

      {/* Definition */}
      <div className="prose prose-invert max-w-none text-sm leading-relaxed
                      [&_code]:font-mono [&_code]:text-accent [&_code]:bg-code [&_code]:px-1 [&_code]:rounded
                      [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-1
                      [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-1">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{term.definition}</ReactMarkdown>
      </div>

      {/* Code block */}
      {term.example_code && (
        <div className="mt-6">
          <p className="text-xs text-muted mb-2 font-mono uppercase tracking-wider">
            {term.code_lang ?? "code"}
          </p>
          <Highlight
            theme={themes.vsDark}
            code={term.example_code}
            language={(term.code_lang ?? "text") as string}
          >
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre
                className={`${className} rounded-lg p-4 overflow-x-auto text-xs leading-relaxed`}
                style={{ ...style, background: "#1c2128" }}
              >
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line })}>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        </div>
      )}

      {/* Tags */}
      {term.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-6">
          {term.tags.map(t => (
            <span key={t.id} className="text-xs bg-code border border-border text-muted px-2 py-0.5 rounded font-mono">
              #{t.name}
            </span>
          ))}
        </div>
      )}

      {/* Related terms */}
      {term.related_terms.length > 0 && (
        <div className="mt-6">
          <p className="text-xs text-muted uppercase tracking-wider mb-2">Related</p>
          <div className="flex flex-wrap gap-2">
            {term.related_terms.map(r => (
              <button
                key={r.id}
                onClick={() => onSelectRelated(r.slug)}
                className="text-sm text-accent hover:underline font-mono"
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Meta */}
      <p className="text-xs text-muted mt-8 font-mono">
        Added {new Date(term.created_at).toLocaleDateString()}
        {term.updated_at !== term.created_at &&
          ` · Updated ${new Date(term.updated_at).toLocaleDateString()}`}
      </p>
    </article>
  )
}
