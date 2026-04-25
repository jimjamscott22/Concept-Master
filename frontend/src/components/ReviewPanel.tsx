import { useCallback, useEffect, useState } from "react"
import { api } from "../api/client"
import type { ReviewCard, ReviewRating, FlashcardMode } from "../types"
import { Flashcard } from "./Flashcard"

interface ReviewPanelProps {
  onDone: () => void
  onReviewSubmitted?: () => void  // signal parent to refresh streak/badge
}

const MODES: { id: FlashcardMode; label: string; hint: string }[] = [
  { id: "name-to-def",     label: "Name → Definition",   hint: "Recall the meaning" },
  { id: "def-to-name",     label: "Definition → Name",   hint: "Identify the term" },
  { id: "code-to-concept", label: "Code → Concept",      hint: "What does the code show?" },
  { id: "cloze",           label: "Cloze deletion",      hint: "Fill in the blank" },
]

const RATINGS: { id: ReviewRating; label: string; key: string; color: string }[] = [
  { id: "again", label: "Again", key: "1", color: "border-red-500/40 text-red-400 hover:bg-red-500/10" },
  { id: "hard",  label: "Hard",  key: "2", color: "border-orange-400/40 text-orange-300 hover:bg-orange-400/10" },
  { id: "good",  label: "Good",  key: "3", color: "border-accent/40 text-accent hover:bg-accent/10" },
  { id: "easy",  label: "Easy",  key: "4", color: "border-green/40 text-green hover:bg-green/10" },
]

const MODE_STORAGE_KEY = "concept-master.flashcard-mode"

function loadMode(): FlashcardMode {
  const v = localStorage.getItem(MODE_STORAGE_KEY)
  if (v === "name-to-def" || v === "def-to-name" || v === "code-to-concept" || v === "cloze") {
    return v
  }
  return "name-to-def"
}

function formatInterval(state: { interval_days: number; rating: ReviewRating }): string {
  if (state.rating === "again") return "<10m"
  const d = state.interval_days
  if (d < 1) return "today"
  if (d === 1) return "1d"
  if (d < 30) return `${d}d`
  if (d < 365) return `${Math.round(d / 30)}mo`
  return `${(d / 365).toFixed(1)}y`
}

export function ReviewPanel({ onDone, onReviewSubmitted }: ReviewPanelProps) {
  const [queue, setQueue] = useState<ReviewCard[]>([])
  const [dueCount, setDueCount] = useState(0)
  const [newCount, setNewCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [mode, setMode] = useState<FlashcardMode>(loadMode)
  const [sessionStats, setSessionStats] = useState({ done: 0, again: 0 })
  const [lastResult, setLastResult] = useState<{
    name: string
    rating: ReviewRating
    interval_days: number
  } | null>(null)

  const loadQueue = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.review.queue(20)
      setQueue(res.queue)
      setDueCount(res.due_count)
      setNewCount(res.new_count)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load queue")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadQueue() }, [loadQueue])

  useEffect(() => {
    localStorage.setItem(MODE_STORAGE_KEY, mode)
  }, [mode])

  const current = queue[0] ?? null

  const handleReveal = useCallback(() => setRevealed(true), [])

  const handleRate = useCallback(async (rating: ReviewRating) => {
    if (!current || submitting) return
    setSubmitting(true)
    try {
      const newState = await api.review.rate(current.slug, rating)
      setLastResult({
        name: current.name,
        rating,
        interval_days: newState.interval_days,
      })
      setSessionStats(s => ({
        done: s.done + 1,
        again: s.again + (rating === "again" ? 1 : 0),
      }))
      onReviewSubmitted?.()

      // Pop the card from the local queue. If "again", push it to the back so
      // the user re-sees it later in this session.
      setQueue(q => {
        const [, ...rest] = q
        if (rating === "again") return [...rest, current]
        return rest
      })
      setRevealed(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit rating")
    } finally {
      setSubmitting(false)
    }
  }, [current, submitting, onReviewSubmitted])

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA") return
      if (!current) return
      if (e.key === " " && !revealed) {
        e.preventDefault()
        handleReveal()
      } else if (revealed && ["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault()
        const rating = RATINGS[parseInt(e.key, 10) - 1].id
        handleRate(rating)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [current, revealed, handleReveal, handleRate])

  if (loading) {
    return <p className="p-6 text-muted text-sm">Loading review queue…</p>
  }
  if (error) {
    return <p className="p-6 text-red-400 text-sm">Failed to load queue: {error}</p>
  }

  // Empty state — nothing due (or all done in this session)
  if (!current) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10 text-center">
        <h2 className="font-mono font-bold text-xl text-text mb-2">
          {sessionStats.done > 0 ? "Session complete" : "Nothing due right now"}
        </h2>
        <p className="text-muted text-sm mb-6">
          {sessionStats.done > 0
            ? `You reviewed ${sessionStats.done} card${sessionStats.done === 1 ? "" : "s"} this session` +
              (sessionStats.again > 0 ? ` (${sessionStats.again} marked "again").` : ".")
            : "Come back later or browse the glossary to add new terms."}
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={loadQueue}
            className="px-4 py-2 text-sm border border-border rounded-md text-muted hover:text-text hover:border-accent transition-colors"
          >
            Refresh queue
          </button>
          <button
            onClick={onDone}
            className="px-4 py-2 text-sm bg-accent/10 text-accent border border-accent/30 rounded-md hover:bg-accent/20 transition-colors"
          >
            Back to glossary
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      {/* Header: progress + mode toggle */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-4 text-xs font-mono text-muted">
          <span>
            <span className="text-accent">{dueCount}</span> due
            {newCount > 0 && (
              <>
                {" · "}
                <span className="text-green">{newCount}</span> new
              </>
            )}
          </span>
          <span>·</span>
          <span>
            <span className="text-text">{sessionStats.done}</span> reviewed this session
          </span>
        </div>
        <button
          onClick={onDone}
          className="text-xs text-muted hover:text-text transition-colors"
        >
          ← Exit
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex flex-wrap gap-1 mb-4">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setRevealed(false) }}
            title={m.hint}
            className={`px-2.5 py-1 rounded text-xs transition-colors border
              ${mode === m.id
                ? "bg-accent/10 text-accent border-accent/40"
                : "bg-surface text-muted border-border hover:text-text"}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Last-rating toast */}
      {lastResult && (
        <div className="mb-3 text-xs font-mono text-muted">
          Last: <span className="text-text">{lastResult.name}</span>{" "}
          → <span className="text-accent">{lastResult.rating}</span>{" "}
          (next in {formatInterval(lastResult)})
        </div>
      )}

      <Flashcard
        card={current}
        mode={mode}
        revealed={revealed}
        onReveal={handleReveal}
      />

      {/* Rating row */}
      {revealed && (
        <div className="mt-4 grid grid-cols-4 gap-2 fade-in">
          {RATINGS.map(r => (
            <button
              key={r.id}
              disabled={submitting}
              onClick={() => handleRate(r.id)}
              className={`px-3 py-3 rounded-md border transition-colors text-sm font-medium
                          disabled:opacity-50 disabled:cursor-not-allowed ${r.color}`}
            >
              <div>{r.label}</div>
              <div className="text-xs opacity-60 font-mono mt-0.5">({r.key})</div>
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-muted text-center mt-4 font-mono">
        Space to reveal · 1–4 to rate
      </p>
    </div>
  )
}
