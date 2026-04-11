import { useState, useEffect } from "react"
import { api } from "../api/client"
import type { Stats } from "../types"

interface StatsPanelProps {
  onSelectTerm: (slug: string) => void
}

export function StatsPanel({ onSelectTerm }: StatsPanelProps) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.stats.get().then(setStats).catch((e: Error) => setError(e.message))
  }, [])

  if (error)  return <p className="p-6 text-red-400 text-sm">Failed to load stats: {error}</p>
  if (!stats) return <p className="p-6 text-muted text-sm">Loading stats…</p>

  const maxCount = Math.max(...stats.per_category.map(c => c.term_count), 1)

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      <h2 className="font-mono font-bold text-lg text-text mb-6">Glossary Stats</h2>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Terms",      value: stats.total_terms },
          { label: "Categories", value: stats.total_categories },
          { label: "Tags",       value: stats.total_tags },
        ].map(item => (
          <div key={item.label} className="bg-surface border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-mono font-bold text-accent">{item.value}</p>
            <p className="text-xs text-muted mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Per category bar chart */}
      <div className="mb-8">
        <h3 className="text-xs text-muted uppercase tracking-wider mb-3">Terms per Category</h3>
        <div className="space-y-2">
          {stats.per_category.map(cat => (
            <div key={cat.id} className="flex items-center gap-3">
              <span className="text-xs text-muted w-40 truncate flex-shrink-0">{cat.name}</span>
              <div className="flex-1 bg-code rounded-full h-1.5">
                <div
                  className="bg-accent h-1.5 rounded-full transition-all"
                  style={{ width: `${(cat.term_count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted w-6 text-right flex-shrink-0">{cat.term_count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent + Favorites */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-xs text-muted uppercase tracking-wider mb-3">Recently Added</h3>
          <ul className="space-y-1">
            {stats.recent_terms.map(t => (
              <li key={t.id}>
                <button
                  onClick={() => onSelectTerm(t.slug)}
                  className="text-sm text-text hover:text-accent transition-colors font-mono"
                >
                  {t.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs text-muted uppercase tracking-wider mb-3">Top Favorites</h3>
          {stats.top_favorites.length === 0
            ? <p className="text-xs text-muted">No favorites yet</p>
            : (
              <ul className="space-y-1">
                {stats.top_favorites.map(t => (
                  <li key={t.id}>
                    <button
                      onClick={() => onSelectTerm(t.slug)}
                      className="text-sm text-text hover:text-accent transition-colors font-mono"
                    >
                      ★ {t.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
        </div>
      </div>
    </div>
  )
}
