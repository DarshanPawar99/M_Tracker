// Thin date helpers. We store dates as 'YYYY-MM-DD' strings and treat them as
// calendar dates in the user's local timezone (no time-of-day, no UTC drift).
import {
  differenceInCalendarDays,
  format,
  parse,
  addDays as addDaysFns,
} from 'date-fns'

/** Parse an ISO 'YYYY-MM-DD' string into a local Date at midnight. */
export function parseISODate(iso: string): Date {
  return parse(iso, 'yyyy-MM-dd', new Date())
}

/** Format a Date as 'YYYY-MM-DD'. */
export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/** Today as a local Date at midnight. */
export function today(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/** Whole calendar days from `a` to `b` (b - a). */
export function daysBetween(a: Date, b: Date): number {
  return differenceInCalendarDays(b, a)
}

export function addDays(date: Date, amount: number): Date {
  return addDaysFns(date, amount)
}

/** Human-friendly short date, e.g. "26 Sep". */
export function formatShort(date: Date): string {
  return format(date, 'd MMM')
}

/** Human-friendly full date, e.g. "26 Sep 2026". */
export function formatLong(date: Date): string {
  return format(date, 'd MMM yyyy')
}
