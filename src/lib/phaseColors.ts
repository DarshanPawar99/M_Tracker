import type { Phase } from '../types'

// Phase palette drawn from Nocturne's accent + neutral ramps (mono system):
// the accent carries menstruation and the fertile/ovulation peak, neutrals sit
// in the low-fertility follicular stretch, and a deep accent step closes the
// luteal phase. Values are CSS variables so they track the theme tokens.
export const PHASE_COLORS: Record<Phase, string> = {
  menstrual: 'var(--color-accent)',
  follicular: 'var(--color-neutral-600)',
  fertile: 'var(--color-accent-400)',
  ovulation: 'var(--color-accent-200)',
  luteal: 'var(--color-accent-700)',
}
