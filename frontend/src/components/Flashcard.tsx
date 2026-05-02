import { useMemo, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Highlight, themes } from "prism-react-renderer"
import type { StudyCard, FlashcardMode } from "../types"

interface FlashcardProps {
  card: StudyCard
  mode: FlashcardMode
  revealed: boolean
  onReveal: () => void
}

/** Pick a deterministic-but-card-specific cloze blank from the definition. */
function pickCloze(card: StudyCard): { sentence: string; blank: string } | null {
  // Pick the first sentence with a "meaty" word (length >= 5, alphanumeric).
  const text = card.definition.replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ")
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 240)

  for (const s of sentences) {
    const words = s.match(/[A-Za-z][A-Za-z0-9-]{4,}/g) ?? []
    // Avoid blanking the term name itself (too easy / too hard).
    const nameTokens = new Set(card.name.toLowerCase().split(/\s+/))
    const stop = new Set([
      "which", "where", "while", "their", "there", "these", "those",
      "every", "other", "about", "would", "could", "should", "often",
    ])
    const candidate = words.find(w => {
      const lw = w.toLowerCase()
      return !nameTokens.has(lw) && !stop.has(lw)
    })
    if (candidate) return { sentence: s, blank: candidate }
  }
  return null
}

function renderMarkdown(md: string) {
  return (
    <div className="prose prose-invert max-w-none text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
    </div>
  )
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <Highlight theme={themes.vsDark} code={code} language={language.toLowerCase()}>
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
  )
}

export function Flashcard({ card, mode, revealed, onReveal }: FlashcardProps) {
  const [clozeGuessState, setClozeGuessState] = useState({ key: "", value: "" })
  const cloze = useMemo(() => pickCloze(card), [card])
  const clozeGuessKey = `${card.id}:${mode}`
  const clozeGuess = clozeGuessState.key === clozeGuessKey ? clozeGuessState.value : ""

  // ── Effective mode: fall back if a mode isn't applicable for this card ──
  let effectiveMode: FlashcardMode = mode
  if (mode === "code-to-concept" && !card.example_code) effectiveMode = "name-to-def"
  if (mode === "cloze" && !cloze) effectiveMode = "name-to-def"

  const renderPrompt = () => {
    switch (effectiveMode) {
      case "name-to-def":
        return (
          <div className="text-center">
            <p className="text-xs text-muted uppercase tracking-widest mb-3">
              What does this term mean?
            </p>
            <h2 className="font-mono font-bold text-3xl text-text">{card.name}</h2>
          </div>
        )
      case "def-to-name":
        return (
          <div>
            <p className="text-xs text-muted uppercase tracking-widest mb-3 text-center">
              Name this concept
            </p>
            {renderMarkdown(card.definition)}
          </div>
        )
      case "code-to-concept":
        return (
          <div>
            <p className="text-xs text-muted uppercase tracking-widest mb-3 text-center">
              What concept does this code illustrate?
            </p>
            <CodeBlock
              code={card.example_code ?? ""}
              language={card.code_lang ?? "text"}
            />
          </div>
        )
      case "cloze": {
        if (!cloze) return null
        const filled = cloze.sentence.replace(
          cloze.blank,
          revealed
            ? `\u00A0${cloze.blank}\u00A0`
            : `_______`,
        )
        return (
          <div>
            <p className="text-xs text-muted uppercase tracking-widest mb-3 text-center">
              Fill in the blank
            </p>
            <p className="text-base text-text leading-relaxed">
              {revealed ? (
                <>
                  {cloze.sentence.split(cloze.blank).map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <span className="bg-green/20 text-green px-1 rounded font-mono">
                          {cloze.blank}
                        </span>
                      )}
                    </span>
                  ))}
                </>
              ) : (
                filled
              )}
            </p>
            {!revealed && (
              <input
                value={clozeGuess}
                onChange={(e) => setClozeGuessState({ key: clozeGuessKey, value: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") onReveal() }}
                placeholder="Your guess (optional)"
                className="mt-4 w-full px-3 py-2 bg-code border border-border rounded-md
                           text-sm text-text font-mono focus:outline-none focus:border-accent"
              />
            )}
            {revealed && clozeGuess && (
              <p className="mt-3 text-xs font-mono">
                <span className="text-muted">Your guess: </span>
                <span
                  className={
                    clozeGuess.trim().toLowerCase() === cloze.blank.toLowerCase()
                      ? "text-green"
                      : "text-red-400"
                  }
                >
                  {clozeGuess}
                </span>
              </p>
            )}
            <p className="text-xs text-muted mt-4 text-center font-mono">
              From: {card.name}
            </p>
          </div>
        )
      }
    }
  }

  const renderAnswer = () => {
    switch (effectiveMode) {
      case "name-to-def":
        return (
          <div>
            <h3 className="text-xs text-muted uppercase tracking-widest mb-2">Definition</h3>
            {renderMarkdown(card.definition)}
            {card.example_code && (
              <div className="mt-4">
                <h3 className="text-xs text-muted uppercase tracking-widest mb-2">Example</h3>
                <CodeBlock
                  code={card.example_code}
                  language={card.code_lang ?? "text"}
                />
              </div>
            )}
          </div>
        )
      case "def-to-name":
        return (
          <div className="text-center">
            <h3 className="text-xs text-muted uppercase tracking-widest mb-2">Answer</h3>
            <p className="font-mono font-bold text-2xl text-accent">{card.name}</p>
          </div>
        )
      case "code-to-concept":
        return (
          <div>
            <p className="text-center font-mono font-bold text-xl text-accent mb-4">
              {card.name}
            </p>
            {renderMarkdown(card.definition)}
          </div>
        )
      case "cloze":
        return null  // The blank is filled inline in renderPrompt when revealed.
    }
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-8 min-h-[280px] flex flex-col">
      <div className="flex-1 flex flex-col justify-center">{renderPrompt()}</div>

      {revealed && (
        <div className="mt-6 pt-6 border-t border-border fade-in">
          {renderAnswer()}
        </div>
      )}

      {!revealed && (
        <div className="mt-6 text-center">
          <button
            onClick={onReveal}
            className="px-6 py-2 bg-accent/10 text-accent border border-accent/30
                       rounded-md hover:bg-accent/20 transition-colors text-sm font-medium"
          >
            Show answer{" "}
            <span className="text-xs opacity-60 ml-1 font-mono">(Space)</span>
          </button>
        </div>
      )}
    </div>
  )
}
