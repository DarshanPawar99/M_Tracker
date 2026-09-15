/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cycle-phase palette (kept restrained + calm)
        phase: {
          menstrual: '#e11d48', // red
          follicular: '#a78bfa', // soft violet (outer arc)
          fertile: '#4ade80', // medium green (possible to conceive)
          ovulation: '#15803d', // deep green (peak)
          luteal: '#22b8cf', // teal-blue (uterine lining thickening)
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
