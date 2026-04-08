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
