import { useMemo, useState } from 'react'
import { PencilSimple, Trash, CalendarBlank } from '@phosphor-icons/react'
import { useStore } from '../store'
import { useSession } from '../session'
import { daysBetween, formatLong, parseISODate, toISODate, today } from '../lib/dates'
import { observedCycleLengths } from '../lib/cycle'
import type { Cycle } from '../types'
import EmptyState from '../components/EmptyState'

const HISTORY_SHOWN = 6

export default function Log() {
  const { cyclesFor, addCycle, updateCycle, deleteCycle } = useStore()
  const { subject, canEditNotes } = useSession()

  const cycles = useMemo(
    () => (subject ? cyclesFor(subject.id) : []),
    [subject, cyclesFor],
  )
  const sorted = useMemo(
    () => [...cycles].sort((a, b) => b.start_date.localeCompare(a.start_date)),
    [cycles],
  )

  const [editing, setEditing] = useState<Cycle | null>(null)
  const [mode, setMode] = useState<'today' | 'custom'>('today')
  const [start, setStart] = useState(toISODate(today()))
  const [end, setEnd] = useState('')
  const [note, setNote] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!subject) return <EmptyState title="No one selected" body="Sign in to pick a person." />

  const effectiveStart = mode === 'today' && !editing ? toISODate(today()) : start

  function resetForm() {
    setEditing(null)
    setMode('today')
    setStart(toISODate(today()))
    setEnd('')
    setNote('')
    setErr(null)
  }

  function beginEdit(c: Cycle) {
    setEditing(c)
    setMode('custom')
    setStart(c.start_date)
    setEnd(c.end_date ?? '')
    setNote(c.note ?? '')
    setErr(null)
  }

  function validate(s: string): string | null {
    if (!s) return 'Pick a start date.'
    if (end && end < s) return 'End date can’t be before the start date.'
    const clash = cycles.find((c) => c.start_date === s && c.id !== editing?.id)
    if (clash) return 'A period is already logged for that start date.'
    return null
  }

  async function save() {
    const s = effectiveStart
    const problem = validate(s)
    if (problem) {
      setErr(problem)
      return
    }
    setBusy(true)
    try {
      if (editing) {
        await updateCycle(editing.id, {
          start_date: s,
          end_date: end || null,
          ...(canEditNotes ? { note: note || null } : {}),
        })
      } else {
        await addCycle({
          profile_id: subject!.id,
          start_date: s,
          end_date: end || null,
          note: canEditNotes ? note || null : null,
        })
      }
      resetForm()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  // Map each start_date → the cycle length that begins on it.
  const lengthByStart = new Map<string, number>()
  const asc = [...cycles].sort((a, b) => a.start_date.localeCompare(b.start_date))
  const lengths = observedCycleLengths(cycles)
  asc.forEach((c, i) => {
    if (i < lengths.length) lengthByStart.set(c.start_date, lengths[i])
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Add / edit form */}
      <div className="card" style={{ gap: 'var(--space-4)' }}>
        {!editing && (
          <div className="flex gap-2.5">
            <SegOpt active={mode === 'today'} onClick={() => setMode('today')}>
              Started today
            </SegOpt>
            <SegOpt active={mode === 'custom'} onClick={() => setMode('custom')}>
              Another date
            </SegOpt>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="field">
            <label>Started</label>
            {mode === 'today' && !editing ? (
              <div className="input flex items-center justify-between">
                {formatLong(today())}
                <CalendarBlank size={16} color="var(--text-muted)" />
              </div>
            ) : (
              <input
                type="date"
                className="input"
                value={start}
                max={toISODate(today())}
                onChange={(e) => setStart(e.target.value)}
              />
            )}
          </div>
          <div className="field">
            <label>Ended</label>
            <input
              type="date"
              className="input"
              value={end}
              min={effectiveStart}
              max={toISODate(today())}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
        </div>

        {canEditNotes && (
          <div className="field">
            <label>Note (optional)</label>
            <input
              type="text"
              className="input"
              placeholder="cramps, light flow…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        )}

        {err && <div className="text-[13px]" style={{ color: 'var(--color-accent-300)' }}>{err}</div>}

        <div className="flex gap-2.5">
          <button className="btn btn-primary flex-1" style={{ minHeight: 42 }} onClick={save} disabled={busy}>
            {editing ? 'Save changes' : 'Save period'}
          </button>
          {editing && (
            <button className="btn btn-secondary" onClick={resetForm} disabled={busy}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* History */}
      <div>
        <div className="flex items-baseline justify-between pb-2.5">
          <div className="kicker">History</div>
          <div className="text-[12px] text-muted">
            {Math.min(sorted.length, HISTORY_SHOWN)} shown · {sorted.length} logged
          </div>
        </div>
        {sorted.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-muted">
            No periods logged yet for {subject.name}.
          </p>
        ) : (
          sorted.slice(0, HISTORY_SHOWN).map((c) => {
            const periodLen = c.end_date
              ? daysBetween(parseISODate(c.start_date), parseISODate(c.end_date)) + 1
              : null
            const cycleLen = lengthByStart.get(c.start_date)
            const meta = [
              periodLen ? `${periodLen}-day period` : 'ongoing',
              cycleLen ? `${cycleLen}-day cycle` : null,
              canEditNotes && c.note ? c.note : null,
            ]
              .filter(Boolean)
              .join(' · ')
            return (
              <div key={c.id} className="row-rule flex items-center gap-3 py-3">
                <div className="flex-1">
                  <div className="text-[14px]">
                    {formatLong(parseISODate(c.start_date))}
                    {c.end_date ? ` → ${formatLong(parseISODate(c.end_date))}` : ' → ongoing'}
                  </div>
                  <div className="text-[12px] text-muted">{meta}</div>
                </div>
                <button aria-label="Edit" onClick={() => beginEdit(c)} className="grid place-items-center p-1">
                  <PencilSimple size={16} color="var(--color-accent)" />
                </button>
                <button
                  aria-label="Delete"
                  onClick={() => {
                    if (confirm('Delete this period?')) deleteCycle(c.id)
                  }}
                  className="grid place-items-center p-1"
                >
                  <Trash size={16} color="var(--text-muted)" />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function SegOpt({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-2.5 text-center text-[13px]"
      style={{
        borderRadius: 'var(--radius-md)',
        boxShadow: active ? 'inset 0 0 0 1px var(--color-accent)' : 'inset 0 0 0 1px var(--color-divider)',
        color: active ? 'var(--color-accent)' : 'var(--text-dim)',
      }}
    >
      {children}
    </button>
  )
}
