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
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-ops-text mb-0.5">Meals</h2>
          <p className="text-xs text-ops-muted">Who's cooking what, and when.</p>
        </div>
        <div className="flex items-center gap-3">
          {totalCost > 0 && (
            <span className="text-xs text-ops-muted">Food budget: <span className="text-ops-text">{fmtCurrency(totalCost)}</span></span>
          )}
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-ops-accent hover:bg-ops-accent-hover text-white text-xs font-medium rounded-md transition-colors"
          >
            <Plus size={13} />
            Add Meal
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
              <div className="flex-1 h-px bg-ops-border" />
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
        <div className="mt-4 border border-ops-accent/40 rounded-lg p-4 bg-ops-bg space-y-3">
          <div className="grid grid-cols-2 gap-3">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-ops-muted mb-1">Estimated cost (optional)</p>
              <input type="number" className="input" placeholder="0.00" value={form.cost ?? ''} onChange={e => setForm(f => ({ ...f, cost: e.target.value ? parseFloat(e.target.value) : undefined }))} />
            </div>
          </div>
          <div>
            <p className="text-[10px] text-ops-muted mb-1.5">Assigned to (leave empty = everyone)</p>
            <div className="flex flex-wrap gap-2">
              {groups.map(g => (
                <button
                  key={g.id}
                  onClick={() => toggleGroup(g.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-colors
                    ${(form.assignedGroupIds ?? []).includes(g.id)
                      ? 'border-ops-accent bg-ops-accent/10 text-ops-text'
                      : 'border-ops-border text-ops-muted hover:text-ops-text'
                    }`}
                >
                  {g.emoji} {g.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={saveMeal} className="px-3 py-1.5 bg-ops-accent hover:bg-ops-accent-hover text-white text-xs rounded-md transition-colors">Add Meal</button>
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 border border-ops-border text-ops-muted text-xs rounded-md hover:text-ops-text transition-colors">Cancel</button>
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
    <div className="group flex items-start gap-3 py-2.5 px-3 rounded-md hover:bg-ops-bg/50 border border-ops-border transition-all">
      <span className="text-lg shrink-0">{MEAL_EMOJI[meal.mealType]}</span>
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
          <p className="text-xs text-ops-border mt-0.5 italic">Everyone pitches in</p>
        )}
        {meal.notes && <p className="text-xs text-ops-muted mt-0.5">{meal.notes}</p>}
      </div>
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 shrink-0 text-ops-muted hover:text-ops-danger transition-all">
        <Trash2 size={13} />
      </button>
    </div>
  )
}
