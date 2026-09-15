import { Link } from 'react-router-dom'
import { useStore } from '../store'

/** Shown only in demo mode: explains data isn't syncing + links to setup. */
export default function DemoBanner() {
  const { mode } = useStore()
  if (mode !== 'demo') return null
  return (
    <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
      Running on sample data (stored on this device only). Connect Supabase to sync
      across phones —{' '}
      <Link to="/settings" className="font-semibold underline">
        see setup
      </Link>
      .
    </div>
  )
}
