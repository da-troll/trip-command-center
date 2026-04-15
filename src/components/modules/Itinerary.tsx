import { useState } from 'react'
import { Plus, Trash2, Clock } from 'lucide-react'
import { useTrip } from '../../context'
import { uid, fmtDate, dateRange } from '../../lib/utils'
import type { DayBlock } from '../../types'

const TYPE_CONFIG = {
  activity: { label: 'Activity', color: 'text-ops-info border-ops-info/20 bg-ops-info/10' },
  meal: { label: 'Meal', color: 'text-ops-warning border-ops-warning/20 bg-ops-warning/10' },
  travel: { label: 'Travel', color: 'text-ops-muted border-white/10 bg-white/[0.04]' },
  lodging: { label: 'Lodging', color: 'text-purple-400 border-purple-500/20 bg-purple-500/10' },
  free: { label: 'Free', color: 'text-ops-accent border-ops-accent/20 bg-ops-accent/10' },
} as const

const BLANK: Partial<DayBlock> = { type: 'activity', groupIds: [] }

export function Itinerary() {
  const { state, dispatch } = useTrip()
  const { itinerary, setup, groups } = state
  const [adding, setAdding] = useState(false)
  const [addDate, setAddDate] = useState(setup.startDate)
  const [form, setForm] = useState<Partial<DayBlock>>(BLANK)

  const days = dateRange(setup.startDate, setup.endDate)

  function saveBlock() {
    if (!form.title?.trim()) return
    dispatch({
      type: 'ADD_DAY_BLOCK',
      block: {
        id: 'ev-' + uid(),
        date: addDate,
        title: form.title.trim(),
        description: form.description,
        time: form.time,
        type: form.type ?? 'activity',
        groupIds: form.groupIds ?? [],
        location: form.location,
      },
    })
    setAdding(false)
    setForm(BLANK)
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-ops-text mb-0.5">Itinerary</h2>
          <p className="text-xs text-ops-muted">Day-by-day schedule for the crew.</p>
        </div>
        <button onClick={() => setAdding(true)} className="glass-btn-accent flex items-center gap-1.5 !text-xs !py-1.5">
          <Plus size={13} />
          <span className="hidden sm:inline">Add Event</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {days.map(date => {
        const events = itinerary
          .filter(b => b.date === date)
          .sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'))

        return (
          <div key={date} className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-xs font-semibold text-ops-text">{fmtDate(date)}</div>
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[10px] text-white/20">{events.length} event{events.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="space-y-2 pl-0 sm:pl-1">
              {events.map(block => (
                <EventRow
                  key={block.id}
                  block={block}
                  groups={groups}
                  onDelete={() => dispatch({ type: 'REMOVE_DAY_BLOCK', id: block.id })}
                />
              ))}
              {events.length === 0 && (
                <p className="text-xs text-white/15 italic pl-1">Nothing scheduled</p>
              )}
            </div>
          </div>
        )
      })}

      {adding && (
        <div className="mt-4 glass-card p-4 space-y-3 border-ops-accent/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-ops-muted mb-1">Date</p>
              <select className="input" value={addDate} onChange={e => setAddDate(e.target.value)}>
                {days.map(d => <option key={d} value={d}>{fmtDate(d)}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[10px] text-ops-muted mb-1">Time (optional)</p>
              <input type="time" className="input" value={form.time ?? ''} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
            </div>
          </div>
          <input className="input" placeholder="Event title" value={form.title ?? ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <textarea className="input resize-none h-16" placeholder="Description (optional)" value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <input className="input" placeholder="Location (optional)" value={form.location ?? ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          <div>
            <p className="text-[10px] text-ops-muted mb-1">Type</p>
            <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as DayBlock['type'] }))}>
              {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={saveBlock} className="glass-btn-accent !text-xs">Add Event</button>
            <button onClick={() => setAdding(false)} className="glass-btn !text-xs text-ops-muted">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

function EventRow({ block, groups, onDelete }: { block: DayBlock; groups: import('../../types').Group[]; onDelete: () => void }) {
  const cfg = TYPE_CONFIG[block.type]
  const groupMap = Object.fromEntries(groups.map(g => [g.id, g]))

  return (
    <div className="group flex items-start gap-2 sm:gap-3 py-2.5 px-3 rounded-lg glass-card-hover">
      <div className="w-10 sm:w-12 shrink-0 pt-0.5">
        {block.time ? (
          <div className="flex items-center gap-1 text-[10px] text-ops-muted font-mono">
            <Clock size={10} />
            {block.time}
          </div>
        ) : null}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-ops-text">{block.title}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${cfg.color}`}>{cfg.label}</span>
          {block.groupIds.length > 0 && block.groupIds.map(gid => {
            const g = groupMap[gid]
            return g ? <span key={gid} className="text-[10px] text-ops-muted">{g.emoji}</span> : null
          })}
        </div>
        {block.description && <p className="text-xs text-ops-muted mt-0.5">{block.description}</p>}
        {block.location && <p className="text-[10px] text-white/20 mt-0.5">📍 {block.location}</p>}
      </div>

      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 shrink-0 text-ops-muted hover:text-ops-danger transition-all p-1"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}
