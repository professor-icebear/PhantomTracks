import { describe, expect, it } from 'vitest'
import { pickSpread16 } from '../spotify/searchPools'
import type { DurationTrack } from '../codec/lehmer'

function ascendingPool(n: number): DurationTrack[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `id-${i}`,
    duration_ms: 1000 + i * 10,
  }))
}

describe('pickSpread16', () => {
  it('returns 16 tracks with distinct durations', () => {
    const candidates = ascendingPool(40)
    const picked = pickSpread16(candidates)
    expect(picked).toHaveLength(16)
    const durs = picked.map((t) => t.duration_ms)
    expect(new Set(durs).size).toBe(16)
  })

  it('throws when fewer than 16 unique-duration candidates', () => {
    const few = ascendingPool(10)
    expect(() => pickSpread16(few)).toThrow('Not enough unique-duration')
  })
})
