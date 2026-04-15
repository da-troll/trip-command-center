import { Rocket, Menu } from 'lucide-react'
import { useTrip } from '../context'
import { useShell } from '../App'

export function Header() {
  const { state, dispatch } = useTrip()
  const { sidebarOpen, setSidebarOpen } = useShell()
  const { setup } = state

  return (
    <header className="h-14 glass-heavy border-b border-white/[0.06] flex items-center px-4 md:px-5 gap-3 shrink-0 relative z-30">
      {/* Hamburger — mobile only */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden touch-target text-ops-muted hover:text-ops-text transition-colors"
      >
        <Menu size={20} />
      </button>

      <span className="text-xl">{setup.coverEmoji}</span>
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-ops-text truncate">{setup.name}</h1>
        <p className="text-xs text-ops-muted truncate hidden sm:block">{setup.destination}</p>
      </div>
      <button
        onClick={() => dispatch({ type: 'SET_MODULE', module: 'launch' })}
        className="glass-btn-accent flex items-center gap-1.5 !py-1.5 !px-3 !text-xs"
      >
        <Rocket size={12} />
        <span className="hidden sm:inline">Launch</span>
      </button>
    </header>
  )
}
