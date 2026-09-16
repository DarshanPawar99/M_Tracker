import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useStore } from '../store'
import { useSession } from '../session'
import {
  cycleStats,
  observedCycleLengths,
  sortCycles,
} from '../lib/cycle'
import { formatShort, parseISODate } from '../lib/dates'
import EmptyState from '../components/EmptyState'

// Literal ramp values — recharts writes these straight into SVG attributes.
const ACCENT = '#9184d9'
const ACCENT_200 = '#e7e5fe'
const GRID = '#3f424d'
const AXIS = '#9397ab'

const REGULARITY_LABEL: Record<string, string> = {
  regular: 'Regular',
  irregular: 'Irregular',
  unknown: 'Not enough data',
}

export default function Reports() {
  const { profiles, cyclesFor } = useStore()
  const { subject } = useSession()

  const { stats, series } = useMemo(() => {
    if (!subject) return { stats: null, series: [] as { label: string; length: number }[] }
    const s = cycleStats(cyclesFor(subject.id), subject)
    const asc = sortCycles(cyclesFor(subject.id))
    const lengths = observedCycleLengths(cyclesFor(subject.id))
    const cs = lengths.map((len, i) => ({
      label: formatShort(parseISODate(asc[i].start_date)),
      length: len,
    }))
    return { stats: s, series: cs }
  }, [subject, cyclesFor])

  if (!subject || !stats)
    return <EmptyState title="No one selected" body="Sign in to pick a person." />

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Avg cycle"
          value={`${stats.avgCycle} d`}
          hint={stats.minCycle ? `range ${stats.minCycle}–${stats.maxCycle}` : 'using default'}
        />
        <Stat label="Avg period" value={`${stats.avgPeriod} d`} hint={`${cyclesFor(subject.id).length} logged`} />
        <Stat
          label="Regularity"
          value={REGULARITY_LABEL[stats.regularity]}
          hint={stats.sampleCount >= 2 ? `± ${stats.stdDevCycle} d variation` : undefined}
        />
        <Stat label="Tracked" value={String(stats.sampleCount)} hint="complete cycles" />
      </div>

      <div className="card" style={{ gap: 'var(--space-3)' }}>
        <div className="flex items-baseline justify-between">
          <div className="text-[14px]">Cycle length</div>
          <div className="text-[12px] text-muted">last {series.length} cycles</div>
        </div>
        {series.length < 2 ? (
          <p className="py-6 text-center text-[12px] text-muted">
            Log a few more months to see the trend.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={series} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 5" stroke={GRID} vertical={false} />
              <XAxis dataKey="label" fontSize={10} tickLine={false} axisLine={false} stroke={AXIS} />
              <YAxis
                fontSize={10}
                tickLine={false}
                axisLine={false}
                stroke={AXIS}
                domain={['dataMin - 2', 'dataMax + 2']}
              />
              <Tooltip
                formatter={(v) => [`${v} days`, 'Cycle']}
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-divider)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: AXIS }}
              />
              <ReferenceLine y={stats.avgCycle} stroke={GRID} strokeDasharray="3 5" />
              <Line
                type="monotone"
                dataKey="length"
                stroke={ACCENT}
                strokeWidth={2}
                dot={{ r: 3, fill: ACCENT_200, stroke: ACCENT_200 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {profiles.length > 1 && (
        <div className="card" style={{ gap: 'var(--space-4)' }}>
          <div className="text-[14px]">Both of you</div>
          <table className="table">
            <thead>
              <tr>
                <th>Person</th>
                <th style={{ textAlign: 'right' }}>Cycle</th>
                <th style={{ textAlign: 'right' }}>Period</th>
                <th style={{ textAlign: 'right' }}>Regularity</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                const s = cycleStats(cyclesFor(p.id), p)
                return (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td style={{ textAlign: 'right' }}>{s.avgCycle} d</td>
                    <td style={{ textAlign: 'right' }}>{s.avgPeriod} d</td>
                    <td style={{ textAlign: 'right' }}>{REGULARITY_LABEL[s.regularity]}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card" style={{ gap: 4, padding: 'var(--space-4)' }}>
      <div className="kicker" style={{ color: 'var(--color-accent)' }}>{label}</div>
      <div className="mt-1.5" style={{ font: '500 24px/1 var(--font-heading)' }}>{value}</div>
      {hint && <div className="text-[11px] text-muted">{hint}</div>}
    </div>
  )
}
