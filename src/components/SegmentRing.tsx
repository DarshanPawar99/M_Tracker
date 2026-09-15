import { useMemo } from 'react'
import type { WheelDay } from '../types'
import { PHASE_COLORS } from '../lib/phaseColors'

interface SegmentRingProps {
  days: WheelDay[]
  /** Day whose marker + emphasis is shown; defaults to today. */
  selectedDay?: number | null
  onSelectDay?: (day: WheelDay) => void
  centerTitle?: string
  centerSubtitle?: string
  centerMeta?: string
  size?: number
}

const VB = 320
const CX = VB / 2
const CY = VB / 2
const R = 126
const GAP = 1.4 // degrees of breathing room between day segments

function polar(angleDeg: number, r: number): [number, number] {
  const t = (angleDeg * Math.PI) / 180
  return [CX + r * Math.cos(t), CY + r * Math.sin(t)]
}

/** A single-day arc between two angles at radius r. */
function segPath(a0: number, a1: number, r: number): string {
  const [x0, y0] = polar(a0, r)
  const [x1, y1] = polar(a1, r)
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 0 1 ${x1.toFixed(
    2,
  )} ${y1.toFixed(2)}`
}

/**
 * The cycle drawn as a segmented ring — one arc per day, coloured by phase on
 * the Nocturne accent/neutral ramps. Past days read bright, upcoming days fade,
 * and the selected (or current) day thickens and takes the marker.
 */
export default function SegmentRing({
  days,
  selectedDay = null,
  onSelectDay,
  centerTitle,
  centerSubtitle,
  centerMeta,
  size = 320,
}: SegmentRingProps) {
  const n = days.length
  const step = useMemo(() => 360 / Math.max(n, 1), [n])
  if (n === 0) return null

  const top = -90
  const todayDay = days.find((d) => d.isToday)?.dayNumber ?? null
  const emphasisDay = selectedDay ?? todayDay
  const interactive = Boolean(onSelectDay)

  const [mx, my] =
    emphasisDay != null ? polar(top + (emphasisDay - 0.5) * step, R) : [0, 0]

  return (
    <svg
      viewBox={`0 0 ${VB} ${VB}`}
      width={size}
      height={size}
      role="img"
      aria-label="Cycle ring"
      className="mx-auto block max-w-full"
      style={{ overflow: 'visible' }}
    >
      <g>
        {days.map((d, i) => {
          const a0 = top + i * step + GAP / 2
          const a1 = top + (i + 1) * step - GAP / 2
          const mid = top + (i + 0.5) * step
          const isNow = d.dayNumber === emphasisDay
          const isPast = todayDay != null && d.dayNumber < todayDay
          const [lx, ly] = polar(mid, R - 20)
          return (
            <g
              key={d.dayNumber}
              onClick={interactive ? () => onSelectDay?.(d) : undefined}
              style={{ cursor: interactive ? 'pointer' : 'default' }}
            >
              {/* Transparent wide arc = comfortable tap target. */}
              {interactive && (
                <path d={segPath(a0, a1, R)} fill="none" stroke="transparent" strokeWidth={26} />
              )}
              <path
                d={segPath(a0, a1, R)}
                fill="none"
                stroke={PHASE_COLORS[d.phase]}
                strokeWidth={isNow ? 16 : 10}
                strokeLinecap="butt"
                opacity={isNow ? 1 : isPast ? 0.95 : 0.42}
              />
              <text
                x={lx.toFixed(2)}
                y={ly.toFixed(2)}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={10}
                fontWeight={500}
                fill={isNow ? 'var(--color-accent-200)' : 'var(--color-neutral-400)'}
                pointerEvents="none"
              >
                {d.dayNumber}
              </text>
            </g>
          )
        })}
      </g>

      {emphasisDay != null && (
        <circle cx={mx.toFixed(2)} cy={my.toFixed(2)} r={5.5} fill="var(--color-accent-200)" />
      )}

      <g pointerEvents="none">
        {centerTitle && (
          <text x={CX} y={146} textAnchor="middle" fontSize={30} fontWeight={500} fill="var(--color-text)">
            {centerTitle}
          </text>
        )}
        {centerSubtitle && (
          <text x={CX} y={170} textAnchor="middle" fontSize={13} fill="var(--color-accent-200)">
            {centerSubtitle}
          </text>
        )}
        {centerMeta && (
          <text
            x={CX}
            y={190}
            textAnchor="middle"
            fontSize={11}
            fill="color-mix(in srgb, var(--color-text) 50%, transparent)"
          >
            {centerMeta}
          </text>
        )}
      </g>
    </svg>
  )
}
