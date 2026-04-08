import type {
  Term, TermDetail, TermListResponse, TermCreatePayload,
  TermUpdatePayload, Category, Tag, Stats,
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
}
