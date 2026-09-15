import { useState } from 'react'
import { useStore } from '../store'
import type { Profile } from '../types'
import DemoBanner from '../components/DemoBanner'

export default function Settings() {
  const { profiles, mode } = useStore()

  return (
    <div className="space-y-4">
      <DemoBanner />

      <div className="px-1 text-xs font-medium uppercase tracking-wide text-gray-400">
        People
      </div>
      {profiles.map((p) => (
        <ProfileEditor key={p.id} profile={p} />
      ))}

      <div className="px-1 pt-2 text-xs font-medium uppercase tracking-wide text-gray-400">
        Data & sync
      </div>
      <ConnectionCard mode={mode} />
    </div>
  )
}

const SWATCHES = ['#e11d48', '#6366f1', '#0ea5e9', '#16a34a', '#db2777', '#f59e0b']

function ProfileEditor({ profile }: { profile: Profile }) {
  const { updateProfile } = useStore()
  const [draft, setDraft] = useState(profile)
  const [saved, setSaved] = useState(false)

  const dirty =
    draft.name !== profile.name ||
    draft.color !== profile.color ||
    draft.default_cycle_length !== profile.default_cycle_length ||
    draft.default_period_length !== profile.default_period_length ||
    draft.luteal_length !== profile.luteal_length

  async function save() {
    await updateProfile(profile.id, {
      name: draft.name,
      color: draft.color,
      default_cycle_length: draft.default_cycle_length,
      default_period_length: draft.default_period_length,
      luteal_length: draft.luteal_length,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  function num(v: string, min: number, max: number, fallback: number) {
    const n = parseInt(v, 10)
    if (Number.isNaN(n)) return fallback
    return Math.min(max, Math.max(min, n))
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-3">
        <span
          className="h-8 w-8 shrink-0 rounded-full ring-2 ring-white shadow"
          style={{ backgroundColor: draft.color }}
        />
        <input
          className="input"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
      </div>

      <div>
        <label className="label">Accent color</label>
        <div className="flex gap-2">
          {SWATCHES.map((c) => (
            <button
              key={c}
              onClick={() => setDraft({ ...draft, color: c })}
              className={`h-7 w-7 rounded-full transition ${
                draft.color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''
              }`}
              style={{ backgroundColor: c }}
              aria-label={`Use ${c}`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Cycle (d)</label>
          <input
            type="number"
            className="input"
            value={draft.default_cycle_length}
            min={20}
            max={45}
            onChange={(e) =>
              setDraft({
                ...draft,
                default_cycle_length: num(e.target.value, 20, 45, 28),
              })
            }
          />
        </div>
        <div>
          <label className="label">Period (d)</label>
          <input
            type="number"
            className="input"
            value={draft.default_period_length}
            min={1}
            max={12}
            onChange={(e) =>
              setDraft({
                ...draft,
                default_period_length: num(e.target.value, 1, 12, 5),
              })
            }
          />
        </div>
        <div>
          <label className="label">Luteal (d)</label>
          <input
            type="number"
            className="input"
            value={draft.luteal_length}
            min={9}
            max={17}
            onChange={(e) =>
              setDraft({ ...draft, luteal_length: num(e.target.value, 9, 17, 14) })
            }
          />
        </div>
      </div>
      <p className="text-xs text-gray-400">
        These defaults are used until enough real cycles are logged, then the app learns
        each person’s actual averages. Luteal length places the ovulation estimate.
      </p>

      <button className="btn-primary w-full" onClick={save} disabled={!dirty}>
        {saved ? 'Saved ✓' : 'Save'}
      </button>
    </div>
  )
}

function ConnectionCard({ mode }: { mode: 'cloud' | 'demo' }) {
  if (mode === 'cloud')
    return (
      <div className="card">
        <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Connected to Supabase
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Changes sync across every device that opens this app with the same project.
        </p>
      </div>
    )

  return (
    <div className="card space-y-2 text-sm">
      <div className="flex items-center gap-2 font-semibold text-amber-700">
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Demo mode (no sync)
      </div>
      <p className="text-xs text-gray-500">
        To sync across both phones, create a free Supabase project and connect it:
      </p>
      <ol className="ml-4 list-decimal space-y-1 text-xs text-gray-600">
        <li>Create a project at supabase.com.</li>
        <li>
          Run the SQL in <code className="rounded bg-gray-100 px-1">supabase/schema.sql</code>{' '}
          (SQL editor).
        </li>
        <li>
          Copy the Project URL + anon key into a{' '}
          <code className="rounded bg-gray-100 px-1">.env</code> file (see{' '}
          <code className="rounded bg-gray-100 px-1">.env.example</code>).
        </li>
        <li>Redeploy / restart. This banner turns green.</li>
      </ol>
      <p className="text-xs text-gray-400">Full walkthrough is in the README.</p>
    </div>
  )
}
