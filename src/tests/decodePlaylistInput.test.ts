import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../spotify/playlist', () => ({
  getAllPlaylistTracks: vi.fn(),
}))

import { lehmerEncodeChunk, type DurationTrack } from '../codec/lehmer'
import { chunkBitsToBigInt, splitInto44BitChunks, textToPaddedBitString } from '../codec/textBits'
import { decodePlaylistInput } from '../phantom/decode'
import { getAllPlaylistTracks } from '../spotify/playlist'

const mockedGetTracks = vi.mocked(getAllPlaylistTracks)

/** 22-char Spotify-style id for parsePlaylistId */
const PLAYLIST_ID = 'abcdefghijabcdefghijab'

function makePool(chunkIndex: number): DurationTrack[] {
  return Array.from({ length: 16 }, (_, i) => ({
    id: `c${chunkIndex}-t${i}`,
    duration_ms: 5000 + chunkIndex * 50_000 + i * 131,
  }))
}

function rowsForChunk(chunkBits: string, pool: DurationTrack[]) {
  const M = chunkBitsToBigInt(chunkBits)
  const order = lehmerEncodeChunk(M, pool)
  return order.map((id) => ({ id, duration_ms: pool.find((t) => t.id === id)!.duration_ms }))
}

beforeEach(() => {
  mockedGetTracks.mockReset()
})

describe('decodePlaylistInput', () => {
  it('rejects input that is not a playlist URL, URI, or id', async () => {
    await expect(decodePlaylistInput('not-a-playlist')).rejects.toThrow('Paste a full Spotify playlist')
  })

  it('decodes a single-chunk Phantom Tracks playlist', async () => {
    const message = 'A'
    const bits = textToPaddedBitString(message)
    const chunks = splitInto44BitChunks(bits)
    expect(chunks).toHaveLength(1)
    const pool = makePool(0)
    mockedGetTracks.mockResolvedValue(rowsForChunk(chunks[0]!, pool))

    const out = await decodePlaylistInput(`https://open.spotify.com/playlist/${PLAYLIST_ID}`)
    expect(out).toBe(message)
    expect(mockedGetTracks).toHaveBeenCalledWith(PLAYLIST_ID)
  })

  it('decodes a multi-chunk message', async () => {
    const message = 'Hello'
    const bits = textToPaddedBitString(message)
    const chunks = splitInto44BitChunks(bits)
    expect(chunks.length).toBeGreaterThanOrEqual(2)

    const rows: { id: string; duration_ms: number }[] = []
    chunks.forEach((chunkBits, i) => {
      rows.push(...rowsForChunk(chunkBits, makePool(i)))
    })
    mockedGetTracks.mockResolvedValue(rows)

    await expect(decodePlaylistInput(`spotify:playlist:${PLAYLIST_ID}`)).resolves.toBe(message)
  })

  it('throws when track count is not a multiple of 16', async () => {
    mockedGetTracks.mockResolvedValue(
      Array.from({ length: 15 }, (_, i) => ({ id: `x${i}`, duration_ms: 1000 + i })),
    )
    await expect(decodePlaylistInput(PLAYLIST_ID)).rejects.toThrow("doesn't look like a Phantom Tracks")
  })
})
