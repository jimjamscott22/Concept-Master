import type {
  Term, TermDetail, TermListResponse, TermCreatePayload,
  TermUpdatePayload, TermSummary, Category, Tag, Stats,
  ReviewQueueResponse, ReviewState, ReviewRating, StreakResponse,
  Article, ArticleDetail, ArticleListResponse, ArticleSummary,
  ArticleCreatePayload, ArticleUpdatePayload,
} from "../types"

const BASE = "/api"

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  terms: {
    list: (params?: URLSearchParams) =>
      request<TermListResponse>(`/terms${params ? "?" + params.toString() : ""}`),
    summaries: () => request<TermSummary[]>("/terms/summaries"),
    get: (slug: string) => request<TermDetail>(`/terms/${slug}`),
    create: (payload: TermCreatePayload) =>
      request<TermDetail>("/terms", { method: "POST", body: JSON.stringify(payload) }),
    update: (slug: string, payload: TermUpdatePayload) =>
      request<TermDetail>(`/terms/${slug}`, { method: "PUT", body: JSON.stringify(payload) }),
    delete: (slug: string) => request<void>(`/terms/${slug}`, { method: "DELETE" }),
    toggleFavorite: (slug: string) => request<Term>(`/terms/${slug}/favorite`, { method: "PATCH" }),
    export: () => request<TermDetail[]>("/terms/export"),
    import: (items: TermCreatePayload[]) =>
      request<{ imported: number; skipped: number }>("/terms/import", {
        method: "POST",
        body: JSON.stringify(items),
      }),
  },
  categories: {
    list: () => request<Category[]>("/categories"),
  },
  tags: {
    list: () => request<Tag[]>("/tags"),
  },
  stats: {
    get: () => request<Stats>("/stats"),
  },
  review: {
    queue: (limit = 20) => request<ReviewQueueResponse>(`/review/queue?limit=${limit}`),
    rate: (slug: string, rating: ReviewRating) =>
      request<ReviewState>(`/review/${slug}`, {
        method: "POST",
        body: JSON.stringify({ rating }),
      }),
    streak: () => request<StreakResponse>("/review/streak"),
  },
  articles: {
    list: (params?: URLSearchParams) =>
      request<ArticleListResponse>(`/articles${params ? "?" + params.toString() : ""}`),
    summaries: () => request<ArticleSummary[]>("/articles/summaries"),
    get: (slug: string) => request<ArticleDetail>(`/articles/${slug}`),
    create: (payload: ArticleCreatePayload) =>
      request<ArticleDetail>("/articles", { method: "POST", body: JSON.stringify(payload) }),
    update: (slug: string, payload: ArticleUpdatePayload) =>
      request<ArticleDetail>(`/articles/${slug}`, { method: "PUT", body: JSON.stringify(payload) }),
    delete: (slug: string) => request<void>(`/articles/${slug}`, { method: "DELETE" }),
    togglePublish: (slug: string) =>
      request<Article>(`/articles/${slug}/publish`, { method: "PATCH" }),
    export: () => request<ArticleDetail[]>("/articles/export"),
    import: (items: ArticleCreatePayload[]) =>
      request<{ imported: number; skipped: number }>("/articles/import", {
        method: "POST",
        body: JSON.stringify(items),
      }),
  },
}
