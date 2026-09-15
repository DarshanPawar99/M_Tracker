import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Drop, NotePencil, Bell, Plant, Moon, CheckCircle } from '@phosphor-icons/react'
import { useStore } from '../store'
import { useSession } from '../session'
import { deriveCycleView } from '../lib/derive'
import { phaseForDay, phaseLabel } from '../lib/cycle'
import { daysBetween, formatShort, today } from '../lib/dates'
import { PHASE_COLORS } from '../lib/phaseColors'
import { PHASE_COPY } from '../lib/phaseCopy'
import EmptyState from '../components/EmptyState'
import type { Phase } from '../types'

/** "in N days" / "today" / "N days ago" relative to now. */
function relativeDays(date: Date): string {
  const d = daysBetween(today(), date)
  if (d === 0) return 'today'
  if (d > 0) return `in ${d} day${d === 1 ? '' : 's'}`
  return `${-d} day${d === -1 ? '' : 's'} ago`
}

export default function Home() {
  const { cyclesFor } = useStore()
  const { subject, view } = useSession()

  const cycles = useMemo(
    () => (subject ? cyclesFor(subject.id) : []),
    [subject, cyclesFor],
  )
  const cyclesView = useMemo(
    () => (subject ? deriveCycleView(cycles, subject) : null),
    [subject, cycles],
  )

  if (!subject) return <EmptyState title="No one to show" body="Sign in to pick a person." />
  if (!cyclesView || cycles.length === 0)
    return (
      <EmptyState
        title={`No cycles logged for ${subject.name} yet`}
        body="Log the first day of the most recent period to start predictions and the cycle ring."
        cta={{ to: '/log', label: 'Log a period' }}
      />
    )

  return view === 'partner' ? (
    <PartnerToday name={subject.name} cyclesView={cyclesView} luteal={subject.luteal_length} />
  ) : (
    <SelfToday cyclesView={cyclesView} luteal={subject.luteal_length} />
  )
}

type ViewData = ReturnType<typeof deriveCycleView>

function currentPhase(v: ViewData, luteal: number): { phase: Phase; day: number; overdue: boolean } {
  const cycleLen = Math.round(v.stats.avgCycle)
  const day = Math.min(Math.max(v.currentDay ?? 1, 1), cycleLen)
  return {
    phase: phaseForDay(day, cycleLen, Math.round(v.stats.avgPeriod), luteal),
    day: v.currentDay ?? 1,
    overdue: (v.currentDay ?? 0) > cycleLen,
  }
}

