// Session helpers for the shared two-person account: which profile is "on the
// phone", whose cycle the screens show (self vs partner view), and the local
// device passphrase lock. Pure + explicit — this is the auth/session path, so
// it stays boring and well-tested (see session.test.ts).
import type { Profile } from '../types'

export type ViewMode = 'self' | 'partner'

/** The other profile in a two-person install (the partner of `selfId`). */
export function partnerOf(profiles: Profile[], selfId: string): Profile | null {
  return profiles.find((p) => p.id !== selfId) ?? null
}

/**
 * Whose cycle the screens display: the partner's in 'partner' (his) view, the
 * signed-in person's own in 'self' (her) view. Falls back to self when there is
 * no distinct partner (single-profile install).
 */
export function subjectFor(
  profiles: Profile[],
  selfId: string,
  view: ViewMode,
): Profile | null {
  const self = profiles.find((p) => p.id === selfId) ?? null
  if (view === 'partner') return partnerOf(profiles, selfId) ?? self
  return self
}

/** Stored lock record: a random salt + the hash of `salt:passphrase`. */
export interface LockRecord {
  salt: string
  hash: string
}

const encoder = new TextEncoder()

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Hash a passphrase with SHA-256 over `salt:passphrase`. This is a *local
 * device lock* — it gates opening the app on a shared phone, and deliberately
 * does not claim to protect the cloud data (the Supabase URL + anon key remain
 * the shared secret, per the README privacy model).
 */
export async function hashPassphrase(
  passphrase: string,
  salt: string,
): Promise<string> {
  const data = encoder.encode(`${salt}:${passphrase}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return toHex(digest)
}

/** A fresh random salt for a new lock. */
export function makeSalt(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return toHex(bytes.buffer)
}

/** Build the lock record to store when a couple first sets their passphrase. */
export async function createLock(passphrase: string): Promise<LockRecord> {
  const salt = makeSalt()
  return { salt, hash: await hashPassphrase(passphrase, salt) }
}

/** True when `passphrase` matches the stored lock. */
export async function verifyPassphrase(
  passphrase: string,
  lock: LockRecord,
): Promise<boolean> {
  const hash = await hashPassphrase(passphrase, lock.salt)
  return hash === lock.hash
}
