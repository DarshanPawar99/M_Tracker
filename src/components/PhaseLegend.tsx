import type { Phase } from '../types'
import { PHASE_COLORS } from '../lib/phaseColors'
import { phaseLabel } from '../lib/cycle'

const ORDER: Phase[] = ['menstrual', 'follicular', 'fertile', 'ovulation', 'luteal']

/** Small legend that sits OUTSIDE the wheel (keeps the wheel uncluttered). */
export default function PhaseLegend() {
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
      {ORDER.map((phase) => (
        <span key={phase} className="flex items-center gap-1.5 text-xs text-gray-600">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: PHASE_COLORS[phase] }}
          />
          {phaseLabel(phase)}
        </span>
      ))}
    </div>
  )
}
