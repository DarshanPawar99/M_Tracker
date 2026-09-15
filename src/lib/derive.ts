// Convenience: turn a profile's raw cycles into everything the UI renders.
import type { Cycle, CycleStats, Prediction, Profile, WheelDay } from '../types'
import {
  buildCycleWheel,
  currentCycleDay,
  cycleStats,
  ovulationDay,
  predictNextPeriod,
} from './cycle'

export interface CycleView {
  stats: CycleStats
  prediction: Prediction | null
  /** 1-based day of the current cycle (may exceed cycle length if overdue). */
  currentDay: number | null
  cycleStart: Date | null
  days: WheelDay[]
  ovulationDayNumber: number
}

export function deriveCycleView(cycles: Cycle[], profile: Profile): CycleView {
  const stats = cycleStats(cycles, profile)
  const prediction = predictNextPeriod(cycles, profile)
  const current = currentCycleDay(cycles)
  const cycleLen = Math.round(stats.avgCycle)

  return {
    stats,
    prediction,
    currentDay: current?.day ?? null,
    cycleStart: current?.cycleStart ?? null,
    days: current ? buildCycleWheel(current.cycleStart, stats, profile) : [],
    ovulationDayNumber: ovulationDay(cycleLen, profile.luteal_length),
  }
}
