import { Rocket } from 'lucide-react'
import { useTrip } from '../context'

export function Header() {
  const { state, dispatch } = useTrip()
  const { setup } = state

  return (
    <header className="h-14 bg-ops-surface border-b border-ops-border flex items-center px-5 gap-4 shrink-0">
      <span className="text-xl">{setup.coverEmoji}</span>
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-ops-text truncate">{setup.name}</h1>
        <p className="text-xs text-ops-muted truncate">{setup.destination}</p>
      </div>
      <button
        onClick={() => dispatch({ type: 'SET_MODULE', module: 'launch' })}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-ops-accent hover:bg-ops-accent-hover text-white text-xs font-medium transition-colors"
      >
        <Rocket size={12} />
        Launch
      </button>
    </header>
  )
}
