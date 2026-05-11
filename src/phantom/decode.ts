import { mergeChunkBits, bigIntTo44BitString, paddedBitStringToText } from '../codec/textBits'
import { lehmerDecodeChunk, type DurationTrack } from '../codec/lehmer'
import { getAllPlaylistTracks } from '../spotify/playlist'
import { parsePlaylistId } from './playlistId'

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export async function decodePlaylistInput(input: string): Promise<string> {
  const id = parsePlaylistId(input)
  if (!id) {
    throw new Error('Paste a full Spotify playlist URL, a spotify:playlist: URI, or a playlist ID.')
  }

  const rows = await getAllPlaylistTracks(id)
  const tracks: DurationTrack[] = rows.map((r) => ({ id: r.id, duration_ms: r.duration_ms }))

  if (tracks.length < 32 || tracks.length % 16 !== 0) {
    throw new Error("This doesn't look like a Phantom Tracks playlist.")
  }

  const groups = chunk(tracks, 16)
  const parts: string[] = []
  for (const g of groups) {
    const M = lehmerDecodeChunk(g, g)
    parts.push(bigIntTo44BitString(M))
  }
  const fullBits = mergeChunkBits(parts)
  return paddedBitStringToText(fullBits)
}
