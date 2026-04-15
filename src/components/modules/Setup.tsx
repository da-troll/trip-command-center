import { useState } from 'react'
import { Save, RotateCcw } from 'lucide-react'
import { useTrip } from '../../context'

const EMOJIS = ['🏔️', '🏖️', '🌴', '🌊', '🏕️', '🎿', '🚗', '✈️', '🚢', '🗺️', '🌍', '🎉']

export function Setup() {
  const { state, dispatch } = useTrip()
  const [form, setForm] = useState(state.setup)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    dispatch({ type: 'UPDATE_SETUP', setup: form })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleReset() {
    if (confirm('Reset all trip data to defaults?')) {
      dispatch({ type: 'RESET' })
      setForm(state.setup)
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-base font-semibold text-ops-text mb-1">Trip Setup</h2>
      <p className="text-xs text-ops-muted mb-6">Configure the basics. Everything else follows from here.</p>

      <div className="space-y-5">
        {/* Cover emoji */}
        <div>
          <label className="block text-xs font-medium text-ops-muted mb-2">Cover Emoji</label>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => setForm(f => ({ ...f, coverEmoji: e }))}
                className={`w-10 h-10 text-xl rounded-md border transition-colors
                  ${form.coverEmoji === e
                    ? 'border-ops-accent bg-ops-accent/10'
                    : 'border-ops-border hover:border-ops-muted'
                  }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <Field label="Trip Name">
          <input
            className="input"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Alpine Ridge Weekend"
          />
        </Field>

        <Field label="Destination">
          <input
            className="input"
            value={form.destination}
            onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
            placeholder="e.g. Lake Tahoe, CA"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Start Date">
            <input
              type="date"
              className="input"
              value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
            />
          </Field>
          <Field label="End Date">
            <input
              type="date"
              className="input"
              value={form.endDate}
              onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
            />
          </Field>
        </div>

        <Field label="Description" optional>
          <textarea
            className="input resize-none h-20"
            value={form.description ?? ''}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="One-liner about this trip..."
          />
        </Field>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-ops-accent hover:bg-ops-accent-hover text-white text-sm font-medium rounded-md transition-colors"
          >
            <Save size={14} />
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 border border-ops-border text-ops-muted hover:text-ops-danger hover:border-ops-danger text-sm rounded-md transition-colors"
          >
            <RotateCcw size={14} />
            Reset Demo
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ops-muted mb-1.5">
        {label} {optional && <span className="text-ops-border">(optional)</span>}
      </label>
      {children}
    </div>
  )
}
