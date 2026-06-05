import useSWR from "swr"
import { api } from "../api/client"
import type { Category } from "../types"

export function useCategories() {
  const { data, error, isLoading } = useSWR<Category[]>("/categories", api.categories.list)
  return { categories: data ?? [], loading: isLoading, error: error?.message ?? null }
}
