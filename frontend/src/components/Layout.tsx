import type React from "react"
import { useState } from "react"
import { ThemePicker } from "./ThemePicker"

interface LayoutProps {
  sidebar: React.ReactNode
  header?: React.ReactNode
  children: React.ReactNode
}

export function Layout({ sidebar, header, children }: LayoutProps) {
  const [open, setOpen] = useState(true)

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg">
      {/* Site header — always visible, hosts the sidebar toggle so the user can
          never get stranded with the sidebar collapsed. */}
      <header className="relative flex-shrink-0 h-14 flex items-stretch
                         border-b border-border bg-surface/60 backdrop-blur-sm
                         z-20">
        {/* Sidebar toggle: prominent, terminal-styled, animated bars that
            morph from a hamburger into a left-chevron when expanded. */}
        <button
          onClick={() => setOpen(v => !v)}
          title={open ? "Collapse sidebar (press to hide)" : "Expand sidebar"}
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={open}
          className="group relative w-14 h-full flex items-center justify-center
                     border-r border-border text-muted hover:text-accent
                     hover:bg-accent/5 transition-colors"
        >
          <span className="relative w-5 h-5 flex flex-col justify-center items-center gap-[3px]">
            <span className={`block h-[2px] bg-current rounded-full transition-all duration-200
                              ${open ? "w-3 -translate-x-1 -rotate-45 translate-y-[5px]" : "w-5"}`} />
            <span className={`block h-[2px] bg-current rounded-full transition-all duration-200
                              ${open ? "w-5" : "w-5"}`} />
            <span className={`block h-[2px] bg-current rounded-full transition-all duration-200
                              ${open ? "w-3 -translate-x-1 rotate-45 -translate-y-[5px]" : "w-5"}`} />
          </span>
          {/* Left edge accent indicator on hover */}
          <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r
                           bg-accent/0 group-hover:bg-accent transition-colors" />
        </button>

        {/* Brand */}
        <div className="flex items-center pl-4 pr-6 select-none">
          <span className="text-accent font-mono font-bold text-sm tracking-tight">
            &gt; concept-master
          </span>
          <span className="ml-1 w-1.5 h-4 bg-accent/80 caret-blink" aria-hidden />
        </div>

        {/* Primary nav slot */}
        <div className="flex-1 flex items-stretch">
          {header}
        </div>

        {/* Right-side utility: theme picker, inline */}
        <div className="flex items-center pr-3 pl-2 border-l border-border">
          <ThemePicker />
        </div>
      </header>

      {/* Body row: collapsible sidebar + main content */}
      <div className="relative flex flex-1 overflow-hidden">
        <aside
          className={`relative flex-shrink-0 border-r border-border bg-surface
                      overflow-hidden transition-[width] duration-200 ease-out
                      ${open ? "w-64" : "w-0"}`}
        >
          {/* Fixed inner width so contents don't reflow during the collapse animation */}
          <div className="w-64 h-full overflow-y-auto">
            {sidebar}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
