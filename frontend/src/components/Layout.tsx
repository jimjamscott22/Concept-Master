import type React from "react"

interface LayoutProps {
  sidebar: React.ReactNode
  header?: React.ReactNode
  children: React.ReactNode
}

export function Layout({ sidebar, header, children }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg">
      <header className="relative flex-shrink-0 h-14 flex items-center gap-[22px] px-[18px]
                         border-b border-line bg-bg2 z-40">
        <div className="flex items-center gap-[9px] select-none whitespace-nowrap">
          <span className="text-accent font-mono font-bold">&gt;</span>
          <span className="font-mono font-bold tracking-[-0.01em] text-fg">concept-master</span>
        </div>
        {header}
      </header>

      <div className="relative flex flex-1 overflow-hidden">
        {sidebar && (
          <aside className="relative flex-shrink-0 w-64 border-r border-line bg-bg2 overflow-y-auto">
            {sidebar}
          </aside>
        )}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
