import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { deriveCycleView } from '../lib/derive'
import { phaseLabel } from '../lib/cycle'
import { formatLong } from '../lib/dates'
import { PHASE_COLORS, PHASE_TEXT } from '../lib/phaseColors'
import type { WheelDay } from '../types'
import CycleWheel from '../components/CycleWheel'
import PhaseLegend from '../components/PhaseLegend'
import EmptyState from '../components/EmptyState'

export default function Wheel() {
  const { activeProfile, cyclesFor } = useStore()
  const cycles = useMemo(
    () => (activeProfile ? cyclesFor(activeProfile.id) : []),
    [activeProfile, cyclesFor],
  )
  const view = useMemo(
    () => (activeProfile ? deriveCycleView(cycles, activeProfile) : null),
    [activeProfile, cycles],
  )
  const [selected, setSelected] = useState<WheelDay | null>(null)

  if (!activeProfile)
    return <EmptyState title="No profile selected" body="Pick a person up top." />
  if (!view || view.days.length === 0)
    return (
      <EmptyState
        title="Nothing to draw yet"
        body="Log a period so the wheel can map this cycle."
        cta={{ to: '/log', label: 'Log a period' }}
      />
    )

  const current = view.days.find((d) => d.dayNumber === view.currentDay) ?? null
  const shown = selected ?? current

  return (
    <div className="space-y-4">
      <div className="card">
        <CycleWheel
          days={view.days}
          ovulationDayNumber={view.ovulationDayNumber}
          size={340}
          selectedDay={shown?.dayNumber ?? null}
          onSelectDay={setSelected}
          centerTitle={activeProfile.name}
          centerSubtitle={`${view.stats.avgCycle}-day cycle`}
        />
        <div className="mt-3">
          <PhaseLegend />
        </div>
      </div>

      {/* Detail for the selected / current day */}
      {shown && (
        <div
          className="card"
          style={{ borderLeft: `5px solid ${PHASE_COLORS[shown.phase]}` }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400">
                Cycle day {shown.dayNumber}
                {shown.isToday && ' · today'}
              </div>
              <div
                className="text-lg font-bold"
                style={{ color: PHASE_TEXT[shown.phase] }}
              >
                {phaseLabel(shown.phase)}
              </div>
              <div className="text-sm text-gray-600">{formatLong(shown.date)}</div>
            </div>
            <div className="text-right text-xs text-gray-500">
              {shown.isFertile ? 'Higher chance of conception' : 'Lower chance'}
            </div>
          </div>
        </div>
      )}

      <p className="px-1 text-center text-xs text-gray-400">
        Tap any day to see its date and phase. Predictions are estimates, not medical
        advice.
      </p>
    </div>
  )
}
