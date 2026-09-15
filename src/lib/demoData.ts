// Sample data for demo mode (when Supabase isn't configured yet). Generated
// relative to today so the wheel + predictions always look current in a preview.
import type { Cycle, Profile } from '../types'
import { addDays, toISODate, today } from './dates'

export const DEMO_PROFILES: Profile[] = [
  {
    id: 'demo-aria',
    name: 'Aria',
    color: '#e11d48',
    default_cycle_length: 28,
    default_period_length: 5,
    luteal_length: 14,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'demo-sam',
    name: 'Sam',
    color: '#6366f1',
    default_cycle_length: 30,
    default_period_length: 4,
    luteal_length: 14,
    created_at: '2026-01-01T00:00:00Z',
  },
]

/** Build ~6 months of history walking backwards from a recent start. */
function history(
  profileId: string,
  cycleLen: number,
  periodLen: number,
  jitter: number[],
  daysSinceLastStart: number,
): Cycle[] {
  const cycles: Cycle[] = []
  let start = addDays(today(), -daysSinceLastStart)
  for (let i = 0; i < jitter.length; i++) {
    const end = addDays(start, periodLen - 1)
    cycles.push({
      id: `${profileId}-${i}`,
      profile_id: profileId,
      start_date: toISODate(start),
      end_date: toISODate(end),
      note: null,
      created_at: `${toISODate(start)}T00:00:00Z`,
    })
    // Walk back to the previous cycle's start.
    start = addDays(start, -(cycleLen + jitter[i]))
  }
  return cycles.reverse()
}

export const DEMO_CYCLES: Cycle[] = [
  ...history('demo-aria', 28, 5, [0, 1, -1, 0, 2, -1], 6),
  ...history('demo-sam', 30, 4, [0, -2, 1, 3, -1, 0], 11),
]
