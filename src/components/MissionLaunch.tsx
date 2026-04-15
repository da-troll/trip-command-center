import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, AlertCircle, MapPin, Users, Calendar, UtensilsCrossed, Receipt, Route } from 'lucide-react'
import { useTrip } from '../context'
import { fmtDate, fmtCurrency, dateRange } from '../lib/utils'

export function MissionLaunch() {
  const { state, dispatch } = useTrip()
  const { setup, groups, routes, itinerary, meals, expenses } = state

  const days = dateRange(setup.startDate, setup.endDate)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const coveredDays = new Set(itinerary.map(b => b.date)).size

  const checks: { label: string; ok: boolean; detail: string; icon: React.ReactNode }[] = [
    {
      label: 'Trip details',
      ok: !!setup.name && !!setup.destination && !!setup.startDate && !!setup.endDate,
      detail: setup.destination || 'No destination set',
      icon: <MapPin size={14} />,
    },
    {
      label: 'Groups defined',
      ok: groups.length >= 2,
      detail: `${groups.length} group${groups.length !== 1 ? 's' : ''}, ${groups.reduce((s, g) => s + g.members.length, 0)} members total`,
      icon: <Users size={14} />,
    },
    {
      label: 'Routes mapped',
      ok: routes.length > 0,
      detail: routes.length > 0 ? `${routes.length} route${routes.length !== 1 ? 's' : ''} planned` : 'No routes defined',
      icon: <Route size={14} />,
    },
    {
      label: 'Itinerary coverage',
      ok: coveredDays >= Math.ceil(days.length * 0.5),
      detail: `${coveredDays}/${days.length} days have events`,
      icon: <Calendar size={14} />,
    },
    {
      label: 'Meals assigned',
      ok: meals.length >= days.length,
      detail: `${meals.length} meal${meals.length !== 1 ? 's' : ''} planned`,
      icon: <UtensilsCrossed size={14} />,
    },
    {
      label: 'Budget tracked',
      ok: expenses.length > 0,
      detail: expenses.length > 0 ? `${fmtCurrency(totalExpenses)} tracked across ${expenses.length} items` : 'No expenses logged',
      icon: <Receipt size={14} />,
    },
  ]

  const readyCount = checks.filter(c => c.ok).length
  const allGreen = readyCount === checks.length

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
        onClick={() => dispatch({ type: 'SET_MODULE', module: 'setup' })}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="bg-ops-surface border border-ops-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-ops-border flex items-start justify-between">
            <div>
              <div className="text-3xl mb-2">{setup.coverEmoji}</div>
              <h2 className="text-lg font-bold text-ops-text">{setup.name}</h2>
              <p className="text-xs text-ops-muted mt-0.5">{setup.destination}</p>
              {setup.startDate && setup.endDate && (
                <p className="text-xs text-ops-muted mt-0.5">
                  {fmtDate(setup.startDate)} → {fmtDate(setup.endDate)}
                </p>
              )}
            </div>
            <button
              onClick={() => dispatch({ type: 'SET_MODULE', module: 'setup' })}
              className="text-ops-muted hover:text-ops-text transition-colors p-1"
            >
              <X size={18} />
            </button>
          </div>

          {/* Readiness */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-ops-muted uppercase tracking-wider">Mission Readiness</p>
              <span className={`text-sm font-bold ${allGreen ? 'text-ops-accent' : 'text-ops-warning'}`}>
                {readyCount}/{checks.length}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-ops-border rounded-full mb-5 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${allGreen ? 'bg-ops-accent' : 'bg-ops-warning'}`}
                initial={{ width: 0 }}
                animate={{ width: `${(readyCount / checks.length) * 100}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>

            <div className="space-y-2.5">
              {checks.map(check => (
                <div key={check.label} className="flex items-start gap-3">
                  <span className={check.ok ? 'text-ops-accent mt-0.5' : 'text-ops-muted mt-0.5'}>
                    {check.ok
                      ? <CheckCircle2 size={15} />
                      : <AlertCircle size={15} />
                    }
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${check.ok ? 'text-ops-text' : 'text-ops-muted'}`}>
                        {check.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-ops-border mt-0.5">{check.detail}</p>
                  </div>
                  <span className={`text-ops-muted shrink-0 mt-0.5 ${check.ok ? 'text-ops-accent' : ''}`}>
                    {check.icon}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Groups summary */}
          {groups.length > 0 && (
            <div className="px-6 pb-4">
              <p className="text-[10px] text-ops-muted uppercase tracking-wider mb-2">Crews</p>
              <div className="flex flex-wrap gap-2">
                {groups.map(g => (
                  <div
                    key={g.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs"
                    style={{ borderColor: g.color + '44', backgroundColor: g.color + '11', color: g.color }}
                  >
                    {g.emoji} {g.name}
                    <span className="text-[10px] opacity-60">({g.members.length})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t border-ops-border bg-ops-bg/50">
            {allGreen ? (
              <p className="text-xs text-ops-accent text-center">
                All systems go. Time to pack the bags. 🚀
              </p>
            ) : (
              <p className="text-xs text-ops-muted text-center">
                {checks.length - readyCount} item{checks.length - readyCount !== 1 ? 's' : ''} need attention before launch.
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
