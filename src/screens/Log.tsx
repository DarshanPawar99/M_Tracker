import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { daysBetween, formatLong, parseISODate, toISODate, today } from '../lib/dates'
import { observedCycleLengths } from '../lib/cycle'
import type { Cycle } from '../types'
import EmptyState from '../components/EmptyState'
import DemoBanner from '../components/DemoBanner'

export default function Log() {
  const { activeProfile, cyclesFor, addCycle, updateCycle, deleteCycle } = useStore()
  const cycles = useMemo(
    () => (activeProfile ? cyclesFor(activeProfile.id) : []),
    [activeProfile, cyclesFor],
  )

  const sorted = useMemo(
    () => [...cycles].sort((a, b) => b.start_date.localeCompare(a.start_date)),
    [cycles],
  )

  const [editing, setEditing] = useState<Cycle | null>(null)
  const [start, setStart] = useState(toISODate(today()))
  const [end, setEnd] = useState('')
  const [note, setNote] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!activeProfile)
    return <EmptyState title="No profile selected" body="Pick a person up top." />

  function resetForm() {
    setEditing(null)
    setStart(toISODate(today()))
    setEnd('')
    setNote('')
    setErr(null)
  }

  function beginEdit(c: Cycle) {
    setEditing(c)
    setStart(c.start_date)
    setEnd(c.end_date ?? '')
    setNote(c.note ?? '')
    setErr(null)
  }

  function validate(): string | null {
    if (!start) return 'Pick a start date.'
    if (end && end < start) return 'End date can’t be before the start date.'
    // No two periods may share a start date (other than the one being edited).
    const clash = cycles.find(
      (c) => c.start_date === start && c.id !== editing?.id,
    )
    if (clash) return 'A period is already logged for that start date.'
    return null
  }

  async function save() {
    const problem = validate()
    if (problem) {
      setErr(problem)
      return
    }
    setBusy(true)
    try {
      if (editing) {
        await updateCycle(editing.id, {
          start_date: start,
          end_date: end || null,
          note: note || null,
        })
      } else {
        await addCycle({
          profile_id: activeProfile!.id,
          start_date: start,
          end_date: end || null,
          note: note || null,
        })
      }
      resetForm()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  // Map start_date -> the cycle length that begins on it (gap to next start).
  const lengthByStart = new Map<string, number>()
  const asc = [...cycles].sort((a, b) => a.start_date.localeCompare(b.start_date))
  const lengths = observedCycleLengths(cycles)
  asc.forEach((c, i) => {
    if (i < lengths.length) lengthByStart.set(c.start_date, lengths[i])
  })

  return (
    <div className="space-y-4">
      <DemoBanner />

      {/* Add / edit form */}
      <div className="card space-y-3">
        <div className="font-semibold text-gray-800">
          {editing ? 'Edit period' : 'Log a period'} · {activeProfile.name}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Started</label>
            <input
              type="date"
              className="input"
              value={start}
              max={toISODate(today())}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Ended (optional)</label>
            <input
              type="date"
              className="input"
              value={end}
              min={start}
              max={toISODate(today())}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">Note (optional)</label>
          <input
            type="text"
            className="input"
            placeholder="cramps, light flow…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <div className="flex gap-2">
          <button className="btn-primary flex-1" onClick={save} disabled={busy}>
            {editing ? 'Save changes' : 'Add period'}
          </button>
          {editing && (
            <button className="btn-ghost" onClick={resetForm} disabled={busy}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* History */}
      {sorted.length === 0 ? (
        <p className="px-1 text-center text-sm text-gray-400">
          No periods logged yet for {activeProfile.name}.
        </p>
      ) : (
        <div className="space-y-2">
          <div className="px-1 text-xs font-medium uppercase tracking-wide text-gray-400">
            History ({sorted.length})
          </div>
          {sorted.map((c) => {
            const periodLen = c.end_date
              ? daysBetween(parseISODate(c.start_date), parseISODate(c.end_date)) + 1
              : null
            const cycleLen = lengthByStart.get(c.start_date)
            return (
              <div key={c.id} className="card flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-semibold text-gray-800">
                    {formatLong(parseISODate(c.start_date))}
                    {c.end_date
                      ? ` → ${formatLong(parseISODate(c.end_date))}`
                      : ' → ongoing'}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    {periodLen ? `${periodLen}-day period` : 'period ongoing'}
                    {cycleLen ? ` · ${cycleLen}-day cycle` : ''}
                    {c.note ? ` · ${c.note}` : ''}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    onClick={() => beginEdit(c)}
                  >
                    Edit
                  </button>
                  <button
                    className="rounded-lg px-2 py-1 text-xs font-semibold text-gray-400 hover:bg-gray-50 hover:text-red-600"
                    onClick={() => {
                      if (confirm('Delete this period?')) deleteCycle(c.id)
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
