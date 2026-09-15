# M_Tracker 🌸

A calm, private **menstrual cycle tracker for two people**. Log when each
period started and ended; the app learns each person's real cycle and period
lengths, predicts the next period + fertile window, and shows the current cycle
on a clean **circular phase calendar**.

Built as an installable **PWA** (add to home screen, works offline for viewing)
with optional **cloud sync** across phones via Supabase.

## Features

- **Two profiles**, each with their own baseline cycle/period length and colour.
- **Log periods** per month (start + end date), with edit/delete history.
- **Predictions** that improve with data: next period (with a likely range),
  estimated ovulation, and the fertile window.
- **Circular phase calendar** — numbered day-bubbles coloured by phase
  (Menstruation / Follicular / Fertile / Ovulation / Luteal), with Follicular &
  Luteal arcs. Tap any day for its date + phase.
- **Reports**: average cycle & period length, regularity, cycle-length trend
  chart, period-length chart, and a two-person side-by-side comparison.
- **Cloud sync** (optional) so both partners log from their own devices.

## How the maths works

- A cycle is measured from one period start (day 1) to the day before the next.
- Ovulation is placed a stable **luteal length** (~14 days) *before* the next
  predicted period — more reliable than "half the cycle".
- The **fertile window** is the 5 days before ovulation through ovulation day.
- Averages use a rolling mean of the most recent cycles and fall back to each
  profile's defaults until there's enough real data.

All of this lives in `src/lib/cycle.ts` as pure functions and is covered by unit
tests (`src/lib/cycle.test.ts`).

> ⚠️ Predictions are estimates for planning/awareness, **not** medical advice or
> a contraceptive method.

## Quick start (local, demo data)

```bash
npm install
npm run dev
```

Open the printed URL. With no Supabase configured, the app runs in **demo mode**
using sample data stored in your browser — great for exploring the UI.

## Enable cloud sync (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase **SQL Editor**, paste and run [`supabase/schema.sql`](supabase/schema.sql).
   It creates the `profiles` + `cycles` tables, seeds two people, and enables
   realtime.
3. In **Project Settings → API**, copy the **Project URL** and **anon public**
   key.
4. Copy `.env.example` to `.env` and fill them in:

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhb...
   ```

5. Restart `npm run dev` (or redeploy). The Settings screen banner turns green
   and edits now sync across every device that opens the app.

**Privacy note:** the schema uses open row-level-security policies, so the app
works without a login screen — the project URL + anon key are effectively the
shared secret. For stronger protection, add Supabase Auth and tighten the
policies in `schema.sql` to authenticated users only.

## Scripts

| Command             | What it does                              |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Vite dev server                           |
| `npm run build`     | Typecheck + production build              |
| `npm run preview`   | Serve the production build locally        |
| `npm run test`      | Run the cycle-maths unit tests (Vitest)   |
| `npm run typecheck` | TypeScript project build (no bundle)      |
| `npm run lint`      | ESLint                                     |

## Deploy (free)

Any static host works since the app is a client-side SPA.

- **Netlify / Vercel** (recommended): connect the GitHub repo, set the two
  `VITE_SUPABASE_*` env vars in the project settings, build command
  `npm run build`, publish directory `dist`. SPA fallback to `index.html` is
  handled by the platform.
- **GitHub Pages**: works too; serve `dist/` and ensure the SPA fallback
  redirects unknown routes to `index.html`.

Then open the deployed URL on each phone and **Add to Home Screen** to install
it as an app.

## Tech

React + Vite + TypeScript · Tailwind CSS · Supabase (Postgres + Realtime) ·
vite-plugin-pwa · date-fns · Recharts · hand-built SVG wheel.

## Project layout

```
src/
  lib/        cycle.ts (maths + tests), dates.ts, derive.ts, phaseColors.ts,
              supabaseClient.ts, demoData.ts
  components/ CycleWheel.tsx, ProfileSwitcher.tsx, StatCard.tsx,
              PhaseLegend.tsx, EmptyState.tsx, DemoBanner.tsx
  screens/    Home.tsx, Log.tsx, Wheel.tsx, Reports.tsx, Settings.tsx
  store.tsx   data + sync provider (cloud or demo)
supabase/schema.sql
```
