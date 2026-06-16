import { isValidElement, useCallback, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Highlight, themes } from "prism-react-renderer"
import type { TermDetail } from "../types"
import { ConceptVisual, hasConceptVisual } from "./ConceptVisual"

interface TermDetailProps {
  term: TermDetail
  onEdit: () => void
  onDelete: () => void
  onToggleFavorite: () => void
  onSelectRelated: (slug: string) => void
  onBack: () => void
}

function CodeCard({ code, language, className = "mt-6" }: { code: string; language?: string; className?: string }) {
  const resolvedLanguage = (language ?? "text").toLowerCase()

  return (
    <div className={className}>
      <p className="text-xs text-muted mb-2 font-mono uppercase tracking-wider">
        {resolvedLanguage}
      </p>
      <Highlight
        theme={themes.vsDark}
        code={code}
        language={resolvedLanguage}
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
  )
}

type TermSection = "definition" | "code" | "visual"

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false

  const tagName = target.tagName
  return (
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT" ||
    target.isContentEditable
  )
}

export function TermDetail({ term, onEdit, onDelete, onToggleFavorite, onSelectRelated, onBack }: TermDetailProps) {
  const definitionRef = useRef<HTMLElement | null>(null)
  const codeRef = useRef<HTMLElement | null>(null)
  const visualRef = useRef<HTMLDivElement | null>(null)
  const hasCode = Boolean(term.example_code)
  const hasVisual = hasConceptVisual(term.slug)

  const scrollToSection = useCallback((section: TermSection) => {
    const sectionRef = {
      definition: definitionRef,
      code: codeRef,
      visual: visualRef,
    }[section]

    const target = sectionRef.current
    if (!target) return

    target.scrollIntoView({ block: "start", behavior: "smooth" })
    target.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      if (isEditableTarget(event.target)) return

      const sectionByKey: Record<string, TermSection> = {
        "1": "definition",
        "2": "code",
        "3": "visual",
      }
      const section = sectionByKey[event.key]
      if (!section) return

      event.preventDefault()
      scrollToSection(section)
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [scrollToSection])

  const sectionLinks = [
    { key: "definition" as const, label: "Definition", shortcut: "Alt+1", available: true },
    { key: "code" as const, label: "Code", shortcut: "Alt+2", available: hasCode },
    { key: "visual" as const, label: "Visual", shortcut: "Alt+3", available: hasVisual },
  ].filter(section => section.available)

  return (
    <article className="fade-in max-w-3xl mx-auto px-6 py-6">
      <button onClick={onBack} className="md:hidden mb-4 text-muted text-sm hover:text-text transition-colors">← Back</button>
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

      {sectionLinks.length > 1 && (
        <nav
          aria-label="Term sections"
          className="sticky top-0 z-10 -mx-1 mb-5 flex gap-1 overflow-x-auto border-y border-border bg-bg/95 px-1 py-2 backdrop-blur"
        >
          {sectionLinks.map(section => (
            <button
              key={section.key}
              type="button"
              onClick={() => scrollToSection(section.key)}
              className="flex flex-shrink-0 items-center gap-2 rounded-md border border-border bg-surface/70 px-2.5 py-1.5
                         text-xs text-muted transition-colors hover:border-accent hover:text-accent
                         focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
            >
              <span>{section.label}</span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted/80">{section.shortcut}</span>
            </button>
          ))}
        </nav>
      )}

      {/* Definition */}
      <section
        id="term-section-definition"
        ref={definitionRef}
        tabIndex={-1}
        className="scroll-mt-16 focus:outline-none"
      >
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
              // Preserve language-* class for fenced blocks so the `pre` renderer can parse language metadata.
              return <code className={className} {...props}>{children}</code>
            },
          }}
        >
          {term.definition}
        </ReactMarkdown>
        </div>
      </section>

      {/* Code block */}
      {hasCode && term.example_code && (
        <section
          id="term-section-code"
          ref={codeRef}
          tabIndex={-1}
          className="scroll-mt-16 focus:outline-none"
        >
          <CodeCard code={term.example_code} language={term.code_lang ?? "text"} />
        </section>
      )}

      {hasVisual && (
        <div
          id="term-section-visual"
          ref={visualRef}
          tabIndex={-1}
          className="scroll-mt-16 focus:outline-none"
        >
          <ConceptVisual slug={term.slug} name={term.name} />
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
