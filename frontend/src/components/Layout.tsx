import type React from "react"
import { useState } from "react"

interface LayoutProps {
  sidebar: React.ReactNode
  children: React.ReactNode
}

export function Layout({ sidebar, children }: LayoutProps) {
  const [open, setOpen] = useState(true)

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <aside
        className={`relative flex-shrink-0 border-r border-border bg-surface overflow-hidden transition-all duration-200 ${open ? "w-64" : "w-10"}`}
      >
        {/* Sidebar content — fixed width so it doesn't reflow during animation */}
        <div className="w-64 h-full overflow-y-auto">
          {sidebar}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setOpen(v => !v)}
          title={open ? "Collapse sidebar" : "Expand sidebar"}
          className="absolute top-3 right-2 w-5 h-5 flex items-center justify-center rounded text-muted hover:text-text hover:bg-white/5 transition-colors text-xs font-mono"
        >
          {open ? "‹" : "›"}
        </button>
      </aside>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
