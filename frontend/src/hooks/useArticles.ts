import { useState, useEffect, useCallback } from "react"
import { api } from "../api/client"
import { useDebounce } from "./useDebounce"
import type { ArticleListResponse } from "../types"

interface UseArticlesOptions {
  search: string
  category: string | null
  tag: string | null
  limit?: number
  offset?: number
}

export function useArticles(opts: UseArticlesOptions) {
  const [data, setData] = useState<ArticleListResponse>({ articles: [], total: 0, limit: 20, offset: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const debouncedSearch = useDebounce(opts.search, 300)

  const fetch = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("q", debouncedSearch)
    if (opts.category)   params.set("category", opts.category)
    if (opts.tag)        params.set("tag", opts.tag)
    if (opts.limit)  params.set("limit",  String(opts.limit))
    if (opts.offset) params.set("offset", String(opts.offset))

    api.articles.list(params)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [debouncedSearch, opts.category, opts.tag, opts.limit, opts.offset])

  useEffect(() => {
    const timeout = window.setTimeout(() => { fetch() }, 0)
    return () => window.clearTimeout(timeout)
  }, [fetch])

  return { ...data, loading, error, refetch: fetch }
}
