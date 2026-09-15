import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True when both Supabase env vars are present — i.e. cloud sync is live. */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * The Supabase client, or null when env vars are missing. When null the app
 * runs in local demo mode (sample data, no sync) and shows a setup banner.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : null
