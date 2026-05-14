import { describe, expect, it } from 'vitest'
import { lehmerDecodeChunk, lehmerEncodeChunk, type DurationTrack } from '../codec/lehmer'

function pool16(): DurationTrack[] {
  return Array.from({ length: 16 }, (_, i) => ({
    id: `t-${String(i).padStart(2, '0')}`,
    duration_ms: 10_000 + i * 137,
  }))
}

describe('lehmerEncodeChunk / lehmerDecodeChunk', () => {
  it('round-trips M=0 (identity permutation)', () => {
    const pool = pool16()
    const M = 0n
    const order = lehmerEncodeChunk(M, pool)
    const chunk = order.map((id) => pool.find((p) => p.id === id)!)
    expect(lehmerDecodeChunk(chunk, pool)).toBe(M)
  })

  it('round-trips M = 2^43 - 1 (max 44-bit)', () => {
    const pool = pool16()
    const M = (1n << 43n) - 1n
    const order = lehmerEncodeChunk(M, pool)
    const chunk = order.map((id) => pool.find((p) => p.id === id)!)
    expect(lehmerDecodeChunk(chunk, pool)).toBe(M)
  })

  it('round-trips several arbitrary values', () => {
    const pool = pool16()
    const samples = [1n, 42n, 999_999n, 1234567890123n]
    for (const M of samples) {
      const order = lehmerEncodeChunk(M, pool)
      const chunk = order.map((id) => pool.find((p) => p.id === id)!)
      expect(lehmerDecodeChunk(chunk, pool)).toBe(M)
    }
  })

  it('breaks ties on duration_ms by id (stable ordering)', () => {
    const pool: DurationTrack[] = [
      { id: 'b', duration_ms: 100 },
      { id: 'a', duration_ms: 100 },
      ...Array.from({ length: 14 }, (_, i) => ({
        id: `x${i}`,
        duration_ms: 200 + i,
      })),
    ]
    const M = 1001n
    const order = lehmerEncodeChunk(M, pool)
    const chunk = order.map((id) => pool.find((p) => p.id === id)!)
    expect(lehmerDecodeChunk(chunk, pool)).toBe(M)
  })

  it('throws if pool size is not 16', () => {
    const pool = pool16().slice(0, 15)
    expect(() => lehmerEncodeChunk(0n, pool)).toThrow('exactly 16')
  })

  it('throws if chunk length is not 16', () => {
    const pool = pool16()
    expect(() => lehmerDecodeChunk(pool.slice(0, 8), pool)).toThrow('exactly 16')
  })

  it('throws when chunk references an id outside the pool', () => {
    const pool = pool16()
    const bad = [...pool]
    bad[0] = { id: 'unknown', duration_ms: 1 }
    expect(() => lehmerDecodeChunk(bad, pool)).toThrow('not found in pool')
  })
})
