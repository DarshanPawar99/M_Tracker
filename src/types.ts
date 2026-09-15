// Shared domain types for M_Tracker.

/** A tracked person. Two of these exist in a typical couple's install. */
export interface Profile {
  id: string
  name: string
  /** Hex accent color used across the wheel + charts for this person. */
  color: string
  /** Baseline cycle length (days) used until enough real data is logged. */
  default_cycle_length: number
  /** Baseline period (bleeding) length in days. */
  default_period_length: number
  /** Luteal phase length in days (stable ~14; used to place ovulation). */
  luteal_length: number
  created_at: string
}

/** One logged period. A "cycle" is measured from one start_date to the next. */
export interface Cycle {
  id: string
  profile_id: string
  /** First day of bleeding (CD1), ISO date string 'YYYY-MM-DD'. */
  start_date: string
  /** Last day of bleeding, ISO date string. null while the period is ongoing. */
  end_date: string | null
  note: string | null
  created_at: string
}

export type Phase = 'menstrual' | 'follicular' | 'ovulation' | 'fertile' | 'luteal'

export type Regularity = 'regular' | 'irregular' | 'unknown'

/** Aggregate statistics derived from a profile's logged cycles. */
export interface CycleStats {
  /** Rolling-average cycle length (falls back to profile default). */
  avgCycle: number
  /** Rolling-average period length (falls back to profile default). */
  avgPeriod: number
  minCycle: number | null
  maxCycle: number | null
  /** Standard deviation of observed cycle lengths (0 when < 2 samples). */
  stdDevCycle: number
  /** Number of complete cycles observed (gaps between starts). */
  sampleCount: number
  regularity: Regularity
}

export interface Prediction {
  /** Predicted next period start. */
  date: Date
  /** Earliest / latest likely start given variability. */
  rangeLow: Date
  rangeHigh: Date
  /** 'high' | 'medium' | 'low' based on sample size + regularity. */
  confidence: 'high' | 'medium' | 'low'
  ovulation: Date
  fertileStart: Date
  fertileEnd: Date
}

/** One day of the circular calendar. */
export interface WheelDay {
  /** 1-based day of the cycle. */
  dayNumber: number
  date: Date
  phase: Phase
  isToday: boolean
  isFertile: boolean
  label: string
}
