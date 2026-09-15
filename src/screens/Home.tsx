import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { deriveCycleView } from '../lib/derive'
import { phaseForDay, phaseLabel } from '../lib/cycle'
import { daysBetween, formatLong, today, toISODate } from '../lib/dates'
import { PHASE_COLORS, PHASE_TEXT } from '../lib/phaseColors'
import CycleWheel from '../components/CycleWheel'
import EmptyState from '../components/EmptyState'
import DemoBanner from '../components/DemoBanner'

export default function Home() {
  const { activeProfile, cyclesFor, addCycle, updateCycle } = useStore()
  const [busy, setBusy] = useState(false)

  const cycles = useMemo(
    () => (activeProfile ? cyclesFor(activeProfile.id) : []),
    [activeProfile, cyclesFor],
  )
  const view = useMemo(
    () => (activeProfile ? deriveCycleView(cycles, activeProfile) : null),
    [activeProfile, cycles],
  )

  if (!activeProfile) return <NoProfile />
  if (!view || cycles.length === 0)
    return (
      <>
        <DemoBanner />
        <EmptyState
          title={`No cycles logged for ${activeProfile.name} yet`}
          body="Log the first day of the most recent period to start predictions and the cycle wheel."
          cta={{ to: '/log', label: 'Log a period' }}
        />
      </>
    )

  const { stats, prediction, currentDay } = view
  const cycleLen = Math.round(stats.avgCycle)
  const clampedDay = Math.min(Math.max(currentDay ?? 1, 1), cycleLen)
  const overdue = (currentDay ?? 0) > cycleLen
  const phase = phaseForDay(
    clampedDay,
    cycleLen,
    Math.round(stats.avgPeriod),
    activeProfile.luteal_length,
  )
  const daysToNext = prediction ? daysBetween(today(), prediction.date) : null

  const last = [...cycles].sort((a, b) =>
    b.start_date.localeCompare(a.start_date),
  )[0]
  const periodOpen = last && !last.end_date

  async function logStart() {
    setBusy(true)
    try {
      await addCycle({
        profile_id: activeProfile!.id,
        start_date: toISODate(today()),
        end_date: null,
      })
    } finally {
      setBusy(false)
    }
  }
  async function markEnded() {
    if (!last) return
    setBusy(true)
    try {
      await updateCycle(last.id, { end_date: toISODate(today()) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <DemoBanner />

      {/* Hero status */}
      <div
        className="card flex items-center gap-4"
        style={{ borderLeft: `5px solid ${PHASE_COLORS[phase]}` }}
      >
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
            {activeProfile.name} · Cycle day {currentDay}
          </div>
          <div className="mt-0.5 text-xl font-bold" style={{ color: PHASE_TEXT[phase] }}>
            {overdue ? 'Period expected' : phaseLabel(phase)}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            {daysToNext === null
              ? '—'
              : daysToNext > 0
                ? `Next period in ~${daysToNext} day${daysToNext === 1 ? '' : 's'}`
                : daysToNext === 0
                  ? 'Period expected today'
                  : `Period ~${Math.abs(daysToNext)} day${
                      Math.abs(daysToNext) === 1 ? '' : 's'
                    } late`}
          </div>
        </div>
      </div>

      {/* Mini wheel */}
      <Link to="/wheel" className="card block">
        <CycleWheel
          days={view.days}
          ovulationDayNumber={view.ovulationDayNumber}
          size={260}
          selectedDay={currentDay}
          interactive={false}
          showArcs={false}
          centerTitle={`Day ${currentDay ?? '—'}`}
          centerSubtitle={overdue ? 'expected' : phaseLabel(phase)}
        />
        <div className="mt-1 text-center text-xs text-rose-600">Open full wheel →</div>
      </Link>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button className="btn-primary" onClick={logStart} disabled={busy}>
          Log period start
        </button>
        <button
          className="btn-ghost"
          onClick={markEnded}
          disabled={busy || !periodOpen}
        >
          {periodOpen ? 'Mark period ended' : 'Period logged'}
        </button>
      </div>

      {prediction && (
        <div className="card text-sm">
          <div className="font-semibold text-gray-700">What’s coming up</div>
          <ul className="mt-2 space-y-1 text-gray-600">
            <li>
              🩸 Next period: <strong>{formatLong(prediction.date)}</strong>{' '}
              <span className="text-gray-400">
                ({formatLong(prediction.rangeLow)} – {formatLong(prediction.rangeHigh)})
              </span>
            </li>
            <li>
              🌱 Fertile window: {formatLong(prediction.fertileStart)} –{' '}
              {formatLong(prediction.fertileEnd)}
            </li>
            <li>
              🥚 Estimated ovulation: <strong>{formatLong(prediction.ovulation)}</strong>
            </li>
          </ul>
          <div className="mt-2 text-xs text-gray-400">
            Confidence: {prediction.confidence} · based on {stats.sampleCount} cycle
            {stats.sampleCount === 1 ? '' : 's'}
          </div>
        </div>
      )}
    </div>
  )
}

function NoProfile() {
  return (
    <EmptyState
      title="No profiles found"
      body="Add the two people you want to track in Settings (or connect Supabase to sync)."
      cta={{ to: '/settings', label: 'Go to Settings' }}
    />
  )
}
