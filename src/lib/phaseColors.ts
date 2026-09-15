import type { Phase } from '../types'

/** Fill / accent colors per phase — kept few and calm (matches the wheel). */
export const PHASE_COLORS: Record<Phase, string> = {
  menstrual: '#e11d48', // red
  follicular: '#f5d0c5', // soft peach (low fertility)
  fertile: '#4ade80', // medium green (possible to conceive)
  ovulation: '#15803d', // deep green (peak)
  luteal: '#67c9d6', // teal (uterine lining thickening)
}

/** A softer background tint of each phase, for sectors behind the day bubbles. */
export const PHASE_TINTS: Record<Phase, string> = {
  menstrual: '#fecdd3',
  follicular: '#fbe6de',
  fertile: '#bbf7d0',
  ovulation: '#86efac',
  luteal: '#c8ecf1',
}

/** Accessible darker tone for TEXT (the fill colors are too light to read). */
export const PHASE_TEXT: Record<Phase, string> = {
  menstrual: '#be123c',
  follicular: '#b45309',
  fertile: '#15803d',
  ovulation: '#14532d',
  luteal: '#0e7490',
}
