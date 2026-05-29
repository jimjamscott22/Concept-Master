import { isValidElement } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Highlight, themes } from "prism-react-renderer"
import type { ArticleDetail } from "../types"

interface ArticleDetailProps {
  article: ArticleDetail
  onEdit: () => void
  onDelete: () => void
  onTogglePublish: () => void
  onSelectRelatedTerm: (slug: string) => void
  onSelectRelatedArticle: (slug: string) => void
  onBack: () => void
}

function CodeCard({ code, language, className = "my-4" }: { code: string; language?: string; className?: string }) {
  const resolvedLanguage = (language ?? "text").toLowerCase()

  return (
    <div className={className}>
      <p className="text-xs text-muted mb-2 font-mono uppercase tracking-wider">{resolvedLanguage}</p>
      <Highlight theme={themes.vsDark} code={code} language={resolvedLanguage}>
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
  )
}

export function ArticleDetail({
  article, onEdit, onDelete, onTogglePublish,
  onSelectRelatedTerm, onSelectRelatedArticle, onBack,
}: ArticleDetailProps) {
  return (
    <article className="fade-in max-w-3xl mx-auto px-6 py-6">
      <button onClick={onBack} className="md:hidden mb-4 text-muted text-sm hover:text-text transition-colors">← Back</button>

      {/* Header */}
      <div className="flex items-start justify-between mb-2 gap-4">
        <div className="min-w-0">
          <h2 className="font-mono font-bold text-xl text-text">{article.title}</h2>
          {article.subtitle && (
            <p className="text-sm text-muted mt-1 italic">{article.subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onTogglePublish}
            className={`text-xs px-3 py-1.5 border rounded-md transition-colors
              ${article.is_published
                ? "border-green/40 text-green hover:bg-green/10"
                : "border-border text-muted hover:border-accent hover:text-accent"}`}
          >
            {article.is_published ? "Published" : "Draft"}
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

      <p className="text-xs text-muted mb-4 font-mono">{article.reading_time_minutes} min read</p>

      {/* Category badges */}
      {article.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {article.categories.map(c => (
            <span key={c.id} className="text-xs bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded-full">
              {c.name}
            </span>
          ))}
        </div>
      )}

      {/* Body */}
      <div className="prose prose-invert max-w-none text-sm leading-relaxed
                      [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-1
                      [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-1">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            pre: ({ children }) => {
              const child = Array.isArray(children) ? children[0] : children
              if (!isValidElement<{ className?: string; children?: unknown }>(child)) {
                return <pre>{children}</pre>
              }
              const languageMatch = /language-([a-z0-9-]+)/i.exec(child.props.className ?? "")
              const language = languageMatch?.[1] ?? "text"
              return (
                <CodeCard
                  code={String(child.props.children ?? "").replace(/\n$/, "")}
                  language={language}
                  className="my-4"
                />
              )
            },
            code: ({ className, children, ...props }) => {
              if (!className?.startsWith("language-")) {
                return (
                  <code className="font-mono text-accent bg-code px-1 rounded" {...props}>
                    {children}
                  </code>
                )
              }
              return <code className={className} {...props}>{children}</code>
            },
          }}
        >
          {article.body}
        </ReactMarkdown>
      </div>

      {/* Tags */}
      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-6">
          {article.tags.map(t => (
            <span key={t.id} className="text-xs bg-code border border-border text-muted px-2 py-0.5 rounded font-mono">
              #{t.name}
            </span>
          ))}
        </div>
      )}

      {/* Related terms */}
      {article.related_terms.length > 0 && (
        <div className="mt-6">
          <p className="text-xs text-muted uppercase tracking-wider mb-2">Related terms</p>
          <div className="flex flex-wrap gap-2">
            {article.related_terms.map(r => (
              <button
                key={r.id}
                onClick={() => onSelectRelatedTerm(r.slug)}
                className="text-sm text-accent hover:underline font-mono"
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Related articles */}
      {article.related_articles.length > 0 && (
        <div className="mt-6">
          <p className="text-xs text-muted uppercase tracking-wider mb-2">Related articles</p>
          <div className="flex flex-wrap gap-2">
            {article.related_articles.map(r => (
              <button
                key={r.id}
                onClick={() => onSelectRelatedArticle(r.slug)}
                className="text-sm text-accent hover:underline font-mono"
              >
                {r.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Meta */}
      <p className="text-xs text-muted mt-8 font-mono">
        Added {new Date(article.created_at).toLocaleDateString()}
        {article.updated_at !== article.created_at &&
          ` · Updated ${new Date(article.updated_at).toLocaleDateString()}`}
      </p>
    </article>
  )
}
