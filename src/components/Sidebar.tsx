import { Settings, Users, Map, Calendar, UtensilsCrossed, Receipt, Rocket } from 'lucide-react'
import { useTrip } from '../context'
import type { ModuleId } from '../types'

const NAV: { id: ModuleId; label: string; icon: React.ReactNode }[] = [
  { id: 'setup', label: 'Setup', icon: <Settings size={16} /> },
  { id: 'groups', label: 'Groups', icon: <Users size={16} /> },
  { id: 'routes', label: 'Routes', icon: <Map size={16} /> },
  { id: 'itinerary', label: 'Itinerary', icon: <Calendar size={16} /> },
  { id: 'meals', label: 'Meals', icon: <UtensilsCrossed size={16} /> },
  { id: 'expenses', label: 'Expenses', icon: <Receipt size={16} /> },
]

export function Sidebar() {
  const { state, dispatch } = useTrip()

  return (
    <nav className="w-48 bg-ops-surface border-r border-ops-border flex flex-col py-3 shrink-0">
      {NAV.map(item => (
        <button
          key={item.id}
          onClick={() => dispatch({ type: 'SET_MODULE', module: item.id })}
          className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left
            ${state.activeModule === item.id
              ? 'bg-ops-bg text-ops-text border-r-2 border-ops-accent'
              : 'text-ops-muted hover:text-ops-text hover:bg-ops-bg/50'
            }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}

      <div className="mt-auto px-3 pb-2">
        <button
          onClick={() => dispatch({ type: 'SET_MODULE', module: 'launch' })}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-md transition-colors
            ${state.activeModule === 'launch'
              ? 'bg-ops-accent text-white'
              : 'text-ops-muted hover:text-white hover:bg-ops-accent/80'
            }`}
        >
          <Rocket size={16} />
          Mission Launch
        </button>
      </div>
    </nav>
  )
}
