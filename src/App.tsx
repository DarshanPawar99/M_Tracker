import { Suspense, lazy } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { useStore } from './store'
import ProfileSwitcher from './components/ProfileSwitcher'

// Code-split screens so heavy deps (charts) load only when that screen opens.
const Home = lazy(() => import('./screens/Home'))
const Log = lazy(() => import('./screens/Log'))
const Wheel = lazy(() => import('./screens/Wheel'))
const Reports = lazy(() => import('./screens/Reports'))
const Settings = lazy(() => import('./screens/Settings'))

const NAV = [
  { to: '/', label: 'Today', icon: HomeIcon, end: true },
  { to: '/log', label: 'Log', icon: PlusIcon, end: false },
  { to: '/wheel', label: 'Cycle', icon: WheelIcon, end: false },
  { to: '/reports', label: 'Reports', icon: ChartIcon, end: false },
  { to: '/settings', label: 'Settings', icon: GearIcon, end: false },
]

export default function App() {
  const { loading, error, mode } = useStore()

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-rose-50/60">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-rose-50/80 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-extrabold tracking-tight text-rose-700">
            M<span className="text-gray-400">_</span>Tracker
          </h1>
          {mode === 'demo' && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              Demo data
            </span>
          )}
        </div>
        <div className="mt-3">
          <ProfileSwitcher />
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-24">
        {error && (
          <div className="card mb-4 border-l-4 border-red-400 text-sm text-red-700">
            Couldn’t reach the database: {error}
          </div>
        )}
        {loading ? (
          <div className="grid place-items-center py-20 text-gray-400">Loading…</div>
        ) : (
          <Suspense
            fallback={
              <div className="grid place-items-center py-20 text-gray-400">Loading…</div>
            }
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

      <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-md justify-around border-t border-black/5 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
                isActive ? 'text-rose-600' : 'text-gray-400'
              }`
            }
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

/* --- tiny inline icons (stroke = currentColor) --- */
function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}
function HomeIcon() {
  return (
    <Svg>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </Svg>
  )
}
function PlusIcon() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </Svg>
  )
}
function WheelIcon() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3v3.5M12 17.5V21M3 12h3.5M17.5 12H21" />
    </Svg>
  )
}
function ChartIcon() {
  return (
    <Svg>
      <path d="M4 20V10M10 20V4M16 20v-6M22 20H2" />
    </Svg>
  )
}
function GearIcon() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1l-.3-2.5h-4l-.3 2.5a7 7 0 0 0-1.7 1l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.3 2.5h4l.3-2.5a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5c.06-.33.1-.66.1-1Z" />
    </Svg>
  )
}
