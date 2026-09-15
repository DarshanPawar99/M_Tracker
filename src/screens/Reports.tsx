import { useMemo } from 'react'
import {
  Bar,
  BarChart,
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
import {
  cycleStats,
  observedCycleLengths,
  observedPeriodLengths,
  predictNextPeriod,
  sortCycles,
} from '../lib/cycle'
import { formatShort, formatLong, parseISODate } from '../lib/dates'
import StatCard from '../components/StatCard'
import EmptyState from '../components/EmptyState'
import DemoBanner from '../components/DemoBanner'

const REGULARITY_LABEL: Record<string, string> = {
  regular: 'Regular',
  irregular: 'Irregular',
  unknown: 'Not enough data',
}

export default function Reports() {
  const { activeProfile, profiles, cyclesFor } = useStore()
  const cycles = useMemo(
    () => (activeProfile ? cyclesFor(activeProfile.id) : []),
    [activeProfile, cyclesFor],
  )

  const { stats, prediction, cycleSeries, periodSeries } = useMemo(() => {
    if (!activeProfile) return { stats: null, prediction: null, cycleSeries: [], periodSeries: [] }
    const s = cycleStats(cycles, activeProfile)
    const p = predictNextPeriod(cycles, activeProfile)
    const asc = sortCycles(cycles)
    const lengths = observedCycleLengths(cycles)
    const cs = lengths.map((len, i) => ({
      label: formatShort(parseISODate(asc[i].start_date)),
      length: len,
    }))
    const ps = observedPeriodLengths(cycles).map((len, i) => ({
      label: formatShort(parseISODate(asc[i].start_date)),
      length: len,
    }))
    return { stats: s, prediction: p, cycleSeries: cs, periodSeries: ps }
  }, [activeProfile, cycles])

  if (!activeProfile || !stats)
    return <EmptyState title="No profile selected" body="Pick a person up top." />

  const accent = activeProfile.color

  return (
    <div className="space-y-4">
      <DemoBanner />

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Avg cycle"
          value={`${stats.avgCycle} d`}
          hint={
            stats.minCycle
              ? `range ${stats.minCycle}–${stats.maxCycle} d`
              : 'using default'
          }
          accent={accent}
        />
        <StatCard label="Avg period" value={`${stats.avgPeriod} d`} accent={accent} />
        <StatCard
          label="Regularity"
          value={REGULARITY_LABEL[stats.regularity]}
          hint={stats.sampleCount >= 2 ? `± ${stats.stdDevCycle} d variation` : undefined}
        />
        <StatCard
          label="Cycles tracked"
          value={stats.sampleCount}
          hint={`${cycles.length} periods logged`}
        />
      </div>

      {prediction && (
        <div className="card text-sm">
          <div className="font-semibold text-gray-700">Next period</div>
          <div className="mt-1 text-lg font-bold" style={{ color: accent }}>
            {formatLong(prediction.date)}
          </div>
          <div className="text-xs text-gray-500">
            likely {formatShort(prediction.rangeLow)} – {formatShort(prediction.rangeHigh)} ·{' '}
            {prediction.confidence} confidence
          </div>
        </div>
      )}

      {/* Cycle length trend */}
      <div className="card">
        <div className="mb-2 text-sm font-semibold text-gray-700">
          Cycle length over time
        </div>
        {cycleSeries.length < 2 ? (
          <p className="py-6 text-center text-xs text-gray-400">
            Log a few more months to see the trend.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={cycleSeries} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip formatter={(v) => [`${v} days`, 'Cycle']} />
              <ReferenceLine y={stats.avgCycle} stroke="#cbd5e1" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="length"
                stroke={accent}
                strokeWidth={2.5}
                dot={{ r: 3, fill: accent }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Period length */}
      <div className="card">
        <div className="mb-2 text-sm font-semibold text-gray-700">Period length</div>
        {periodSeries.length < 1 ? (
          <p className="py-6 text-center text-xs text-gray-400">No completed periods yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={periodSeries} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip formatter={(v) => [`${v} days`, 'Period']} />
              <Bar dataKey="length" fill={accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Two-profile comparison */}
      {profiles.length > 1 && <Comparison />}
    </div>
  )
}

function Comparison() {
  const { profiles, cyclesFor } = useStore()
  const rows = profiles.map((p) => ({
    profile: p,
    stats: cycleStats(cyclesFor(p.id), p),
  }))
  return (
    <div className="card">
      <div className="mb-3 text-sm font-semibold text-gray-700">Side by side</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
            <th className="pb-2 font-medium">Person</th>
            <th className="pb-2 text-right font-medium">Cycle</th>
            <th className="pb-2 text-right font-medium">Period</th>
            <th className="pb-2 text-right font-medium">Regularity</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ profile, stats }) => (
            <tr key={profile.id} className="border-t border-gray-100">
              <td className="py-2 font-semibold">
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: profile.color }}
                  />
                  {profile.name}
                </span>
              </td>
              <td className="py-2 text-right">{stats.avgCycle} d</td>
              <td className="py-2 text-right">{stats.avgPeriod} d</td>
              <td className="py-2 text-right text-gray-600">
                {REGULARITY_LABEL[stats.regularity]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
