import useSWR from "swr"
import { useMemo } from "react"
import { api } from "../api/client"
import { useDebounce } from "./useDebounce"
import type { TermListResponse } from "../types"

interface UseTermsOptions {
  search: string
  category: string | null
  tag: string | null
  favoritesOnly: boolean
  limit?: number
  offset?: number
  enabled?: boolean
}

export function useTerms(opts: UseTermsOptions) {
  const debouncedSearch = useDebounce(opts.search, 300)

  const params = useMemo(() => {
    const p = new URLSearchParams()
    if (debouncedSearch) p.set("q", debouncedSearch)
    if (opts.category)    p.set("category", opts.category)
    if (opts.tag)         p.set("tag", opts.tag)
    if (opts.favoritesOnly) p.set("favorites_only", "true")
    if (opts.limit)  p.set("limit",  String(opts.limit))
    if (opts.offset) p.set("offset", String(opts.offset))
    return p
  }, [debouncedSearch, opts.category, opts.tag, opts.favoritesOnly, opts.limit, opts.offset])

  const key = opts.enabled !== false ? `/terms?${params.toString()}` : null
  
  const { data, error, isLoading, mutate } = useSWR<TermListResponse>(
    key,
    () => api.terms.list(params)
  )

  return {
    terms: data?.terms ?? [],
    total: data?.total ?? 0,
    limit: data?.limit ?? 20,
    offset: data?.offset ?? 0,
    loading: isLoading,
    error: error?.message ?? null,
    refetch: mutate
  }
}
