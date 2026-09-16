import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { useSession } from '../session'
import { deriveCycleView } from '../lib/derive'
import { phaseLabel } from '../lib/cycle'
import { formatShort } from '../lib/dates'
import { PHASE_COLORS } from '../lib/phaseColors'
import type { Phase, WheelDay } from '../types'
import SegmentRing from '../components/SegmentRing'
import EmptyState from '../components/EmptyState'

const ORDER: Phase[] = ['menstrual', 'follicular', 'fertile', 'ovulation', 'luteal']

/** Day range each phase spans in this cycle, e.g. "day 6–9" / "day 15". */
function phaseRanges(days: WheelDay[]): { phase: Phase; days: string }[] {
  return ORDER.map((phase) => {
    const nums = days.filter((d) => d.phase === phase).map((d) => d.dayNumber)
    if (nums.length === 0) return { phase, days: '—' }
    const lo = Math.min(...nums)
    const hi = Math.max(...nums)
    return { phase, days: lo === hi ? `day ${lo}` : `day ${lo}–${hi}` }
  })
}

export default function Wheel() {
  const { cyclesFor } = useStore()
  const { subject } = useSession()
  const cycles = useMemo(
    () => (subject ? cyclesFor(subject.id) : []),
    [subject, cyclesFor],
  )
  const view = useMemo(
    () => (subject ? deriveCycleView(cycles, subject) : null),
    [subject, cycles],
  )
  const [selected, setSelected] = useState<WheelDay | null>(null)

  if (!subject) return <EmptyState title="No one selected" body="Sign in to pick a person." />
  if (!view || view.days.length === 0)
    return (
      <EmptyState
        title="Nothing to draw yet"
        body="Log a period so the ring can map this cycle."
        cta={{ to: '/log', label: 'Log a period' }}
      />
    )

  const cycleLen = Math.round(view.stats.avgCycle)
  const current = view.days.find((d) => d.dayNumber === view.currentDay) ?? null
  const shown = selected ?? current
  const legend = phaseRanges(view.days)

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <SegmentRing
          days={view.days}
          selectedDay={shown?.dayNumber ?? null}
          onSelectDay={setSelected}
          size={340}
          centerTitle={shown ? `Day ${shown.dayNumber}` : undefined}
          centerSubtitle={shown ? phaseLabel(shown.phase) : undefined}
          centerMeta={shown ? `${formatShort(shown.date)} · ${cycleLen}-day cycle` : undefined}
        />
      </div>

      <div className="flex flex-col">
        {legend.map((l) => (
          <div key={l.phase} className="row-rule flex items-center gap-2.5 py-2.5">
            <span className="h-1 w-[22px] flex-none rounded-[2px]" style={{ background: PHASE_COLORS[l.phase] }} />
            <div className="flex-1 text-[13px]">{phaseLabel(l.phase)}</div>
            <div className="text-[12px] text-muted">{l.days}</div>
          </div>
        ))}
      </div>

      <div className="text-[11px] leading-relaxed text-muted">
        Tap any day for its date and phase. Predictions are estimates, not medical advice.
      </div>
    </div>
  )
}
