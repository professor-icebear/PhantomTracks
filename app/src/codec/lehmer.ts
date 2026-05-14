import { LEHMER_FACTORIALS } from './factorials'

export type DurationTrack = {
  id: string
  duration_ms: number
}

function sortKey(a: DurationTrack, b: DurationTrack): number {
  const d = a.duration_ms - b.duration_ms
  if (d !== 0) return d
  return a.id.localeCompare(b.id)
}

/** Permutation of 16 track ids from 44-bit Lehmer code M using ascending-duration ranking. */
export function lehmerEncodeChunk(M: bigint, pool: DurationTrack[]): string[] {
  if (pool.length !== 16) throw new Error('Pool must have exactly 16 tracks.')
  const sorted = [...pool].sort(sortKey)
  const remaining = [...sorted]
  let m = M
  const order: string[] = []

  for (let i = 0; i < 16; i++) {
    const fac = LEHMER_FACTORIALS[i]
    const idx = Number(m / fac)
    m = m % fac
    if (idx < 0 || idx >= remaining.length) {
      throw new Error('Lehmer index out of range — invalid chunk value or pool.')
    }
    const [picked] = remaining.splice(idx, 1)
    order.push(picked.id)
  }

  return order
}

/** Recover 44-bit M from playlist order and the same 16 tracks (any order in input chunk). */
export function lehmerDecodeChunk(chunkInPlaylistOrder: DurationTrack[], pool: DurationTrack[]): bigint {
  if (chunkInPlaylistOrder.length !== 16 || pool.length !== 16) {
    throw new Error('Chunk must contain exactly 16 tracks.')
  }

  const sorted = [...pool].sort(sortKey)
  const remaining: DurationTrack[] = [...sorted]
  let M = 0n

  for (let pos = 0; pos < 16; pos++) {
    const track = chunkInPlaylistOrder[pos]
    const idx = remaining.findIndex((t) => t.id === track.id)
    if (idx === -1) {
      throw new Error('Track not found in pool — playlist may have been edited.')
    }
    M += BigInt(idx) * LEHMER_FACTORIALS[pos]
    remaining.splice(idx, 1)
  }

  return M
}
