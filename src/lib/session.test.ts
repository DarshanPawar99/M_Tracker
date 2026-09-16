import { describe, expect, it } from 'vitest'
import type { Profile } from '../types'
import {
  createLock,
  partnerOf,
  subjectFor,
  trackedProfile,
  verifyPassphrase,
} from './session'

const base = {
  color: '#000',
  default_cycle_length: 28,
  default_period_length: 5,
  luteal_length: 14,
  created_at: '2026-01-01T00:00:00Z',
}
const aria: Profile = { id: 'aria', name: 'Aria', role: 'tracked', ...base }
const sam: Profile = { id: 'sam', name: 'Sam', role: 'partner', ...base }
const profiles = [aria, sam]

describe('partner / subject selection', () => {
  it('partnerOf returns the other person', () => {
    expect(partnerOf(profiles, 'aria')).toBe(sam)
    expect(partnerOf(profiles, 'sam')).toBe(aria)
  })

  it('self view shows the signed-in person', () => {
    expect(subjectFor(profiles, 'aria', 'self')).toBe(aria)
  })

  it('partner view shows the other person', () => {
    expect(subjectFor(profiles, 'aria', 'partner')).toBe(sam)
  })

  it('partner view falls back to self when alone', () => {
    expect(subjectFor([aria], 'aria', 'partner')).toBe(aria)
  })
})

describe('tracked person (role, not order)', () => {
  it('finds the tracked profile regardless of array order', () => {
    expect(trackedProfile(profiles)).toBe(aria)
    expect(trackedProfile([sam, aria])).toBe(aria) // reversed order, same answer
  })

  it('falls back to the first profile for legacy rows without a role', () => {
    const a = { ...aria, role: undefined }
    const s = { ...sam, role: undefined }
    expect(trackedProfile([a, s])).toBe(a)
  })
})

describe('passphrase lock', () => {
  it('verifies the correct passphrase and rejects a wrong one', async () => {
    const lock = await createLock('hunter2')
    expect(await verifyPassphrase('hunter2', lock)).toBe(true)
    expect(await verifyPassphrase('nope', lock)).toBe(false)
  })

  it('salts so the same passphrase yields different hashes', async () => {
    const a = await createLock('same')
    const b = await createLock('same')
    expect(a.hash).not.toBe(b.hash)
    // …yet each still verifies its own passphrase.
    expect(await verifyPassphrase('same', a)).toBe(true)
    expect(await verifyPassphrase('same', b)).toBe(true)
  })
})
