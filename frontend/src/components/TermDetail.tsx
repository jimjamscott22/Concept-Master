import { isValidElement, useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Highlight } from "prism-react-renderer"
import type { TermDetail } from "../types"
import { ConceptVisual, hasConceptVisual } from "./ConceptVisual"
import { conceptMasterPrismTheme } from "../lib/prismTheme"

interface TermDetailProps {
  term: TermDetail
  onEdit: () => void
  onDelete: () => void
  onToggleFavorite: () => void
  onSelectRelated: (slug: string) => void
  onBack: () => void
}

type Tab = "def" | "code" | "visual"

function CodeCard({ code, language }: { code: string; language: string }) {
  return (
    <Highlight theme={conceptMasterPrismTheme} code={code} language={language.toLowerCase()}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={`${className} bg-codeBg border border-line rounded-[10px] p-[20px_22px] overflow-x-auto text-[13.5px] leading-[1.75]`}
          style={style}
        >
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, key) => <span key={key} {...getTokenProps({ token })} />)}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  )
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" || target.isContentEditable
}

export function TermDetail({ term, onEdit, onDelete, onToggleFavorite, onSelectRelated, onBack }: TermDetailProps) {
  const hasCode = Boolean(term.example_code)
  const hasVisual = hasConceptVisual(term.slug)
  const [tab, setTab] = useState<Tab>("def")

  // Reset to Definition whenever the selected term changes (spec: "resets the content tab to Definition").
  useEffect(() => { setTab("def") }, [term.slug])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      if (isEditableTarget(event.target)) return
      const byKey: Record<string, Tab> = { "1": "def", "2": "code", "3": "visual" }
      const next = byKey[event.key]
      if (!next) return
      if (next === "code" && !hasCode) return
      if (next === "visual" && !hasVisual) return
      event.preventDefault()
      setTab(next)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [hasCode, hasVisual])

  const tabs: { key: Tab; label: string; shortcut: string; available: boolean }[] = [
    { key: "def",    label: "Definition", shortcut: "ALT+1", available: true },
    { key: "code",   label: "Code",       shortcut: "ALT+2", available: hasCode },
    { key: "visual", label: "Diagram",    shortcut: "ALT+3", available: hasVisual },
  ]

  return (
    <article className="fade-in max-w-[900px] mx-0 px-[44px] pt-[34px] pb-[90px]">
      <button onClick={onBack} className="md:hidden mb-4 text-fg3 text-sm hover:text-fg transition-colors">← Back</button>

      {/* Metadata above title */}
      <div className="flex flex-wrap gap-2 mb-[14px]">
        {term.categories.map(c => (
          <span key={c.id} className="text-[11px] tracking-[.12em] font-semibold rounded uppercase px-[9px] py-[3px] bg-accent text-bg2">
            {c.name}
          </span>
        ))}
        {term.tags.map(t => (
          <span key={t.id} className="text-[11.5px] text-tagFg bg-tagBg border border-tagLine rounded px-[9px] py-[3px]">
            #{t.name}
          </span>
        ))}
        {hasVisual && (
          <span className="text-[10.5px] tracking-[.1em] text-fg3 border border-dashed border-line rounded px-2 py-[3px] uppercase">
            Has diagram
          </span>
        )}
      </div>

      <div className="flex items-start justify-between gap-6 mb-4">
        <h1 className="text-[34px] leading-[1.15] tracking-[-0.025em] font-bold text-fg m-0">{term.name}</h1>
        <div className="flex-none flex items-center gap-[7px]">
          <button
            onClick={onToggleFavorite}
            className={`w-8 h-8 rounded-md border border-line bg-bg2 ${term.is_favorite ? "text-accent" : "text-fg3"}`}
          >
            ★
          </button>
          <button onClick={onEdit} className="h-8 px-[14px] rounded-md border border-line bg-bg2 text-fg2 text-[12.5px] hover:text-fg hover:border-accent transition-colors">
            Edit
          </button>
          <button onClick={onDelete} className="h-8 px-[14px] rounded-md border border-line bg-bg2 text-fg3 text-[12.5px] hover:text-fg transition-colors">
            Delete
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-line mt-[26px]">
        {tabs.filter(t => t.available).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-[11px] text-[12.5px] tracking-[.04em] -mb-px border-b-2 transition-colors
              ${tab === t.key ? "text-fg font-semibold border-accent" : "text-fg3 border-transparent hover:text-fg"}`}
          >
            {t.label} <span className="opacity-45 text-[10.5px] ml-2">{t.shortcut}</span>
          </button>
        ))}
      </div>

      {/* Definition tab */}
      {tab === "def" && (
        <div
          className="pt-[26px] max-w-[68ch] text-fg"
          style={{ fontFamily: "var(--body)", fontSize: "var(--bodysize)", lineHeight: "var(--bodylh)" }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              pre: ({ children }) => {
                const child = Array.isArray(children) ? children[0] : children
                if (!isValidElement<{ className?: string; children?: unknown }>(child)) return <pre>{children}</pre>
                const languageMatch = /language-([a-z0-9-]+)/i.exec(child.props.className ?? "")
                return (
                  <div className="my-5">
                    <CodeCard code={String(child.props.children ?? "").replace(/\n$/, "")} language={languageMatch?.[1] ?? "text"} />
                  </div>
                )
              },
              code: ({ className, children, ...props }) => {
                if (!className?.startsWith("language-")) {
                  return (
                    <code className="bg-bg2 border border-line text-accent rounded px-[5px] py-px text-[0.86em]" style={{ fontFamily: "var(--font-mono, monospace)" }} {...props}>
                      {children}
                    </code>
                  )
                }
                return <code className={className} {...props}>{children}</code>
              },
            }}
          >
            {term.definition}
          </ReactMarkdown>

          {term.related_terms.length > 0 && (
            <div className="mt-[34px] pt-5 border-t border-line">
              <p className="text-[11px] tracking-[.14em] text-fg3 uppercase mb-[10px]">Related</p>
              <div className="flex flex-wrap gap-2">
                {term.related_terms.map(r => (
                  <button
                    key={r.id}
                    onClick={() => onSelectRelated(r.slug)}
                    className="text-[12.5px] text-fg2 bg-bg2 border border-line rounded-md px-3 py-[6px] hover:border-accent hover:text-fg transition-colors"
                  >
                    {r.name} <span className="text-fg3">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Code tab */}
      {tab === "code" && hasCode && term.example_code && (
        <div className="pt-[22px]">
          <div className="flex gap-[6px] mb-3">
            <span className="px-[13px] py-[6px] rounded-md text-xs border border-accent bg-bg3 text-fg">
              {term.code_lang ?? "text"}
            </span>
          </div>
          <CodeCard code={term.example_code} language={term.code_lang ?? "text"} />
        </div>
      )}

      {/* Diagram tab — real ConceptVisual content, not the spec's placeholder bars */}
      {tab === "visual" && hasVisual && (
        <div className="pt-[22px]">
          <ConceptVisual slug={term.slug} name={term.name} />
        </div>
      )}

      <p className="text-xs text-fg3 mt-8">
        Added {new Date(term.created_at).toLocaleDateString()}
        {term.updated_at !== term.created_at && ` · Updated ${new Date(term.updated_at).toLocaleDateString()}`}
      </p>
    </article>
  )
}
