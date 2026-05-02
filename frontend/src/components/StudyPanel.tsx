import { useCallback, useEffect, useMemo, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { api } from "../api/client"
import type { FlashcardMode, StudyCard } from "../types"
import { Flashcard } from "./Flashcard"

interface StudyPanelProps {
  onDone: () => void
}

type StudyMode = "flashcards" | "quiz"

interface QuizOption {
  slug: string
  label: string
}

const FLASHCARD_MODES: { id: FlashcardMode; label: string; hint: string }[] = [
  { id: "name-to-def",     label: "Name -> Definition", hint: "Recall the meaning" },
  { id: "def-to-name",     label: "Definition -> Name", hint: "Identify the term" },
  { id: "code-to-concept", label: "Code -> Concept",    hint: "What does the code show?" },
  { id: "cloze",           label: "Cloze",              hint: "Fill in the blank" },
]

const PAGE_SIZE = 100
const MODE_STORAGE_KEY = "concept-master.study-mode"
const FLASHCARD_MODE_STORAGE_KEY = "concept-master.flashcard-mode"

function shuffle<T>(items: T[]): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function loadStudyMode(): StudyMode {
  return localStorage.getItem(MODE_STORAGE_KEY) === "quiz" ? "quiz" : "flashcards"
}

function loadFlashcardMode(): FlashcardMode {
  const v = localStorage.getItem(FLASHCARD_MODE_STORAGE_KEY)
  if (v === "name-to-def" || v === "def-to-name" || v === "code-to-concept" || v === "cloze") {
    return v
  }
  return "name-to-def"
}

function makeOptions(current: StudyCard, terms: StudyCard[]): QuizOption[] {
  const distractors = shuffle(terms.filter(term => term.slug !== current.slug)).slice(0, 3)
  return shuffle([current, ...distractors]).map(term => ({
    slug: term.slug,
    label: term.name,
  }))
}

function DefinitionPrompt({ definition }: { definition: string }) {
  return (
    <div className="prose prose-invert max-w-none text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{definition}</ReactMarkdown>
    </div>
  )
}

export function StudyPanel({ onDone }: StudyPanelProps) {
  const [terms, setTerms] = useState<StudyCard[]>([])
  const [quizDeck, setQuizDeck] = useState<StudyCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [studyMode, setStudyMode] = useState<StudyMode>(loadStudyMode)
  const [flashcardMode, setFlashcardMode] = useState<FlashcardMode>(loadFlashcardMode)
  const [cardIndex, setCardIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [quizIndex, setQuizIndex] = useState(0)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [score, setScore] = useState(0)

  const loadTerms = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const collected: StudyCard[] = []
      let offset = 0
      let total = Infinity

      while (offset < total) {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(offset),
        })
        const res = await api.terms.list(params)
        collected.push(...res.terms)
        total = res.total
        offset += res.terms.length
        if (res.terms.length === 0) break
      }

      const shuffled = shuffle(collected)
      setTerms(shuffled)
      setQuizDeck(shuffle(collected))
      setCardIndex(0)
      setQuizIndex(0)
      setSelectedSlug(null)
      setScore(0)
      setRevealed(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load study terms")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => { void loadTerms() }, 0)
    return () => window.clearTimeout(timeout)
  }, [loadTerms])

  useEffect(() => {
    localStorage.setItem(MODE_STORAGE_KEY, studyMode)
  }, [studyMode])

  useEffect(() => {
    localStorage.setItem(FLASHCARD_MODE_STORAGE_KEY, flashcardMode)
  }, [flashcardMode])

  const currentCard = terms[cardIndex] ?? null
  const currentQuestion = quizDeck[quizIndex] ?? null
  const quizComplete = quizDeck.length > 0 && quizIndex >= quizDeck.length

  const quizOptions = useMemo(() => {
    if (!currentQuestion || terms.length < 4) return []
    return makeOptions(currentQuestion, terms)
  }, [currentQuestion, terms])

  const restartQuiz = useCallback(() => {
    setQuizDeck(shuffle(terms))
    setQuizIndex(0)
    setSelectedSlug(null)
    setScore(0)
  }, [terms])

  const goToCard = useCallback((nextIndex: number) => {
    setCardIndex(nextIndex)
    setRevealed(false)
  }, [])

  const handleSelectAnswer = useCallback((slug: string) => {
    if (!currentQuestion || selectedSlug) return
    setSelectedSlug(slug)
    if (slug === currentQuestion.slug) setScore(s => s + 1)
  }, [currentQuestion, selectedSlug])

  const handleNextQuestion = useCallback(() => {
    setQuizIndex(i => i + 1)
    setSelectedSlug(null)
  }, [])

  if (loading) {
    return <p className="p-6 text-muted text-sm">Loading study deck...</p>
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        <p className="text-red-400 text-sm mb-4">Failed to load study terms: {error}</p>
        <div className="flex gap-3">
          <button
            onClick={loadTerms}
            className="px-4 py-2 text-sm border border-border rounded-md text-muted hover:text-text hover:border-accent transition-colors"
          >
            Try again
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

  if (terms.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10 text-center">
        <h2 className="font-mono font-bold text-xl text-text mb-2">No terms to study yet</h2>
        <p className="text-muted text-sm mb-6">
          Add a few glossary terms first, then come back here for flashcards and quizzes.
        </p>
        <button
          onClick={onDone}
          className="px-4 py-2 text-sm bg-accent/10 text-accent border border-accent/30 rounded-md hover:bg-accent/20 transition-colors"
        >
          Back to glossary
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-xs font-mono text-muted uppercase tracking-widest mb-2">
            Unscheduled practice
          </p>
          <h2 className="font-mono font-bold text-2xl text-text">Study</h2>
          <p className="text-sm text-muted mt-1">
            Practice with flashcards or quiz yourself from the glossary you already have.
          </p>
        </div>
        <button
          onClick={onDone}
          className="text-xs text-muted hover:text-text transition-colors"
        >
          Back to glossary
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {(["flashcards", "quiz"] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setStudyMode(mode)}
            className={`px-3 py-1.5 rounded-md text-sm border transition-colors
              ${studyMode === mode
                ? "bg-accent/10 text-accent border-accent/40"
                : "bg-surface text-muted border-border hover:text-text"}`}
          >
            {mode === "flashcards" ? "Flashcards" : "Quiz"}
          </button>
        ))}
      </div>

      {studyMode === "flashcards" && currentCard && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <p className="text-xs font-mono text-muted">
              Card <span className="text-text">{cardIndex + 1}</span> of {terms.length}
            </p>
            <div className="flex flex-wrap gap-1">
              {FLASHCARD_MODES.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => { setFlashcardMode(mode.id); setRevealed(false) }}
                  title={mode.hint}
                  className={`px-2.5 py-1 rounded text-xs transition-colors border
                    ${flashcardMode === mode.id
                      ? "bg-accent/10 text-accent border-accent/40"
                      : "bg-surface text-muted border-border hover:text-text"}`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <Flashcard
            card={currentCard}
            mode={flashcardMode}
            revealed={revealed}
            onReveal={() => setRevealed(true)}
          />

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              onClick={() => goToCard(Math.max(0, cardIndex - 1))}
              disabled={cardIndex === 0}
              className="px-4 py-2 text-sm border border-border rounded-md text-muted hover:text-text hover:border-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => goToCard(Math.min(terms.length - 1, cardIndex + 1))}
              disabled={cardIndex === terms.length - 1}
              className="px-4 py-2 text-sm bg-accent/10 text-accent border border-accent/30 rounded-md hover:bg-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {studyMode === "quiz" && terms.length < 4 && (
        <div className="bg-surface border border-border rounded-lg p-8 text-center">
          <h3 className="font-mono font-bold text-lg text-text mb-2">Add more terms to quiz</h3>
          <p className="text-sm text-muted">
            Multiple-choice quizzes need at least 4 terms so there are enough answer choices.
            Flashcards are ready now.
          </p>
        </div>
      )}

      {studyMode === "quiz" && terms.length >= 4 && quizComplete && (
        <div className="bg-surface border border-border rounded-lg p-8 text-center">
          <p className="text-xs text-muted uppercase tracking-widest mb-3">Quiz complete</p>
          <h3 className="font-mono font-bold text-3xl text-accent mb-3">
            {score} / {quizDeck.length}
          </h3>
          <p className="text-sm text-muted mb-6">
            You answered {Math.round((score / quizDeck.length) * 100)}% correctly.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={restartQuiz}
              className="px-4 py-2 text-sm bg-accent/10 text-accent border border-accent/30 rounded-md hover:bg-accent/20 transition-colors"
            >
              Restart quiz
            </button>
            <button
              onClick={onDone}
              className="px-4 py-2 text-sm border border-border rounded-md text-muted hover:text-text hover:border-accent transition-colors"
            >
              Back to glossary
            </button>
          </div>
        </div>
      )}

      {studyMode === "quiz" && terms.length >= 4 && currentQuestion && !quizComplete && (
        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-5 text-xs font-mono text-muted">
            <span>
              Question <span className="text-text">{quizIndex + 1}</span> of {quizDeck.length}
            </span>
            <span>
              Score <span className="text-accent">{score}</span>
            </span>
          </div>

          <div className="rounded-lg border border-border bg-code/60 p-5 mb-5">
            <p className="text-xs text-muted uppercase tracking-widest mb-3">
              Which term matches this definition?
            </p>
            <DefinitionPrompt definition={currentQuestion.definition} />
          </div>

          <div className="grid gap-2">
            {quizOptions.map(option => {
              const isSelected = selectedSlug === option.slug
              const isCorrect = option.slug === currentQuestion.slug
              const showResult = selectedSlug !== null
              const color = showResult && isCorrect
                ? "border-green/50 bg-green/10 text-green"
                : showResult && isSelected
                  ? "border-red-500/50 bg-red-500/10 text-red-300"
                  : "border-border bg-bg text-text hover:border-accent"

              return (
                <button
                  key={option.slug}
                  disabled={showResult}
                  onClick={() => handleSelectAnswer(option.slug)}
                  className={`text-left px-4 py-3 rounded-md border transition-colors ${color} disabled:cursor-default`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>

          {selectedSlug && (
            <div className="mt-5 flex items-center justify-between gap-4 fade-in">
              <p className="text-sm">
                {selectedSlug === currentQuestion.slug ? (
                  <span className="text-green">Correct.</span>
                ) : (
                  <span className="text-red-300">
                    Not quite. Answer: <span className="font-mono">{currentQuestion.name}</span>
                  </span>
                )}
              </p>
              <button
                onClick={handleNextQuestion}
                className="px-4 py-2 text-sm bg-accent/10 text-accent border border-accent/30 rounded-md hover:bg-accent/20 transition-colors"
              >
                {quizIndex === quizDeck.length - 1 ? "Finish quiz" : "Next question"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
