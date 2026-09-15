import { useState } from 'react'
import { SignOut } from '@phosphor-icons/react'
import { useStore } from '../store'
import { useSession } from '../session'
import type { Profile } from '../types'

export default function Settings() {
  const { profiles, mode } = useStore()
  const { self, subject, choosePerson, setView, signOut } = useSession()

  function switchTo(p: Profile, index: number) {
    choosePerson(p.id)
    // ponytail: same profiles[0]-is-tracked assumption as SignIn; a Profile.role
    // field would replace the index convention if it ever stops holding.
    setView(index === 0 ? 'self' : 'partner')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Signed in as */}
      <section>
        <div className="kicker pb-2.5">Signed in as</div>
        <div className="card" style={{ padding: 'var(--space-4)', gap: 'var(--space-3)' }}>
          {profiles.map((p, i) => {
            const active = p.id === self?.id
            return (
              <div key={p.id} className="flex items-center gap-2.5">
                <span
                  className="grid h-[26px] w-[26px] place-items-center rounded-full text-[12px]"
                  style={{
                    background: active ? 'var(--color-accent-800)' : 'var(--color-neutral-800)',
                    color: active ? 'var(--color-accent-100)' : 'var(--color-neutral-100)',
                  }}
                >
                  {p.name[0]}
                </span>
                <div className="flex-1 text-[14px]">
                  {p.name.toLowerCase()}{' '}
                  <span className="text-muted">· {i === 0 ? 'her view' : 'his view'}</span>
                </div>
                {!active && (
                  <button className="tag tag-outline" onClick={() => switchTo(p, i)}>
                    Switch
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Baseline for the tracked person */}
      {subject && <BaselineCard key={subject.id} profile={subject} />}

      {/* Sync */}
      <section>
        <div className="kicker pb-2.5">Sync</div>
        <div className="card" style={{ padding: 'var(--space-4)', gap: 'var(--space-2)' }}>
          <div className="flex items-center gap-2 text-[14px]">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: mode === 'cloud' ? 'var(--color-accent)' : 'var(--color-neutral-500)' }}
            />
            {mode === 'cloud' ? 'Synced across both phones' : 'On this device (demo data)'}
          </div>
          <div className="text-[12px] text-muted">
            {mode === 'cloud'
              ? 'Both phones see the same log. Notes stay with the person who wrote them.'
              : 'Connect Supabase (see README) to sync the log across both phones.'}
          </div>
        </div>
      </section>

      <button className="btn btn-secondary btn-block" style={{ minHeight: 42 }} onClick={signOut}>
        <SignOut size={16} />
        Sign out of both
      </button>
    </div>
  )
}

const CLAMP = { cycle: [20, 45, 28], period: [1, 12, 5], luteal: [9, 17, 14] } as const

function num(v: string, [min, max, fallback]: readonly [number, number, number]) {
  const n = parseInt(v, 10)
  if (Number.isNaN(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function BaselineCard({ profile }: { profile: Profile }) {
  const { updateProfile } = useStore()
  const [draft, setDraft] = useState(profile)
  const [saved, setSaved] = useState(false)

  const dirty =
    draft.default_cycle_length !== profile.default_cycle_length ||
    draft.default_period_length !== profile.default_period_length ||
    draft.luteal_length !== profile.luteal_length

  async function save() {
    await updateProfile(profile.id, {
      default_cycle_length: draft.default_cycle_length,
      default_period_length: draft.default_period_length,
      luteal_length: draft.luteal_length,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <section>
      <div className="kicker pb-2.5">{profile.name}’s baseline</div>
      <div className="card" style={{ gap: 'var(--space-4)' }}>
        <div className="grid grid-cols-3 gap-2.5">
          <Num
            label="Cycle"
            value={draft.default_cycle_length}
            onChange={(v) => setDraft({ ...draft, default_cycle_length: num(v, CLAMP.cycle) })}
          />
          <Num
            label="Period"
            value={draft.default_period_length}
            onChange={(v) => setDraft({ ...draft, default_period_length: num(v, CLAMP.period) })}
          />
          <Num
            label="Luteal"
            value={draft.luteal_length}
            onChange={(v) => setDraft({ ...draft, luteal_length: num(v, CLAMP.luteal) })}
          />
        </div>
        <p className="text-[11px] leading-relaxed text-muted">
          Used until enough real cycles are logged, then the app follows actual averages.
          Luteal length places the ovulation estimate.
        </p>
        <button className="btn btn-primary btn-block" style={{ minHeight: 40 }} onClick={save} disabled={!dirty}>
          {saved ? 'Saved ✓' : 'Save'}
        </button>
      </div>
    </section>
  )
}

function Num({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: string) => void
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <input type="number" inputMode="numeric" className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
