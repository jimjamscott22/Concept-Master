interface EmptyStateProps {
  query?: string
}

export function EmptyState({ query }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-muted">
      <span className="text-4xl mb-4 font-mono">∅</span>
      {query
        ? <p className="text-sm">No terms matching <span className="text-accent font-mono">"{query}"</span></p>
        : <p className="text-sm">No terms yet. Add your first one!</p>
      }
    </div>
  )
}
