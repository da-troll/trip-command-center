import { Settings, Users, Map, Calendar, UtensilsCrossed, Receipt, Rocket, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTrip } from '../context'
import { useShell } from '../App'
import type { ModuleId } from '../types'

const NAV: { id: ModuleId; label: string; icon: React.ReactNode }[] = [
  { id: 'setup', label: 'Setup', icon: <Settings size={16} /> },
  { id: 'groups', label: 'Groups', icon: <Users size={16} /> },
  { id: 'routes', label: 'Routes', icon: <Map size={16} /> },
  { id: 'itinerary', label: 'Itinerary', icon: <Calendar size={16} /> },
  { id: 'meals', label: 'Meals', icon: <UtensilsCrossed size={16} /> },
  { id: 'expenses', label: 'Expenses', icon: <Receipt size={16} /> },
]

function NavContent() {
  const { state, dispatch } = useTrip()
  const { setSidebarOpen } = useShell()

  function navigate(id: ModuleId) {
    dispatch({ type: 'SET_MODULE', module: id })
    setSidebarOpen(false)
  }

  return (
    <>
      <div className="flex-1 py-2">
        {NAV.map(item => (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-all text-left
              ${state.activeModule === item.id
                ? 'bg-white/[0.06] text-ops-text border-r-2 border-ops-accent'
                : 'text-ops-muted hover:text-ops-text hover:bg-white/[0.04]'
              }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <div className="px-3 pb-3">
        <button
          onClick={() => navigate('launch')}
          className={`w-full flex items-center gap-2.5 px-3 py-3 text-sm rounded-lg transition-all
            ${state.activeModule === 'launch'
              ? 'glass-btn-accent'
              : 'text-ops-muted glass-btn hover:text-white hover:bg-ops-accent/20'
            }`}
        >
          <Rocket size={16} />
          Mission Launch
        </button>
      </div>
    </>
  )
}

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useShell()

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex w-48 glass border-r border-white/[0.06] flex-col shrink-0">
        <NavContent />
      </nav>

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-64 glass-heavy z-50 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between px-4 h-14 border-b border-white/[0.06]">
                <span className="text-sm font-semibold text-ops-text">Navigation</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="touch-target text-ops-muted hover:text-ops-text transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <NavContent />
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
