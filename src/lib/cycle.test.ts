import { describe, expect, it } from 'vitest'
import type { Cycle, Profile } from '../types'
import {
  buildCycleWheel,
  cycleStats,
  observedCycleLengths,
  observedPeriodLengths,
  ovulationDay,
  phaseForDay,
  predictNextPeriod,
  rollingAverage,
} from './cycle'
import { parseISODate, toISODate } from './dates'

const profile: Profile = {
  id: 'p1',
  name: 'Test',
  color: '#e11d48',
  default_cycle_length: 28,
  default_period_length: 5,
  luteal_length: 14,
  created_at: '2026-01-01T00:00:00Z',
}

/** Build a cycle list from ISO start dates (+ optional period lengths). */
function cyclesFrom(starts: string[], periodLen = 5): Cycle[] {
  return starts.map((start, i) => ({
    id: `c${i}`,
    profile_id: 'p1',
    start_date: start,
    end_date: toISODate(
      new Date(parseISODate(start).getTime() + (periodLen - 1) * 86400000),
    ),
    note: null,
    created_at: `${start}T00:00:00Z`,
  }))
}

describe('observed lengths', () => {
  it('computes gaps between consecutive starts', () => {
    const cycles = cyclesFrom(['2026-01-01', '2026-01-29', '2026-02-26'])
    expect(observedCycleLengths(cycles)).toEqual([28, 28])
  })

  it('computes inclusive period lengths', () => {
    const cycles = cyclesFrom(['2026-01-01'], 5)
    expect(observedPeriodLengths(cycles)).toEqual([5])
  })

  it('ignores order of input', () => {
    const cycles = cyclesFrom(['2026-02-26', '2026-01-01', '2026-01-29'])
    expect(observedCycleLengths(cycles)).toEqual([28, 28])
  })
})

describe('rollingAverage', () => {
  it('falls back when empty', () => {
    expect(rollingAverage([], 28)).toBe(28)
  })
  it('averages only the most recent N', () => {
    expect(rollingAverage([40, 26, 26, 26, 26, 26, 26], 28, 6)).toBe(26)
  })
})

describe('cycleStats', () => {
  it('is a clean 28-day regular history', () => {
    const cycles = cyclesFrom([
      '2026-01-01',
      '2026-01-29',
      '2026-02-26',
      '2026-03-26',
    ])
    const stats = cycleStats(cycles, profile)
    expect(stats.avgCycle).toBe(28)
    expect(stats.avgPeriod).toBe(5)
    expect(stats.sampleCount).toBe(3)
    expect(stats.regularity).toBe('regular')
    expect(stats.stdDevCycle).toBe(0)
  })

  it('flags irregular histories', () => {
    const cycles = cyclesFrom(['2026-01-01', '2026-01-22', '2026-03-01'])
    const stats = cycleStats(cycles, profile)
    expect(stats.regularity).toBe('irregular')
  })

  it('falls back to profile defaults with no history', () => {
    const stats = cycleStats([], profile)
    expect(stats.avgCycle).toBe(28)
    expect(stats.sampleCount).toBe(0)
    expect(stats.regularity).toBe('unknown')
  })
})

describe('predictNextPeriod', () => {
  it('predicts next start + fertility markers for a regular history', () => {
    const cycles = cyclesFrom([
      '2025-12-04',
      '2026-01-01',
      '2026-01-29',
      '2026-02-26',
      '2026-03-26',
    ])
    const p = predictNextPeriod(cycles, profile)!
    // last start 2026-03-26 + 28 days
    expect(toISODate(p.date)).toBe('2026-04-23')
    // ovulation = next start - 14
    expect(toISODate(p.ovulation)).toBe('2026-04-09')
    // fertile window = ovulation-5 .. ovulation
    expect(toISODate(p.fertileStart)).toBe('2026-04-04')
    expect(toISODate(p.fertileEnd)).toBe('2026-04-09')
    expect(p.confidence).toBe('high')
  })

  it('returns null with no data', () => {
    expect(predictNextPeriod([], profile)).toBeNull()
  })

  it('widens the range for irregular / sparse data', () => {
    const cycles = cyclesFrom(['2026-01-01'])
    const p = predictNextPeriod(cycles, profile)!
    const spreadDays =
      (p.rangeHigh.getTime() - p.date.getTime()) / 86400000
    expect(spreadDays).toBe(4)
    expect(p.confidence).toBe('low')
  })
})

describe('phase assignment', () => {
  it('places ovulation 14 days before the next start on a 28-day cycle', () => {
    // day 15 == start + 14 == nextStart(day29) - 14
    expect(ovulationDay(28, 14)).toBe(15)
  })

  it('classifies days across a 28-day cycle', () => {
    expect(phaseForDay(1, 28, 5, 14)).toBe('menstrual')
    expect(phaseForDay(5, 28, 5, 14)).toBe('menstrual')
    expect(phaseForDay(8, 28, 5, 14)).toBe('follicular')
    expect(phaseForDay(11, 28, 5, 14)).toBe('fertile') // ov day 15, 15-5=10..14
    expect(phaseForDay(15, 28, 5, 14)).toBe('ovulation')
    expect(phaseForDay(20, 28, 5, 14)).toBe('luteal')
  })
})

describe('buildCycleWheel', () => {
  it('produces one entry per cycle day with correct dates', () => {
    const cycles = cyclesFrom([
      '2026-01-01',
      '2026-01-29',
      '2026-02-26',
    ])
    const stats = cycleStats(cycles, profile)
    const wheel = buildCycleWheel(parseISODate('2026-02-26'), stats, profile)
    expect(wheel).toHaveLength(28)
    expect(wheel[0].dayNumber).toBe(1)
    expect(toISODate(wheel[0].date)).toBe('2026-02-26')
    expect(wheel[0].phase).toBe('menstrual')
    expect(toISODate(wheel[27].date)).toBe('2026-03-25')
  })
})
