import type React from "react"

interface LayoutProps {
  sidebar: React.ReactNode
  children: React.ReactNode
}

export function Layout({ sidebar, children }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <aside className="w-64 flex-shrink-0 border-r border-border bg-surface overflow-y-auto">
        {sidebar}
      </aside>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
