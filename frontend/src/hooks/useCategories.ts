import { useState, useEffect } from "react"
import { api } from "../api/client"
import type { Category } from "../types"

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.categories.list()
      .then(setCategories)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { categories, loading, error }
}
