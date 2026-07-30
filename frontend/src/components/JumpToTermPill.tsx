interface JumpToTermPillProps {
  onClick: () => void
}

export function JumpToTermPill({ onClick }: JumpToTermPillProps) {
  return (
    <button
      onClick={onClick}
      className="fixed right-[26px] bottom-[26px] z-50 h-[46px] px-5 rounded-full border border-line
                 bg-bg2 text-fg2 text-[13px] hover:border-accent hover:text-fg transition-colors flex items-center gap-2"
      style={{ boxShadow: "0 10px 30px rgba(0,0,0,.28)" }}
    >
      ⌕ Jump to term <span className="text-[10.5px] border border-line rounded px-[5px] py-px">CTRL+K</span>
    </button>
  )
}
