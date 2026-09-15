// Session context: the shared account's local lock + which person is "on the
// phone" + self/partner (her/his) view. Sits inside StoreProvider so it can
// read profiles and set the active person. Kept explicit — this is the
// session-handling path.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Profile } from './types'
import { useStore } from './store'
import {
  createLock,
  subjectFor,
  verifyPassphrase,
  type LockRecord,
  type ViewMode,
} from './lib/session'

const LOCK_KEY = 'm_tracker_lock_v1'
const VIEW_KEY = 'm_tracker_view_v1'
const PERSON_KEY = 'm_tracker_person_v1'
const UNLOCK_KEY = 'm_tracker_unlocked_v1' // per-tab: re-locks on a fresh launch

interface SessionValue {
  unlocked: boolean
  /** No passphrase set yet — first sign-in sets it. */
  needsSetup: boolean
  view: ViewMode
  setView: (v: ViewMode) => void
  /** The person signed in on this phone. */
  self: Profile | null
  /** The other person in the account. */
  partner: Profile | null
  /** Whose cycle the screens display (partner in "his" view, else self). */
  subject: Profile | null
  /** Notes are only editable in one's own (her) view. */
  canEditNotes: boolean
  /** Pick who is on the phone before unlocking. */
  choosePerson: (id: string) => void
  /** Set/verify the passphrase and unlock. Returns false on a wrong one. */
  signIn: (personId: string, passphrase: string) => Promise<boolean>
  /** Lock the app on this device (sign out of both). */
  signOut: () => void
}

const SessionContext = createContext<SessionValue | null>(null)

function readLock(): LockRecord | null {
  try {
    const raw = localStorage.getItem(LOCK_KEY)
    return raw ? (JSON.parse(raw) as LockRecord) : null
  } catch {
    return null
  }
}

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const { profiles, activeProfile, activeProfileId, setActiveProfileId } =
    useStore()

  const [lock, setLock] = useState<LockRecord | null>(() => readLock())
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(UNLOCK_KEY) === '1'
    } catch {
      return false
    }
  })
  const [view, setViewState] = useState<ViewMode>(() =>
    readStored(VIEW_KEY) === 'partner' ? 'partner' : 'self',
  )

  // Restore the last person on the phone once profiles have loaded.
  useEffect(() => {
    if (!profiles.length) return
    const stored = readStored(PERSON_KEY)
    if (stored && profiles.some((p) => p.id === stored)) {
      setActiveProfileId(stored)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles.length])

  const setView = useCallback((v: ViewMode) => {
    setViewState(v)
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {
      /* storage may be unavailable — non-fatal */
    }
  }, [])

  const choosePerson = useCallback(
    (id: string) => {
      setActiveProfileId(id)
      try {
        localStorage.setItem(PERSON_KEY, id)
      } catch {
        /* non-fatal */
      }
    },
    [setActiveProfileId],
  )

  const signIn = useCallback(
    async (personId: string, passphrase: string): Promise<boolean> => {
      if (!passphrase) return false
      if (lock) {
        const ok = await verifyPassphrase(passphrase, lock)
        if (!ok) return false
      } else {
        const fresh = await createLock(passphrase)
        setLock(fresh)
        try {
          localStorage.setItem(LOCK_KEY, JSON.stringify(fresh))
        } catch {
          /* non-fatal */
        }
      }
      choosePerson(personId)
      setUnlocked(true)
      try {
        sessionStorage.setItem(UNLOCK_KEY, '1')
      } catch {
        /* non-fatal */
      }
      return true
    },
    [lock, choosePerson],
  )

  const signOut = useCallback(() => {
    setUnlocked(false)
    try {
      sessionStorage.removeItem(UNLOCK_KEY)
    } catch {
      /* non-fatal */
    }
  }, [])

  const partner = useMemo(
    () => profiles.find((p) => p.id !== activeProfileId) ?? null,
    [profiles, activeProfileId],
  )
  const subject = useMemo(
    () => (activeProfileId ? subjectFor(profiles, activeProfileId, view) : null),
    [profiles, activeProfileId, view],
  )

  const value: SessionValue = {
    unlocked,
    needsSetup: !lock,
    view,
    setView,
    self: activeProfile,
    partner,
    subject,
    canEditNotes: view === 'self',
    choosePerson,
    signIn,
    signOut,
  }

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession(): SessionValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
