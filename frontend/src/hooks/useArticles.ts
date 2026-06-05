import useSWR from "swr"
import { api } from "../api/client"
import { useDebounce } from "./useDebounce"
import type { ArticleListResponse } from "../types"

interface UseArticlesOptions {
  search: string
  category: string | null
  tag: string | null
  limit?: number
  offset?: number
  enabled?: boolean
}

export function useArticles(opts: UseArticlesOptions) {
  const debouncedSearch = useDebounce(opts.search, 300)

  const params = new URLSearchParams()
  if (debouncedSearch) params.set("q", debouncedSearch)
  if (opts.category)   params.set("category", opts.category)
  if (opts.tag)        params.set("tag", opts.tag)
  if (opts.limit)  params.set("limit",  String(opts.limit))
  if (opts.offset) params.set("offset", String(opts.offset))

  const key = opts.enabled !== false ? `/articles?${params.toString()}` : null

  const { data, error, isLoading, mutate } = useSWR<ArticleListResponse>(
    key,
    () => api.articles.list(params)
  )

  return {
    articles: data?.articles ?? [],
    total: data?.total ?? 0,
    limit: data?.limit ?? 20,
    offset: data?.offset ?? 0,
    loading: isLoading,
    error: error?.message ?? null,
    refetch: mutate
  }
}
