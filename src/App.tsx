import { Suspense, lazy, useMemo } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import {
  House,
  Drop,
  CircleDashed,
  ChartLine,
  Heart,
  Gear,
} from '@phosphor-icons/react'
import { useStore } from './store'
import { useSession } from './session'
import { formatShort, formatWeekdayDate, parseISODate, today } from './lib/dates'
import SignIn from './screens/SignIn'

// Code-split screens so heavy deps (charts) load only when that screen opens.
const Home = lazy(() => import('./screens/Home'))
const Log = lazy(() => import('./screens/Log'))
const Wheel = lazy(() => import('./screens/Wheel'))
const Reports = lazy(() => import('./screens/Reports'))
const Settings = lazy(() => import('./screens/Settings'))

interface Tab {
  to: string
  label: string
  icon: typeof House
  end: boolean
}

const SELF_NAV: Tab[] = [
  { to: '/', label: 'Today', icon: House, end: true },
  { to: '/log', label: 'Log', icon: Drop, end: false },
  { to: '/wheel', label: 'Cycle', icon: CircleDashed, end: false },
  { to: '/reports', label: 'Reports', icon: ChartLine, end: false },
]

const PARTNER_NAV: Tab[] = [
  { to: '/', label: 'Her', icon: Heart, end: true },
  { to: '/wheel', label: 'Cycle', icon: CircleDashed, end: false },
  { to: '/log', label: 'Log', icon: Drop, end: false },
  { to: '/reports', label: 'Reports', icon: ChartLine, end: false },
]

export default function App() {
  const { unlocked } = useSession()
  if (!unlocked) return <SignIn />
  return <AppShell />
}

function AppShell() {
  const { loading, error } = useStore()
  const { view } = useSession()
  const nav = view === 'partner' ? PARTNER_NAV : SELF_NAV
  const header = useHeader()

  return (
    <div
      className="mx-auto flex min-h-screen w-full flex-col"
      style={{ maxWidth: 448, background: 'var(--color-bg)' }}
    >
      <Header {...header} />

      <main className="flex-1 px-5 pb-28 pt-1">
        {error && (
          <div
            className="card mb-4 text-sm"
            style={{ boxShadow: 'inset 0 0 0 1px var(--color-accent-700)' }}
          >
            Couldn’t reach the database: {error}
          </div>
        )}
        {loading ? (
          <div className="grid place-items-center py-20 text-muted">Loading…</div>
        ) : (
          <Suspense
            fallback={<div className="grid place-items-center py-20 text-muted">Loading…</div>}
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/log" element={<Log />} />
              <Route path="/wheel" element={<Wheel />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        )}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-10 mx-auto flex w-full gap-1 px-5 pt-2.5"
        style={{
          maxWidth: 448,
          background: 'var(--color-bg)',
          boxShadow: '0 -18px 22px 10px var(--color-bg)',
          paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={label}
            to={to}
            end={end}
            className="flex flex-1 flex-col items-center gap-1.5 py-2"
          >
            {({ isActive }) => (
              <>
                <Icon size={21} weight={isActive ? 'fill' : 'regular'} color={isActive ? 'var(--color-accent)' : 'var(--text-muted)'} />
                <span
                  className="text-[10px] tracking-wide"
                  style={{ color: isActive ? 'var(--color-accent)' : 'var(--text-muted)' }}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

interface HeaderInfo {
  kicker: string
  heading: string
}

/** Derive the per-screen kicker + heading from the route + session. */
function useHeader(): HeaderInfo {
  const { pathname } = useLocation()
  const { subject, view } = useSession()
  const { cyclesFor } = useStore()
  const name = subject?.name ?? '—'

  return useMemo(() => {
    if (pathname === '/settings') return { kicker: 'Shared account', heading: 'Settings' }
    if (pathname.startsWith('/log')) return { kicker: name, heading: 'Log a period' }
    if (pathname.startsWith('/reports')) return { kicker: name, heading: 'Patterns' }
    if (pathname.startsWith('/wheel')) {
      const cs = subject ? cyclesFor(subject.id) : []
      const count = cs.length
      const last = [...cs].sort((a, b) => b.start_date.localeCompare(a.start_date))[0]
      const from = last ? ` · from ${formatShort(parseISODate(last.start_date))}` : ''
      return { kicker: count ? `Cycle ${count}${from}` : 'This cycle', heading: 'This cycle' }
    }
    // Home / Today
    if (view === 'partner') return { kicker: formatWeekdayDate(today()), heading: `${name}’s cycle` }
    return { kicker: formatWeekdayDate(today()), heading: name }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, name, view])
}

function Header({ kicker, heading }: HeaderInfo) {
  const { view, setView, partner } = useSession()
  const canSwitch = Boolean(partner)
  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between px-5 pb-3 pt-5"
      style={{ background: 'var(--color-bg)', top: 'env(safe-area-inset-top, 0px)' }}
    >
      <div>
        <div className="kicker">{kicker}</div>
        <div
          className="mt-1.5"
          style={{ font: '500 21px/1.1 var(--font-heading)', letterSpacing: '-0.015em' }}
        >
          {heading}
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <button
          className="tag tag-neutral"
          disabled={!canSwitch}
          onClick={() => canSwitch && setView(view === 'self' ? 'partner' : 'self')}
          title={canSwitch ? 'Switch view' : undefined}
          style={{ cursor: canSwitch ? 'pointer' : 'default' }}
        >
          {view === 'partner' ? 'His view' : 'Her view'}
        </button>
        <NavLink to="/settings" aria-label="Settings" className="grid place-items-center">
          {({ isActive }) => (
            <Gear size={19} weight={isActive ? 'fill' : 'regular'} color={isActive ? 'var(--color-accent)' : 'var(--text-muted)'} />
          )}
        </NavLink>
      </div>
    </header>
  )
}
