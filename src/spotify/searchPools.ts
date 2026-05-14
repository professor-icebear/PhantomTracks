import { spotifyJson } from './api'
import type { DurationTrack } from '../codec/lehmer'

/** `GET /v1/search` — OpenAPI documents `limit` maximum 10 (default 5). Higher values return "Invalid limit". */
const SEARCH_PAGE_LIMIT = 10

type SearchResponse = {
  tracks: {
    items: Array<{ id: string; duration_ms: number }>
  }
}

function dedupeByDuration(tracks: DurationTrack[]): DurationTrack[] {
  const map = new Map<number, DurationTrack>()
  for (const t of tracks) {
    if (!map.has(t.duration_ms)) map.set(t.duration_ms, t)
  }
  return [...map.values()]
}

/** Pick 16 tracks with distinct durations spread across the sorted duration range. */
export function pickSpread16(candidates: DurationTrack[]): DurationTrack[] {
  const sorted = [...candidates].sort(
    (a, b) => a.duration_ms - b.duration_ms || a.id.localeCompare(b.id),
  )
  const n = sorted.length
  if (n < 16) throw new Error('Not enough unique-duration tracks.')
  const usedDur = new Set<number>()
  const out: DurationTrack[] = []
  for (let k = 0; k < 16; k++) {
    let idx = Math.round((k / 15) * (n - 1))
    let guard = 0
    while (usedDur.has(sorted[idx]!.duration_ms) && guard < n) {
      idx = (idx + 1) % n
      guard++
    }
    const t = sorted[idx]!
    usedDur.add(t.duration_ms)
    out.push(t)
  }
  if (out.length < 16) {
    for (const t of sorted) {
      if (!usedDur.has(t.duration_ms)) {
        usedDur.add(t.duration_ms)
        out.push(t)
        if (out.length === 16) break
      }
    }
  }
  return out
}

async function searchGenrePage(genre: string, offset: number): Promise<DurationTrack[]> {
  const q = encodeURIComponent(`genre:${genre}`)
  const data = await spotifyJson<SearchResponse>(
    `/search?q=${q}&type=track&limit=${SEARCH_PAGE_LIMIT}&offset=${offset}`,
  )
  return data.tracks.items
    .filter((t) => t.id && typeof t.duration_ms === 'number')
    .map((t) => ({ id: t.id, duration_ms: t.duration_ms }))
}

/**
 * Builds one 16-track pool for a chunk: unique durations, spread across the range.
 * `chunkIndex` biases search offset for variety across chunks.
 */
export async function buildPoolForChunk(genre: string, chunkIndex: number): Promise<DurationTrack[]> {
  const collected: DurationTrack[] = []
  // Steps of SEARCH_PAGE_LIMIT; stay within offset + limit <= 1000 (last offset 990).
  let offset = ((chunkIndex * 73 + Math.floor(Math.random() * 40)) % 100) * SEARCH_PAGE_LIMIT
  for (let round = 0; round < 60; round++) {
    const page = await searchGenrePage(genre, offset)
    offset = (offset + SEARCH_PAGE_LIMIT) % 1000
    for (const t of page) {
      if (!collected.some((c) => c.duration_ms === t.duration_ms)) collected.push(t)
    }
    if (dedupeByDuration(collected).length >= 60) break
    if (page.length === 0 && round > 2) break
  }
  const unique = dedupeByDuration(collected)
  if (unique.length < 16) {
    throw new Error('Could not find enough distinct songs for this genre — try another.')
  }
  return pickSpread16(unique)
}
