import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useTrip } from '../../context'
import { uid, fmtCurrency } from '../../lib/utils'
import type { ExpenseItem } from '../../types'

const CATEGORIES = ['transport', 'food', 'lodging', 'activity', 'other'] as const
const CAT_EMOJI: Record<string, string> = {
  transport: '🚗', food: '🍽️', lodging: '🏠', activity: '🎯', other: '📦'
}

export function Expenses() {
  const { state, dispatch } = useTrip()
  const { expenses, groups } = state
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<Partial<ExpenseItem>>({
    category: 'other',
    currency: 'USD',
    splitBetween: groups.map(g => g.id),
    date: new Date().toISOString().slice(0, 10),
  })

  const groupMap = Object.fromEntries(groups.map(g => [g.id, g]))

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  // Per-group settlement calculation
  const balances: Record<string, number> = {}
  groups.forEach(g => { balances[g.id] = 0 })
  expenses.forEach(exp => {
    const split = exp.splitBetween.length > 0 ? exp.splitBetween : groups.map(g => g.id)
    const share = exp.amount / split.length
    if (balances[exp.paidBy] !== undefined) balances[exp.paidBy] += exp.amount
    split.forEach(gid => {
      if (balances[gid] !== undefined) balances[gid] -= share
    })
  })

  function toggleSplit(id: string) {
    setForm(f => ({
      ...f,
      splitBetween: (f.splitBetween ?? []).includes(id)
        ? (f.splitBetween ?? []).filter(x => x !== id)
        : [...(f.splitBetween ?? []), id],
    }))
  }

  function saveExpense() {
    if (!form.description?.trim() || !form.amount || !form.paidBy) return
    dispatch({
      type: 'ADD_EXPENSE',
      expense: {
        id: 'exp-' + uid(),
        description: form.description.trim(),
        amount: form.amount,
        currency: form.currency ?? 'USD',
        paidBy: form.paidBy,
        splitBetween: form.splitBetween ?? groups.map(g => g.id),
        date: form.date ?? new Date().toISOString().slice(0, 10),
        category: form.category ?? 'other',
      },
    })
    setAdding(false)
    setForm({
      category: 'other',
      currency: 'USD',
      splitBetween: groups.map(g => g.id),
      date: new Date().toISOString().slice(0, 10),
    })
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-ops-text mb-0.5">Expenses</h2>
          <p className="text-xs text-ops-muted">Track costs and settle up between groups.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ops-muted">Total: <span className="text-ops-text font-medium">{fmtCurrency(total)}</span></span>
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-ops-accent hover:bg-ops-accent-hover text-white text-xs font-medium rounded-md transition-colors"
          >
            <Plus size={13} />
            Add
          </button>
        </div>
      </div>

      {/* Settlement summary */}
      {groups.length > 0 && expenses.length > 0 && (
        <div className="mb-5 grid grid-cols-3 gap-3">
          {groups.map(g => {
            const bal = balances[g.id] ?? 0
            const isPos = bal > 0.01
            const isNeg = bal < -0.01
            return (
              <div key={g.id} className="rounded-lg border border-ops-border p-3 bg-ops-bg">
                <div className="flex items-center gap-1.5 mb-1">
                  <span>{g.emoji}</span>
                  <span className="text-xs font-medium text-ops-text truncate">{g.name}</span>
                </div>
                <p className={`text-sm font-semibold font-mono
                  ${isPos ? 'text-ops-accent' : isNeg ? 'text-ops-danger' : 'text-ops-muted'}`}>
                  {isPos ? '+' : ''}{fmtCurrency(bal)}
                </p>
                <p className="text-[10px] text-ops-muted mt-0.5">
                  {isPos ? 'is owed back' : isNeg ? 'owes' : 'settled'}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Expense list */}
      <div className="space-y-2">
        {expenses.map(exp => (
          <ExpenseRow
            key={exp.id}
            exp={exp}
            groupMap={groupMap}
            onDelete={() => dispatch({ type: 'REMOVE_EXPENSE', id: exp.id })}
          />
        ))}
      </div>

      {expenses.length === 0 && !adding && (
        <p className="text-ops-muted text-sm text-center py-12">No expenses logged yet.</p>
      )}

      {/* Add form */}
      {adding && (
        <div className="mt-4 border border-ops-accent/40 rounded-lg p-4 bg-ops-bg space-y-3">
          <input className="input" placeholder="Description" value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-ops-muted mb-1">Amount (USD)</p>
              <input type="number" className="input" placeholder="0.00" value={form.amount ?? ''} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || undefined }))} />
            </div>
            <div>
              <p className="text-[10px] text-ops-muted mb-1">Category</p>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ExpenseItem['category'] }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_EMOJI[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-ops-muted mb-1.5">Paid by</p>
            <div className="flex flex-wrap gap-2">
              {groups.map(g => (
                <button key={g.id} onClick={() => setForm(f => ({ ...f, paidBy: g.id }))}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-colors
                    ${form.paidBy === g.id ? 'border-ops-accent bg-ops-accent/10 text-ops-text' : 'border-ops-border text-ops-muted hover:text-ops-text'}`}>
                  {g.emoji} {g.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] text-ops-muted mb-1.5">Split between</p>
            <div className="flex flex-wrap gap-2">
              {groups.map(g => (
                <button key={g.id} onClick={() => toggleSplit(g.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-colors
                    ${(form.splitBetween ?? []).includes(g.id) ? 'border-ops-info bg-ops-info/10 text-ops-text' : 'border-ops-border text-ops-muted hover:text-ops-text'}`}>
                  {g.emoji} {g.name}
                </button>
              ))}
            </div>
          </div>
          <input type="date" className="input w-40" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <div className="flex gap-2">
            <button onClick={saveExpense} className="px-3 py-1.5 bg-ops-accent hover:bg-ops-accent-hover text-white text-xs rounded-md transition-colors">Add Expense</button>
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 border border-ops-border text-ops-muted text-xs rounded-md hover:text-ops-text transition-colors">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

function ExpenseRow({ exp, groupMap, onDelete }: {
  exp: ExpenseItem
  groupMap: Record<string, import('../../types').Group>
  onDelete: () => void
}) {
  const paidBy = groupMap[exp.paidBy]
  const splitNames = exp.splitBetween.map(id => groupMap[id]?.emoji).filter(Boolean).join(' ')

  return (
    <div className="group flex items-center gap-3 py-2.5 px-3 rounded-md hover:bg-ops-bg/50 border border-ops-border transition-all">
      <span className="text-lg shrink-0">{CAT_EMOJI[exp.category]}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-ops-text truncate">{exp.description}</span>
          <span className="text-xs font-mono font-semibold text-ops-text shrink-0">{fmtCurrency(exp.amount)}</span>
        </div>
        <p className="text-xs text-ops-muted">
          Paid by {paidBy?.emoji} {paidBy?.name}
          {exp.splitBetween.length > 0 && <span> · split {splitNames}</span>}
        </p>
      </div>
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 shrink-0 text-ops-muted hover:text-ops-danger transition-all">
        <Trash2 size={13} />
      </button>
    </div>
  )
}
