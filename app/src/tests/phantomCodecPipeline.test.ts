import { describe, expect, it } from 'vitest'
import { lehmerDecodeChunk, lehmerEncodeChunk, type DurationTrack } from '../codec/lehmer'
import {
  bigIntTo44BitString,
  chunkBitsToBigInt,
  mergeChunkBits,
  paddedBitStringToText,
  splitInto44BitChunks,
  textToPaddedBitString,
} from '../codec/textBits'

/** Full phantom pipeline without Spotify: text → bits → Lehmer orders → decode back. */
function poolForChunk(index: number): DurationTrack[] {
  return Array.from({ length: 16 }, (_, i) => ({
    id: `chunk${index}-id${i}`,
    duration_ms: 8000 + index * 40_000 + i * 113,
  }))
}

describe('phantom codec pipeline (offline)', () => {
  it('round-trips through Lehmer for arbitrary messages', () => {
    for (const message of ['x', 'Hello world', 'Line1\nLine2\tTab', 'a'.repeat(200)]) {
      const trimmed = message.trim()
      if (trimmed.length === 0) continue

      const bits = textToPaddedBitString(trimmed)
      const chunkStrings = splitInto44BitChunks(bits)
      const parts: string[] = []

      chunkStrings.forEach((chunkBits, c) => {
        const M = chunkBitsToBigInt(chunkBits)
        const pool = poolForChunk(c)
        const order = lehmerEncodeChunk(M, pool)
        const chunkTracks = order.map((id) => pool.find((p) => p.id === id)!)
        const M2 = lehmerDecodeChunk(chunkTracks, pool)
        parts.push(bigIntTo44BitString(M2))
      })

      expect(paddedBitStringToText(mergeChunkBits(parts))).toBe(trimmed)
    }
  })
})
