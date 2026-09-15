import { useEffect, useState } from 'react'
import { User, Eye, EyeSlash, Drop, Heart } from '@phosphor-icons/react'
import { useStore } from '../store'
import { useSession } from '../session'

/**
 * Shared-account sign-in: both names, one password. Picking who is on the phone
 * opens the right view. The password is a local device lock (see lib/session) —
 * it gates opening the app on a shared phone, not the cloud data itself.
 */
export default function SignIn() {
  const { profiles, loading } = useStore()
  const { needsSetup, signIn, setView } = useSession()

  const [personId, setPersonId] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Default the selection to the first profile once loaded.
  useEffect(() => {
    if (!personId && profiles.length) setPersonId(profiles[0].id)
  }, [profiles, personId])

  const her = profiles[0]
  const him = profiles[1]

  async function submit() {
    if (!personId) return
    if (!password) {
      setError('Enter the shared password.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const ok = await signIn(personId, password)
      if (!ok) {
        setError('That password doesn’t match.')
        return
      }
      // ponytail: her/his split assumes profiles[0] is the tracked person;
      // add a Profile.role field if a couple ever needs the roles the other way.
      setView(personId === her?.id ? 'self' : 'partner')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-muted">Loading…</div>
    )
  }

  return (
    <div
      className="mx-auto flex min-h-screen w-full flex-col justify-center gap-6 px-7"
      style={{
        maxWidth: 448,
        background: 'radial-gradient(120% 70% at 20% 0%, #1d1f33 0%, var(--color-bg) 60%)',
      }}
    >
      <div>
        <div style={{ font: '500 20px/1.1 var(--font-heading)', letterSpacing: '-0.015em' }}>
          M<span style={{ color: 'var(--color-accent)' }}>_</span>Tracker
        </div>
        <p className="mt-2.5 text-[13px] text-muted" style={{ maxWidth: 250 }}>
          One shared account for the two of you. Both names, one password.
        </p>
      </div>

      <div className="flex flex-col gap-3.5">
        <div className="field">
          <label>Her username</label>
          <div className="input flex items-center gap-2">
            <User size={15} color="var(--color-accent)" />
            {her?.name.toLowerCase() ?? '—'}
          </div>
        </div>
        {him && (
          <div className="field">
            <label>His username</label>
            <div className="input flex items-center gap-2">
              <User size={15} color="var(--color-accent)" />
              {him.name.toLowerCase()}
            </div>
          </div>
        )}
        <div className="field">
          <label>{needsSetup ? 'Set a shared password' : 'Shared password'}</label>
          <div className="input flex items-center justify-between gap-2" style={{ padding: 0 }}>
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder={needsSetup ? 'choose a password' : '••••••••'}
              autoComplete={needsSetup ? 'new-password' : 'current-password'}
              className="min-w-0 flex-1 bg-transparent px-2.5 outline-none"
              style={{ height: 38, color: 'var(--color-text)' }}
            />
            <button
              type="button"
              aria-label={show ? 'Hide password' : 'Show password'}
              onClick={() => setShow((s) => !s)}
              className="grid place-items-center px-2.5"
              style={{ color: 'var(--text-muted)' }}
            >
              {show ? <EyeSlash size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 text-[12px] text-dim">Who is on this phone?</div>
        <div className="flex gap-2.5">
          {profiles.map((p, i) => {
            const active = p.id === personId
            const Icon = i === 0 ? Drop : Heart
            return (
              <button
                key={p.id}
                onClick={() => setPersonId(p.id)}
                className="flex flex-1 items-center gap-2 px-3 py-2.5 text-[14px]"
                style={{
                  borderRadius: 'var(--radius-md)',
                  boxShadow: active
                    ? 'inset 0 0 0 1px var(--color-accent)'
                    : 'inset 0 0 0 1px var(--color-divider)',
                  color: active ? 'var(--color-accent)' : 'var(--text-dim)',
                }}
              >
                <Icon size={15} weight={active && i === 0 ? 'fill' : 'regular'} />
                {p.name}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {error && <div className="text-[13px]" style={{ color: 'var(--color-accent-300)' }}>{error}</div>}
        <button
          className="btn btn-primary btn-block"
          style={{ minHeight: 42 }}
          onClick={submit}
          disabled={busy}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="text-[11px] leading-relaxed text-muted">
          {needsSetup
            ? 'This first password becomes the shared unlock for both of you on this device. Choose the person to open the right view.'
            : 'The password is shared, so whoever signs in sees both names. Choose the person to open the right view — you can switch it later in Settings.'}
        </p>
      </div>
    </div>
  )
}
