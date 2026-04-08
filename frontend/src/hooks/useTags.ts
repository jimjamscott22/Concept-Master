import { useState, useEffect } from "react"
import { api } from "../api/client"
import type { Tag } from "../types"

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.tags.list()
      .then(setTags)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { tags, loading, error }
}
