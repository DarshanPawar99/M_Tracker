import { useMemo } from 'react'
import type { WheelDay } from '../types'
import { PHASE_COLORS, PHASE_TINTS } from '../lib/phaseColors'

interface CycleWheelProps {
  days: WheelDay[]
  /** 1-based cycle day of ovulation (splits the follicular/luteal arcs). */
  ovulationDayNumber: number
  size?: number
  selectedDay?: number | null
  onSelectDay?: (day: WheelDay) => void
  centerTitle?: string
  centerSubtitle?: string
  /** Show the outer Follicular / Luteal arcs + labels. */
  showArcs?: boolean
  interactive?: boolean
}

const VB = 320 // internal viewBox size; scales via width/height
const CX = VB / 2
const CY = VB / 2

/** Phases whose bubble needs dark text on a light fill. */
const LIGHT_FILLS = new Set(['follicular'])

function polar(angleDeg: number, r: number): [number, number] {
  const t = (angleDeg * Math.PI) / 180
  return [CX + r * Math.cos(t), CY + r * Math.sin(t)]
}

/** Wedge path from the centre spanning [a0, a1] degrees at radius r. */
function wedge(a0: number, a1: number, r: number): string {
  const [x0, y0] = polar(a0, r)
  const [x1, y1] = polar(a1, r)
  const large = a1 - a0 > 180 ? 1 : 0
  return `M ${CX} ${CY} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`
}

/** Open arc (no fill) from a0 to a1 at radius r. */
function arc(a0: number, a1: number, r: number): string {
  const [x0, y0] = polar(a0, r)
  const [x1, y1] = polar(a1, r)
  const large = a1 - a0 > 180 ? 1 : 0
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`
}

export default function CycleWheel({
  days,
  ovulationDayNumber,
  size = 320,
  selectedDay = null,
  onSelectDay,
  centerTitle,
  centerSubtitle,
  showArcs = true,
  interactive = true,
}: CycleWheelProps) {
  const n = days.length
  const geom = useMemo(() => {
    const step = 360 / Math.max(n, 1)
    const top = -90
    const rBubble = 118
    const rSector = 132
    const rArc = 150
    const rArcLabel = 168
    // Bubble radius fits the arc length between neighbours, capped.
    const bubbleR = Math.min(13, ((2 * Math.PI * rBubble) / Math.max(n, 1)) * 0.42)
    return { step, top, rBubble, rSector, rArc, rArcLabel, bubbleR }
  }, [n])

  if (n === 0) return null

  const { step, top, rBubble, rSector, rArc, rArcLabel, bubbleR } = geom
  const ovStart = top + ovulationDayNumber * step // boundary after ovulation day

  // Outer-arc label anchor points (mid-angle of each arc).
  const follMid = top + (ovulationDayNumber / 2) * step
  const lutMid = top + ((ovulationDayNumber + n) / 2) * step
  const [flx, fly] = polar(follMid, rArcLabel)
  const [llx, lly] = polar(lutMid, rArcLabel)

  return (
    <svg
      viewBox={`0 0 ${VB} ${VB}`}
      width={size}
      height={size}
      role="img"
      aria-label="Cycle wheel"
      className="mx-auto block max-w-full"
    >
      {/* Phase sectors (soft tints) behind the bubbles */}
      <g>
        {days.map((d, i) => {
          const a0 = top + i * step
          const a1 = top + (i + 1) * step
          return (
            <path
              key={`sec-${d.dayNumber}`}
              d={wedge(a0, a1, rSector)}
              fill={PHASE_TINTS[d.phase]}
              stroke="#ffffff"
              strokeWidth={1}
            />
          )
        })}
        {/* Hollow centre for the label */}
        <circle cx={CX} cy={CY} r={rBubble - bubbleR - 6} fill="#ffffff" />
      </g>

      {/* Outer arcs + labels */}
      {showArcs && (
        <g>
          <path
            d={arc(top + 0.6, ovStart - 0.6, rArc)}
            fill="none"
            stroke="#c4b5fd"
            strokeWidth={7}
            strokeLinecap="round"
          />
          <path
            d={arc(ovStart + 0.6, top + n * step - 0.6, rArc)}
            fill="none"
            stroke="#fcd34d"
            strokeWidth={7}
            strokeLinecap="round"
          />
          <text
            x={flx}
            y={fly}
            textAnchor={follMid > 90 || follMid < -90 ? 'end' : 'start'}
            dominantBaseline="middle"
            className="fill-violet-500"
            fontSize={12}
            fontWeight={600}
          >
            Follicular
          </text>
          <text
            x={llx}
            y={lly}
            textAnchor={lutMid > 90 && lutMid < 270 ? 'end' : 'start'}
            dominantBaseline="middle"
            className="fill-amber-500"
            fontSize={12}
            fontWeight={600}
          >
            Luteal
          </text>
        </g>
      )}

      {/* Day bubbles */}
      <g>
        {days.map((d, i) => {
          const angle = top + (i + 0.5) * step
          const [x, y] = polar(angle, rBubble)
          const isSel = selectedDay === d.dayNumber
          const fill = PHASE_COLORS[d.phase]
          const textFill = LIGHT_FILLS.has(d.phase) ? '#7c2d12' : '#ffffff'
          return (
            <g
              key={d.dayNumber}
              onClick={interactive ? () => onSelectDay?.(d) : undefined}
              style={{ cursor: interactive ? 'pointer' : 'default' }}
            >
              <circle
                cx={x}
                cy={y}
                r={d.isToday || isSel ? bubbleR + 1.5 : bubbleR}
                fill={fill}
                stroke={d.isToday ? '#111827' : isSel ? '#1f2937' : '#ffffff'}
                strokeWidth={d.isToday ? 2.5 : isSel ? 2 : 1}
              />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={bubbleR * 0.95}
                fontWeight={600}
                fill={textFill}
                pointerEvents="none"
              >
                {d.dayNumber}
              </text>
            </g>
          )
        })}
      </g>

      {/* Centre label */}
      {(centerTitle || centerSubtitle) && (
        <g pointerEvents="none">
          {centerTitle && (
            <text
              x={CX}
              y={centerSubtitle ? CY - 8 : CY}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={17}
              fontWeight={700}
              className="fill-gray-800"
            >
              {centerTitle}
            </text>
          )}
          {centerSubtitle && (
            <text
              x={CX}
              y={CY + 12}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={12}
              className="fill-gray-500"
            >
              {centerSubtitle}
            </text>
          )}
        </g>
      )}
    </svg>
  )
}
