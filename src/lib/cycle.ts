// Pure cycle math. No React, no I/O — everything here is unit-tested in
// cycle.test.ts. Dates in / dates out; the UI formats them.
//
// Model (see README + plan for the science):
//   - A cycle runs from one period start (CD1) to the day before the next start.
//   - Ovulation is placed a stable luteal length (~14 days) BEFORE the next start.
//   - The fertile window is the 5 days before ovulation through ovulation day.
import type {
  Cycle,
  CycleStats,
  Phase,
  Prediction,
  Profile,
  Regularity,
  WheelDay,
} from '../types'
import {
  addDays,
  daysBetween,
  formatShort,
  parseISODate,
  today,
} from './dates'

/** How many recent cycles feed the rolling average. */
const ROLLING_WINDOW = 6

/** Sort cycles oldest → newest by start date (does not mutate input). */
export function sortCycles(cycles: Cycle[]): Cycle[] {
  return [...cycles].sort((a, b) => a.start_date.localeCompare(b.start_date))
}

/** Gaps (in days) between consecutive period starts. n cycles → n-1 lengths. */
export function observedCycleLengths(cycles: Cycle[]): number[] {
  const sorted = sortCycles(cycles)
  const lengths: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    const prev = parseISODate(sorted[i - 1].start_date)
    const curr = parseISODate(sorted[i].start_date)
    lengths.push(daysBetween(prev, curr))
  }
  return lengths
}

/** Bleeding length per logged period (inclusive). Ignores ongoing periods. */
export function observedPeriodLengths(cycles: Cycle[]): number[] {
  return cycles
    .filter((c) => c.end_date)
    .map(
      (c) => daysBetween(parseISODate(c.start_date), parseISODate(c.end_date!)) + 1,
    )
    .filter((n) => n > 0)
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

/** Population standard deviation. Returns 0 for < 2 values. */
export function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const m = mean(values)
  const variance = mean(values.map((v) => (v - m) ** 2))
  return Math.sqrt(variance)
}

/** Mean of the most recent `n` values, or `fallback` when empty. */
export function rollingAverage(
  values: number[],
  fallback: number,
  n = ROLLING_WINDOW,
): number {
  if (values.length === 0) return fallback
  const recent = values.slice(-n)
  return mean(recent)
}

function classifyRegularity(samples: number[]): Regularity {
  if (samples.length < 2) return 'unknown'
  return stdDev(samples) <= 3.5 ? 'regular' : 'irregular'
}

/** Aggregate stats for a profile from its logged cycles. */
export function cycleStats(cycles: Cycle[], profile: Profile): CycleStats {
  const cycleLengths = observedCycleLengths(cycles)
  const periodLengths = observedPeriodLengths(cycles)

  const avgCycleRaw = rollingAverage(cycleLengths, profile.default_cycle_length)
  const avgPeriodRaw = rollingAverage(periodLengths, profile.default_period_length)

  return {
    avgCycle: round1(avgCycleRaw),
    avgPeriod: round1(avgPeriodRaw),
    minCycle: cycleLengths.length ? Math.min(...cycleLengths) : null,
    maxCycle: cycleLengths.length ? Math.max(...cycleLengths) : null,
    stdDevCycle: round1(stdDev(cycleLengths)),
    sampleCount: cycleLengths.length,
    regularity: classifyRegularity(cycleLengths),
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function confidenceFor(stats: CycleStats): Prediction['confidence'] {
  if (stats.sampleCount >= 4 && stats.regularity === 'regular') return 'high'
  if (stats.sampleCount >= 2) return 'medium'
  return 'low'
}

/**
 * Predict the next period start (and the fertility markers around it) from the
 * most recent logged period. Requires at least one logged cycle.
 */
export function predictNextPeriod(
  cycles: Cycle[],
  profile: Profile,
): Prediction | null {
  const sorted = sortCycles(cycles)
  if (sorted.length === 0) return null

  const stats = cycleStats(cycles, profile)
  const lastStart = parseISODate(sorted[sorted.length - 1].start_date)
  const cycleLen = Math.round(stats.avgCycle)

  const date = addDays(lastStart, cycleLen)

  // Spread: ± the observed variability, wider when we have little data.
  const spread =
    stats.sampleCount < 2 ? 4 : Math.max(1, Math.round(stats.stdDevCycle))

  const ovulation = addDays(date, -profile.luteal_length)

  return {
    date,
    rangeLow: addDays(date, -spread),
    rangeHigh: addDays(date, spread),
    confidence: confidenceFor(stats),
    ovulation,
    fertileStart: addDays(ovulation, -5),
    fertileEnd: ovulation,
  }
}

/** Cycle-day (1-based) on which ovulation falls, given a cycle length. */
export function ovulationDay(cycleLen: number, lutealLen: number): number {
  // Ovulation date = nextStart − luteal = start + (cycleLen − luteal).
  // Day 1 == start, so that date sits on cycle day (cycleLen − luteal) + 1.
  return cycleLen - lutealLen + 1
}

/** Classify a single cycle day (1-based) into a phase. */
export function phaseForDay(
  day: number,
  cycleLen: number,
  periodLen: number,
  lutealLen: number,
): Phase {
  const ovDay = ovulationDay(cycleLen, lutealLen)
  if (day <= periodLen) return 'menstrual'
  if (day === ovDay) return 'ovulation'
  if (day >= ovDay - 5 && day < ovDay) return 'fertile'
  if (day > ovDay) return 'luteal'
  return 'follicular'
}

/**
 * Build the per-day ring for the circular calendar for the cycle that begins
 * on `cycleStart`. Length follows the profile's rolling-average cycle length.
 */
export function buildCycleWheel(
  cycleStart: Date,
  stats: CycleStats,
  profile: Profile,
): WheelDay[] {
  const cycleLen = Math.round(stats.avgCycle)
  const periodLen = Math.round(stats.avgPeriod)
  const now = today()

  const days: WheelDay[] = []
  for (let day = 1; day <= cycleLen; day++) {
    const date = addDays(cycleStart, day - 1)
    const phase = phaseForDay(day, cycleLen, periodLen, profile.luteal_length)
    days.push({
      dayNumber: day,
      date,
      phase,
      isToday: daysBetween(now, date) === 0,
      isFertile: phase === 'fertile' || phase === 'ovulation',
      label: `Day ${day} · ${phaseLabel(phase)} · ${formatShort(date)}`,
    })
  }
  return days
}

/** Which cycle day is `date`, relative to the most recent period start. */
export function currentCycleDay(cycles: Cycle[]): {
  day: number
  cycleStart: Date
} | null {
  const sorted = sortCycles(cycles)
  if (sorted.length === 0) return null
  const cycleStart = parseISODate(sorted[sorted.length - 1].start_date)
  return { day: daysBetween(cycleStart, today()) + 1, cycleStart }
}

export function phaseLabel(phase: Phase): string {
  switch (phase) {
    case 'menstrual':
      return 'Menstruation'
    case 'follicular':
      return 'Follicular'
    case 'fertile':
      return 'Fertile window'
    case 'ovulation':
      return 'Ovulation'
    case 'luteal':
      return 'Luteal'
  }
}
