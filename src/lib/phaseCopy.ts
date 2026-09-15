import type { Phase } from '../types'

/** Short partner-facing framing per phase (his view heading + one-line tip). */
export const PHASE_COPY: Record<Phase, { heading: string; tip: string }> = {
  menstrual: {
    heading: 'Menstruation — rest and warmth help',
    tip: 'Her period is underway.',
  },
  follicular: {
    heading: 'Follicular phase — energy usually climbing',
    tip: 'Her period ended recently; the fertile window is ahead.',
  },
  fertile: {
    heading: 'Fertile window — higher chance of conception',
    tip: 'These are the most fertile days of her cycle.',
  },
  ovulation: {
    heading: 'Ovulation — peak fertility today',
    tip: 'Ovulation is estimated for today.',
  },
  luteal: {
    heading: 'Luteal phase — winding down',
    tip: 'The next period is approaching.',
  },
}
