import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useTrip } from '../../context'
import { uid } from '../../lib/utils'
import type { Group } from '../../types'

const COLORS = ['#388BFD', '#DA3633', '#D29922', '#238636', '#8957E5', '#F78166', '#56D364', '#79C0FF']
const EMOJIS = ['🌉', '🌴', '🎰', '🏔️', '🎸', '🍕', '🛸', '🦁', '🌊', '🎯', '🚀', '🔥']

export function Groups() {
  const { state, dispatch } = useTrip()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [newGroup, setNewGroup] = useState<Partial<Group>>({ color: COLORS[0], emoji: EMOJIS[0], members: [] })
  const [memberInput, setMemberInput] = useState('')

  function toggleExpand(id: string) {
    setExpanded(p => p === id ? null : id)
  }

  function addMember() {
    const name = memberInput.trim()
    if (!name) return
    setNewGroup(g => ({ ...g, members: [...(g.members ?? []), name] }))
    setMemberInput('')
  }

  function saveGroup() {
    if (!newGroup.name?.trim()) return
    dispatch({
      type: 'ADD_GROUP',
      group: {
        id: 'grp-' + uid(),
        name: newGroup.name.trim(),
        color: newGroup.color ?? COLORS[0],
        emoji: newGroup.emoji ?? EMOJIS[0],
        members: newGroup.members ?? [],
        origin: newGroup.origin,
      },
    })
    setAdding(false)
    setNewGroup({ color: COLORS[0], emoji: EMOJIS[0], members: [] })
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-ops-text mb-0.5">Groups</h2>
          <p className="text-xs text-ops-muted">Crews joining from different origins.</p>
        </div>
        <button onClick={() => setAdding(true)} className="glass-btn-accent flex items-center gap-1.5 !text-xs !py-1.5">
          <Plus size={13} />
          Add Group
        </button>
      </div>

      <div className="space-y-3">
        {state.groups.map(group => (
          <GroupCard
            key={group.id}
            group={group}
            expanded={expanded === group.id}
            onToggle={() => toggleExpand(group.id)}
            onDelete={() => dispatch({ type: 'REMOVE_GROUP', id: group.id })}
          />
        ))}

        {adding && (
          <div className="glass-card p-4 space-y-4 border-ops-accent/30">
            <p className="text-xs font-medium text-ops-text">New Group</p>

            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <p className="text-[10px] text-ops-muted mb-1.5">Emoji</p>
                <div className="flex flex-wrap gap-1.5">
                  {EMOJIS.map(e => (
                    <button
                      key={e}
                      onClick={() => setNewGroup(g => ({ ...g, emoji: e }))}
                      className={`w-9 h-9 text-sm rounded-lg transition-all
                        ${newGroup.emoji === e ? 'glass-card border-ops-accent/40 bg-ops-accent/10' : 'glass-card hover:bg-white/[0.06]'}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-ops-muted mb-1.5">Color</p>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setNewGroup(g => ({ ...g, color: c }))}
                      style={{ backgroundColor: c }}
                      className={`w-8 h-8 rounded-full border-2 transition-all
                        ${newGroup.color === c ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <input
              className="input"
              placeholder="Group name"
              value={newGroup.name ?? ''}
              onChange={e => setNewGroup(g => ({ ...g, name: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Origin city (optional)"
              value={newGroup.origin ?? ''}
              onChange={e => setNewGroup(g => ({ ...g, origin: e.target.value }))}
            />

            <div>
              <p className="text-[10px] text-ops-muted mb-1.5">Members</p>
              <div className="flex gap-2 mb-2">
                <input
                  className="input flex-1"
                  placeholder="Add member name"
                  value={memberInput}
                  onChange={e => setMemberInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addMember()}
                />
                <button onClick={addMember} className="glass-btn !text-xs">Add</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(newGroup.members ?? []).map(m => (
                  <span
                    key={m}
                    onClick={() => setNewGroup(g => ({ ...g, members: (g.members ?? []).filter(x => x !== m) }))}
                    className="glass-pill text-ops-text cursor-pointer hover:border-ops-danger/40 hover:text-ops-danger transition-colors"
                  >
                    {m} ×
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={saveGroup} className="glass-btn-accent !text-xs">Save</button>
              <button onClick={() => setAdding(false)} className="glass-btn !text-xs text-ops-muted">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {state.groups.length === 0 && !adding && (
        <p className="text-ops-muted text-sm text-center py-12">No groups yet. Add your first crew.</p>
      )}
    </div>
  )
}

function GroupCard({ group, expanded, onToggle, onDelete }: {
  group: Group
  expanded: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors text-left"
      >
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: group.color + '18', border: `1px solid ${group.color}33` }}
        >
          {group.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ops-text">{group.name}</p>
          <p className="text-xs text-ops-muted">{group.members.length} member{group.members.length !== 1 ? 's' : ''}
            {group.origin && <span> · {group.origin}</span>}
          </p>
        </div>
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
        {expanded ? <ChevronUp size={14} className="text-ops-muted" /> : <ChevronDown size={14} className="text-ops-muted" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/[0.06] bg-white/[0.02]">
          <div className="pt-3 flex flex-wrap gap-1.5 mb-3">
            {group.members.map(m => (
              <span key={m} className="glass-pill text-ops-text">{m}</span>
            ))}
            {group.members.length === 0 && <span className="text-xs text-ops-muted italic">No members added</span>}
          </div>
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 text-xs text-ops-muted hover:text-ops-danger transition-colors"
          >
            <Trash2 size={12} />
            Remove group
          </button>
        </div>
      )}
    </div>
  )
}
