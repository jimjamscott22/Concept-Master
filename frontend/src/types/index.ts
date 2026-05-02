export interface Category {
  id: number
  name: string
  slug: string
  term_count: number
}

export interface Tag {
  id: number
  name: string
  term_count: number
}

export interface TermSummary {
  id: number
  name: string
  slug: string
}

export interface Term {
  id: number
  name: string
  slug: string
  definition: string
  example_code: string | null
  code_lang: string | null
  is_favorite: boolean
  categories: Category[]
  tags: Tag[]
  created_at: string
  updated_at: string
}

export interface TermDetail extends Term {
  related_terms: TermSummary[]
}

export type StudyCard = Term

export interface TermListResponse {
  terms: Term[]
  total: number
  limit: number
  offset: number
}

export interface TermCreatePayload {
  name: string
  definition: string
  example_code: string | null
  code_lang: string | null
  category_ids: number[]
  tag_names: string[]
  related_term_ids: number[]
}

export type TermUpdatePayload = TermCreatePayload

export interface Stats {
  total_terms: number
  total_categories: number
  total_tags: number
  per_category: Category[]
  recent_terms: TermSummary[]
  top_favorites: TermSummary[]
}

// ── Review / spaced-repetition ─────────────────────────────────────────────

export type ReviewRating = "again" | "hard" | "good" | "easy"

export type FlashcardMode = "name-to-def" | "def-to-name" | "code-to-concept" | "cloze"

export interface ReviewCard extends TermDetail {
  ease: number
  interval_days: number
  reps: number
  lapses: number
  due_at: string | null
  last_rating: ReviewRating | null
  last_reviewed_at: string | null
}

export interface ReviewQueueResponse {
  due_count: number
  new_count: number
  queue: ReviewCard[]
}

export interface ReviewState {
  term_id: number
  ease: number
  interval_days: number
  reps: number
  lapses: number
  due_at: string
  last_rating: ReviewRating | null
  last_reviewed_at: string | null
}

export interface HeatmapDay {
  date: string
  reviewed_count: number
  correct_count: number
}

export interface StreakResponse {
  current_streak: number
  longest_streak: number
  today_reviewed: number
  today_due: number
  daily_goal: number
  heatmap: HeatmapDay[]
}
