// Central data store: profiles + cycles for both people, with cloud sync
// (Supabase) or a local demo mode. One provider so realtime updates and the
// active-profile selection live in a single place.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Cycle, Profile } from './types'
import { supabase, isSupabaseConfigured } from './lib/supabaseClient'
import { DEMO_CYCLES, DEMO_PROFILES } from './lib/demoData'

type Mode = 'cloud' | 'demo'

const DEMO_KEY = 'm_tracker_demo_v1'

interface StoreValue {
  mode: Mode
  loading: boolean
  error: string | null
  profiles: Profile[]
  cycles: Cycle[] // cycles for ALL profiles; filter by active where needed
  activeProfileId: string | null
  setActiveProfileId: (id: string) => void
  activeProfile: Profile | null
  cyclesFor: (profileId: string) => Cycle[]
  addCycle: (input: NewCycle) => Promise<void>
  updateCycle: (id: string, patch: Partial<Cycle>) => Promise<void>
  deleteCycle: (id: string) => Promise<void>
  updateProfile: (id: string, patch: Partial<Profile>) => Promise<void>
}

export interface NewCycle {
  profile_id: string
  start_date: string
  end_date: string | null
  note?: string | null
}

const StoreContext = createContext<StoreValue | null>(null)

function loadDemo(): { profiles: Profile[]; cycles: Cycle[] } {
  try {
    const raw = localStorage.getItem(DEMO_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore corrupt storage */
  }
  return { profiles: DEMO_PROFILES, cycles: DEMO_CYCLES }
}

function saveDemo(profiles: Profile[], cycles: Cycle[]) {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify({ profiles, cycles }))
  } catch {
    /* storage may be unavailable (private mode) — non-fatal */
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const mode: Mode = isSupabaseConfigured ? 'cloud' : 'demo'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null)

  // Initial load.
  useEffect(() => {
    let cancelled = false

    async function init() {
      if (mode === 'demo') {
        const { profiles: p, cycles: c } = loadDemo()
        if (cancelled) return
        setProfiles(p)
        setCycles(c)
        setActiveProfileId(p[0]?.id ?? null)
        setLoading(false)
        return
      }

      try {
        const [{ data: p, error: pe }, { data: c, error: ce }] =
          await Promise.all([
            supabase!.from('profiles').select('*').order('created_at'),
            supabase!.from('cycles').select('*').order('start_date'),
          ])
        if (pe) throw pe
        if (ce) throw ce
        if (cancelled) return
        setProfiles((p ?? []) as Profile[])
        setCycles((c ?? []) as Cycle[])
        setActiveProfileId((p?.[0]?.id as string) ?? null)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [mode])

  // Realtime sync (cloud only): refetch cycles on any change.
  useEffect(() => {
    if (mode !== 'cloud' || !supabase) return
    const channel = supabase
      .channel('cycles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cycles' },
        async () => {
          const { data } = await supabase!
            .from('cycles')
            .select('*')
            .order('start_date')
          if (data) setCycles(data as Cycle[])
        },
      )
      .subscribe()
    return () => {
      supabase!.removeChannel(channel)
    }
  }, [mode])

  const persistDemo = useCallback(
    (nextProfiles: Profile[], nextCycles: Cycle[]) => {
      saveDemo(nextProfiles, nextCycles)
    },
    [],
  )

  const addCycle = useCallback(
    async (input: NewCycle) => {
      const row: Cycle = {
        id:
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `local-${Date.now()}`,
        profile_id: input.profile_id,
        start_date: input.start_date,
        end_date: input.end_date,
        note: input.note ?? null,
        created_at: new Date().toISOString(),
      }
      if (mode === 'demo') {
        setCycles((prev) => {
          const next = [...prev, row]
          persistDemo(profiles, next)
          return next
        })
        return
      }
      const { data, error: e } = await supabase!
        .from('cycles')
        .insert({
          profile_id: input.profile_id,
          start_date: input.start_date,
          end_date: input.end_date,
          note: input.note ?? null,
        })
        .select()
        .single()
      if (e) throw e
      setCycles((prev) => [...prev, data as Cycle])
    },
    [mode, profiles, persistDemo],
  )

  const updateCycle = useCallback(
    async (id: string, patch: Partial<Cycle>) => {
      if (mode === 'demo') {
        setCycles((prev) => {
          const next = prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
          persistDemo(profiles, next)
          return next
        })
        return
      }
      const { error: e } = await supabase!.from('cycles').update(patch).eq('id', id)
      if (e) throw e
      setCycles((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
    },
    [mode, profiles, persistDemo],
  )

  const deleteCycle = useCallback(
    async (id: string) => {
      if (mode === 'demo') {
        setCycles((prev) => {
          const next = prev.filter((c) => c.id !== id)
          persistDemo(profiles, next)
          return next
        })
        return
      }
      const { error: e } = await supabase!.from('cycles').delete().eq('id', id)
      if (e) throw e
      setCycles((prev) => prev.filter((c) => c.id !== id))
    },
    [mode, profiles, persistDemo],
  )

  const updateProfile = useCallback(
    async (id: string, patch: Partial<Profile>) => {
      if (mode === 'demo') {
        setProfiles((prev) => {
          const next = prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
          persistDemo(next, cycles)
          return next
        })
        return
      }
      const { error: e } = await supabase!
        .from('profiles')
        .update(patch)
        .eq('id', id)
      if (e) throw e
      setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    },
    [mode, cycles, persistDemo],
  )

  const cyclesFor = useCallback(
    (profileId: string) => cycles.filter((c) => c.profile_id === profileId),
    [cycles],
  )

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) ?? null,
    [profiles, activeProfileId],
  )

  const value: StoreValue = {
    mode,
    loading,
    error,
    profiles,
    cycles,
    activeProfileId,
    setActiveProfileId,
    activeProfile,
    cyclesFor,
    addCycle,
    updateCycle,
    deleteCycle,
    updateProfile,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