/* ── Her view — the person's own day ─────────────────────────────────────── */
function SelfToday({ cyclesView, luteal }: { cyclesView: ViewData; luteal: number }) {
  const navigate = useNavigate()
  const { phase, day, overdue } = currentPhase(cyclesView, luteal)
  const { prediction, stats, days, cycleStart } = cyclesView
  const cycleLen = Math.round(stats.avgCycle)
  const daysToNext = prediction ? daysBetween(today(), prediction.date) : null

  const upcoming = prediction
    ? [
        {
          label: 'Fertile window opens',
          sub: `${formatShort(prediction.fertileStart)} – ${formatShort(prediction.fertileEnd)}`,
          when: relativeDays(prediction.fertileStart),
          color: PHASE_COLORS.fertile,
        },
        {
          label: 'Ovulation estimate',
          sub: formatShort(prediction.ovulation),
          when: relativeDays(prediction.ovulation),
          color: PHASE_COLORS.ovulation,
        },
        {
          label: 'Next period',
          sub: `likely ${formatShort(prediction.rangeLow)} – ${formatShort(prediction.rangeHigh)}`,
          when: relativeDays(prediction.date),
          color: PHASE_COLORS.menstrual,
        },
      ]
    : []

  return (
    <div className="flex flex-col gap-3.5">
      {/* Hero status */}
      <div
        className="relative overflow-hidden p-5"
        style={{
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(150deg, #262a60 0%, #21233a 55%, var(--color-surface) 100%)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div style={{ font: '500 34px/1 var(--font-heading)', letterSpacing: '-0.02em' }}>
              {overdue ? 'Overdue' : `Day ${day}`}
            </div>
            <div className="mt-2 text-[15px]" style={{ color: 'var(--color-accent-200)' }}>
              {overdue ? 'Period expected' : `${phaseLabel(phase)} phase`}
            </div>
            <div className="mt-1 text-[13px] text-muted">
              {phase === 'fertile' || phase === 'ovulation'
                ? 'Higher chance of conception'
                : 'Low chance of conception'}
            </div>
          </div>
          {prediction && (
            <div className="text-right">
              <div className="kicker">Next period</div>
              <div className="mt-1.5" style={{ font: '500 17px/1.1 var(--font-heading)' }}>
                {formatShort(prediction.date)}
              </div>
              <div className="mt-0.5 text-[12px] text-muted">
                {daysToNext != null ? relativeDays(prediction.date) : '—'}
              </div>
            </div>
          )}
        </div>

        {/* Phase ribbon */}
        <Ribbon days={days} cycleLen={cycleLen} currentDay={cyclesView.currentDay} />
        {cycleStart && (
          <div className="mt-2 flex justify-between text-[11px] text-muted">
            <span>{formatShort(cycleStart)} · day 1</span>
            <span>{formatShort(days[days.length - 1]?.date ?? cycleStart)} · day {cycleLen}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2.5">
        <button className="btn btn-primary flex-1" style={{ minHeight: 44 }} onClick={() => navigate('/log')}>
          <Drop size={16} />
          Log period
        </button>
        <button className="btn btn-secondary flex-1" style={{ minHeight: 44 }} onClick={() => navigate('/log')}>
          <NotePencil size={16} />
          Add a note
        </button>
      </div>

      {upcoming.length > 0 && (
        <div className="flex flex-col">
          <div className="kicker pb-2.5 pt-1.5">Coming up</div>
          {upcoming.map((u) => (
            <div key={u.label} className="row-rule flex items-center gap-3 py-3">
              <span className="h-2 w-2 flex-none rounded-full" style={{ background: u.color }} />
              <div className="flex-1">
                <div className="text-[14px]">{u.label}</div>
                <div className="text-[12px] text-muted">{u.sub}</div>
              </div>
              <div className="text-[13px] text-dim">{u.when}</div>
            </div>
          ))}
        </div>
      )}

      <ConfidenceNote stats={stats} prediction={prediction} />
    </div>
  )
}

/* ── His view — following the partner's cycle, read-only ─────────────────── */
function PartnerToday({ name, cyclesView, luteal }: { name: string; cyclesView: ViewData; luteal: number }) {
  const navigate = useNavigate()
  const { phase, day } = currentPhase(cyclesView, luteal)
  const { prediction, stats } = cyclesView
  const copy = PHASE_COPY[phase]

  const heads = prediction
    ? [
        {
          icon: <Plant size={18} color="var(--color-accent)" />,
          label: 'Fertile window opens',
          sub: `Higher chance of conception through ${formatShort(prediction.fertileEnd)}.`,
          when: relativeDays(prediction.fertileStart),
        },
        {
          icon: <Moon size={18} color="var(--color-accent)" />,
          label: 'Period likely starts',
          sub: `Between ${formatShort(prediction.rangeLow)} and ${formatShort(prediction.rangeHigh)}.`,
          when: relativeDays(prediction.date),
        },
        {
          icon: <CheckCircle size={18} color="var(--color-accent)" />,
          label: 'Log is up to date',
          sub: `${stats.sampleCount} complete cycle${stats.sampleCount === 1 ? '' : 's'} tracked.`,
          when: `avg ${stats.avgCycle} d`,
        },
      ]
    : []

  return (
    <div className="flex flex-col gap-3.5">
      <div
        className="p-5"
        style={{
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(150deg, #262a60 0%, #21233a 55%, var(--color-surface) 100%)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-[26px] w-[26px] place-items-center rounded-full text-[12px]"
            style={{ background: 'var(--color-accent-800)', color: 'var(--color-accent-100)' }}
          >
            {name[0]}
          </span>
          <div className="text-[14px]">{name} is on day {day}</div>
        </div>
        <div
          className="mt-3.5"
          style={{ font: '500 26px/1.15 var(--font-heading)', letterSpacing: '-0.015em', maxWidth: 280 }}
        >
          {copy.heading}
        </div>
        <p className="mt-3 text-[13px] leading-relaxed" style={{ color: 'var(--text-dim)' }}>
          {copy.tip}
        </p>
      </div>

      {heads.length > 0 && (
        <div className="flex flex-col">
          <div className="kicker pb-2.5 pt-1.5">Worth knowing</div>
          {heads.map((h) => (
            <div key={h.label} className="row-rule flex gap-3 py-3">
              <span className="mt-0.5">{h.icon}</span>
              <div className="flex-1">
                <div className="text-[14px]">{h.label}</div>
                <div className="text-[12px] leading-relaxed text-muted">{h.sub}</div>
              </div>
              <div className="whitespace-nowrap text-[13px] text-dim">{h.when}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2.5 pt-1">
        <button className="btn btn-secondary flex-1" style={{ minHeight: 42 }} onClick={() => navigate('/log')}>
          <Drop size={16} />
          Log for {name}
        </button>
        <button className="btn btn-secondary flex-1" style={{ minHeight: 42 }} onClick={() => navigate('/wheel')}>
          <Bell size={16} />
          Her cycle
        </button>
      </div>

      <div className="text-[11px] leading-relaxed text-muted">
        You see her dates and phases, not her notes. Switch to your own tracking in Settings.
      </div>
    </div>
  )
}

function Ribbon({
  days,
  cycleLen,
  currentDay,
}: {
  days: ViewData['days']
  cycleLen: number
  currentDay: number | null
}) {
  const now = currentDay ?? 0
  return (
    <div className="mt-4 flex items-end gap-[3px]">
      {days.slice(0, cycleLen).map((d) => {
        const isNow = d.dayNumber === now
        const h = isNow ? 22 : d.phase === 'ovulation' ? 16 : d.phase === 'menstrual' ? 14 : 10
        const op = isNow ? 1 : d.dayNumber < now ? 0.85 : 0.35
        return (
          <div
            key={d.dayNumber}
            className="flex-1 rounded-[2px]"
            style={{ height: h, background: PHASE_COLORS[d.phase], opacity: op }}
          />
        )
      })}
    </div>
  )
}

function ConfidenceNote({
  stats,
  prediction,
}: {
  stats: ViewData['stats']
  prediction: ViewData['prediction']
}) {
  const conf = prediction?.confidence ?? 'low'
  return (
    <div className="text-[11px] leading-relaxed text-muted">
      Based on {stats.sampleCount} logged cycle{stats.sampleCount === 1 ? '' : 's'} · {conf} confidence.
      Estimates for planning, not medical advice.
    </div>
  )
}
