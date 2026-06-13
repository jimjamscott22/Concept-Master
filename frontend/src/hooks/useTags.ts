import useSWR from "swr"
import { api } from "../api/client"
import type { Tag } from "../types"

export function useTags() {
  const { data, error, isLoading } = useSWR<Tag[]>("/tags", api.tags.list)
  return { tags: data ?? [], loading: isLoading, error: error?.message ?? null }
}
