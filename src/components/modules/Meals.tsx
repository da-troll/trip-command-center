import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useTrip } from '../../context'
import { uid, fmtDate, fmtCurrency, dateRange } from '../../lib/utils'
import type { MealSlot } from '../../types'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
const MEAL_EMOJI: Record<string, string> = {
  breakfast: '🍳', lunch: '🥗', dinner: '🍽️', snack: '🍎'
}

const BLANK: Partial<MealSlot> = { mealType: 'dinner', assignedGroupIds: [] }

export function Meals() {
  const { state, dispatch } = useTrip()
  const { meals, setup, groups } = state
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<Partial<MealSlot>>({ ...BLANK, date: setup.startDate })

  const days = dateRange(setup.startDate, setup.endDate)
  const groupMap = Object.fromEntries(groups.map(g => [g.id, g]))

  function toggleGroup(id: string) {
    setForm(f => ({
      ...f,
      assignedGroupIds: (f.assignedGroupIds ?? []).includes(id)
        ? (f.assignedGroupIds ?? []).filter(x => x !== id)
        : [...(f.assignedGroupIds ?? []), id],
    }))
  }

  function saveMeal() {
    if (!form.title?.trim() || !form.date) return
    dispatch({
      type: 'ADD_MEAL',
      meal: {
        id: 'ml-' + uid(),
        date: form.date,
        mealType: form.mealType ?? 'dinner',
        title: form.title.trim(),
        assignedGroupIds: form.assignedGroupIds ?? [],
        notes: form.notes,
        cost: form.cost,
      },
    })
    setAdding(false)
    setForm({ ...BLANK, date: setup.startDate })
  }

  const totalCost = meals.reduce((s, m) => s + (m.cost ?? 0), 0)

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6 gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ops-text mb-0.5">Meals</h2>
          <p className="text-xs text-ops-muted">Who's cooking what, and when.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {totalCost > 0 && (
            <span className="text-xs text-ops-muted hidden sm:inline">Budget: <span className="text-ops-text">{fmtCurrency(totalCost)}</span></span>
          )}
          <button onClick={() => setAdding(true)} className="glass-btn-accent flex items-center gap-1.5 !text-xs !py-1.5">
            <Plus size={13} />
            <span className="hidden sm:inline">Add Meal</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {days.map(date => {
        const dayMeals = meals.filter(m => m.date === date)
          .sort((a, b) => MEAL_TYPES.indexOf(a.mealType) - MEAL_TYPES.indexOf(b.mealType))
        if (dayMeals.length === 0) return null

        return (
          <div key={date} className="mb-5">
            <div className="flex items-center gap-3 mb-2">
              <p className="text-xs font-semibold text-ops-text">{fmtDate(date)}</p>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>
            <div className="space-y-2">
              {dayMeals.map(meal => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  groupMap={groupMap}
                  onDelete={() => dispatch({ type: 'REMOVE_MEAL', id: meal.id })}
                />
              ))}
            </div>
          </div>
        )
      })}

      {meals.length === 0 && !adding && (
        <p className="text-ops-muted text-sm text-center py-12">No meals planned yet.</p>
      )}

      {adding && (
        <div className="mt-4 glass-card p-4 space-y-3 border-ops-accent/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-ops-muted mb-1">Date</p>
              <select className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}>
                {days.map(d => <option key={d} value={d}>{fmtDate(d)}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[10px] text-ops-muted mb-1">Meal</p>
              <select className="input" value={form.mealType} onChange={e => setForm(f => ({ ...f, mealType: e.target.value as MealSlot['mealType'] }))}>
                {MEAL_TYPES.map(t => <option key={t} value={t}>{MEAL_EMOJI[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <input className="input" placeholder="Meal title" value={form.title ?? ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <textarea className="input resize-none h-16" placeholder="Notes (dietary needs, what to bring...)" value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div>
            <p className="text-[10px] text-ops-muted mb-1">Estimated cost (optional)</p>
            <input type="number" className="input" placeholder="0.00" value={form.cost ?? ''} onChange={e => setForm(f => ({ ...f, cost: e.target.value ? parseFloat(e.target.value) : undefined }))} />
          </div>
          <div>
            <p className="text-[10px] text-ops-muted mb-1.5">Assigned to (leave empty = everyone)</p>
            <div className="flex flex-wrap gap-2">
              {groups.map(g => (
                <button
                  key={g.id}
                  onClick={() => toggleGroup(g.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all
                    ${(form.assignedGroupIds ?? []).includes(g.id)
                      ? 'glass-card border-ops-accent/40 bg-ops-accent/10 text-ops-text'
                      : 'glass-card text-ops-muted hover:text-ops-text'
                    }`}
                >
                  {g.emoji} {g.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={saveMeal} className="glass-btn-accent !text-xs">Add Meal</button>
            <button onClick={() => setAdding(false)} className="glass-btn !text-xs text-ops-muted">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

function MealCard({ meal, groupMap, onDelete }: {
  meal: MealSlot
  groupMap: Record<string, import('../../types').Group>
  onDelete: () => void
}) {
  return (
    <div className="group flex items-start gap-2.5 sm:gap-3 py-2.5 px-3 rounded-lg glass-card-hover">
      <span className="text-lg shrink-0 mt-0.5">{MEAL_EMOJI[meal.mealType]}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-ops-text">{meal.title}</span>
          <span className="text-[10px] text-ops-muted capitalize">{meal.mealType}</span>
          {meal.cost != null && (
            <span className="text-[10px] text-ops-warning">{fmtCurrency(meal.cost)}</span>
          )}
        </div>
        {meal.assignedGroupIds.length > 0 && (
          <p className="text-xs text-ops-muted mt-0.5">
            {meal.assignedGroupIds.map(id => groupMap[id]?.emoji + ' ' + groupMap[id]?.name).join(', ')} cooking
          </p>
        )}
        {meal.assignedGroupIds.length === 0 && (
          <p className="text-xs text-white/15 mt-0.5 italic">Everyone pitches in</p>
        )}
        {meal.notes && <p className="text-xs text-ops-muted mt-0.5">{meal.notes}</p>}
      </div>
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 shrink-0 text-ops-muted hover:text-ops-danger transition-all p-1">
        <Trash2 size={13} />
      </button>
    </div>
  )
}
