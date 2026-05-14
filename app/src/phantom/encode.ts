import { validateMessage, textToPaddedBitString, splitInto44BitChunks, chunkBitsToBigInt } from '../codec/textBits'
import { lehmerEncodeChunk, type DurationTrack } from '../codec/lehmer'
import { buildPoolForChunk } from '../spotify/searchPools'
import { addPlaylistItems, createPlaylist } from '../spotify/playlist'

export type EncodeProgress =
  | { stage: 'fetching'; current: number; total: number }
  | { stage: 'encoding' }
  | { stage: 'writing'; current: number; total: number }

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export async function createEncodedPlaylist(
  message: string,
  genre: string,
  playlistName: string,
  onProgress: (p: EncodeProgress) => void,
  options?: { playlistDescriptionExtra?: string },
): Promise<{ url: string; name: string; id: string }> {
  const trimmed = message.trim()
  const v = validateMessage(trimmed)
  if (v) throw new Error(v)

  const bits = textToPaddedBitString(trimmed)
  const chunkStrings = splitInto44BitChunks(bits)
  const total = chunkStrings.length
  const pools: DurationTrack[][] = new Array(total)

  const concurrency = 4
  for (let i = 0; i < total; i += concurrency) {
    const slice = chunkStrings.slice(i, i + concurrency)
    const results = await Promise.all(
      slice.map((_, k) => buildPoolForChunk(genre, i + k)),
    )
    results.forEach((pool, k) => {
      pools[i + k] = pool
    })
    onProgress({ stage: 'fetching', current: Math.min(i + concurrency, total), total })
  }

  onProgress({ stage: 'encoding' })
  const trackIds: string[] = []
  for (let c = 0; c < total; c++) {
    const M = chunkBitsToBigInt(chunkStrings[c]!)
    const order = lehmerEncodeChunk(M, pools[c]!)
    trackIds.push(...order)
  }

  const pl = await createPlaylist(playlistName.trim() || 'Mix', options?.playlistDescriptionExtra)
  const batches = chunk(trackIds, 100)
  const batchCount = batches.length
  onProgress({ stage: 'writing', current: 0, total: batchCount })
  for (let b = 0; b < batchCount; b++) {
    await addPlaylistItems(pl.id, batches[b]!)
    onProgress({ stage: 'writing', current: b + 1, total: batchCount })
  }

  const url = pl.external_urls?.spotify ?? `https://open.spotify.com/playlist/${pl.id}`
  return { id: pl.id, name: pl.name, url }
}
