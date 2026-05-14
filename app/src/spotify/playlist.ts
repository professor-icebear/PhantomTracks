import { spotifyRequest, spotifyJson, spotifyErrorMessage } from './api'

/** Default playlist description when the user leaves the description field empty. */
export const PLAYLIST_DESCRIPTION_FIXED =
  '🔐 Phantom Tracks — do not reorder, add, or remove tracks or the hidden message is lost.'

/** Spotify playlist `description` hard limit (UTF-8 bytes) in practice — see Web API create playlist. */
export const PLAYLIST_DESCRIPTION_MAX_BYTES = 300

function truncateUtf8ToMaxBytes(s: string, maxBytes: number): string {
  const enc = new TextEncoder()
  if (enc.encode(s).length <= maxBytes) return s
  let lo = 0
  let hi = s.length
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    const slice = s.slice(0, mid)
    if (enc.encode(slice).length <= maxBytes) lo = mid
    else hi = mid - 1
  }
  return s.slice(0, lo)
}

/**
 * Empty or whitespace-only input → default Phantom Tracks copy.
 * Otherwise → exactly the user’s text (UTF-8–truncated to {@link PLAYLIST_DESCRIPTION_MAX_BYTES}).
 */
export function resolvePlaylistDescription(userInput: string): string {
  const t = userInput.trim()
  if (!t) return truncateUtf8ToMaxBytes(PLAYLIST_DESCRIPTION_FIXED, PLAYLIST_DESCRIPTION_MAX_BYTES)
  return truncateUtf8ToMaxBytes(t, PLAYLIST_DESCRIPTION_MAX_BYTES)
}

type MePlaylistResponse = {
  id: string
  name: string
  external_urls: { spotify: string }
}

export async function createPlaylist(name: string, descriptionExtra?: string): Promise<MePlaylistResponse> {
  const res = await spotifyRequest('/me/playlists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      public: true,
      description: resolvePlaylistDescription(descriptionExtra ?? ''),
    }),
  })
  if (!res.ok) {
    throw new Error((await readErr(res)) ?? `Create playlist failed (${res.status})`)
  }
  return res.json() as Promise<MePlaylistResponse>
}

async function readErr(res: Response): Promise<string | undefined> {
  try {
    const j = (await res.json()) as { error?: { message?: string } }
    return j.error?.message
  } catch {
    return undefined
  }
}

/** POST /playlists/{id}/items — max 100 URIs per request; call sequentially to preserve order. */
export async function addPlaylistItems(playlistId: string, trackIds: string[]): Promise<void> {
  if (trackIds.length === 0) return
  const uris = trackIds.map((id) => `spotify:track:${id}`)
  const res = await spotifyRequest(`/playlists/${playlistId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uris }),
  })
  if (!res.ok) {
    throw new Error((await readErr(res)) ?? `Add tracks failed (${res.status})`)
  }
}

/** OpenAPI `QueryLimit` for playlist item pages: maximum 50 (was 100 in older clients). */
const PLAYLIST_PAGE_LIMIT = 50

type TrackPage = {
  items?: Array<{ item?: Record<string, unknown> | null; track?: Record<string, unknown> | null }>
  next: string | null
  total?: number
}

type PlaylistTracksField = {
  tracks: TrackPage | null
}

function durationMsFromTrack(t: Record<string, unknown>): number | null {
  const d = t.duration_ms
  if (typeof d === 'number' && Number.isFinite(d)) return d
  if (typeof d === 'string' && d.trim() !== '') {
    const n = Number(d)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function pushTrackRows(
  out: Array<{ id: string; duration_ms: number }>,
  page: TrackPage,
): void {
  const rows = page.items ?? []
  for (const row of rows) {
    /** Spotify documents `item` on playlist rows; `track` is deprecated and may be omitted. */
    const t = row.item ?? row.track
    if (!t || typeof t !== 'object') continue
    /** Playlists from this app are tracks only; episodes would break chunk alignment. */
    if (typeof t.type === 'string' && t.type !== 'track') continue
    const id = t.id
    const ms = durationMsFromTrack(t)
    if (typeof id === 'string' && id.length > 0 && ms !== null) {
      out.push({ id, duration_ms: ms })
    }
  }
}

/** Without `market`, Spotify may treat catalog tracks as unavailable and return null items. */
const MARKET_FROM_TOKEN = 'market=from_token'

/** Request `item` (current) and fall back shapes; `track` alone can yield empty rows on newer API responses. */
const ITEM_FIELDS = encodeURIComponent('items(item(id,duration_ms),track(id,duration_ms)),total')

/**
 * Walk playlist pages using `offset` + `total` from the first page.
 * Do not rely on `next` alone: with a narrow `fields` filter Spotify often omits `next`, so only the first
 * page (~50 items) is fetched and longer playlists fail decode (track count not a multiple of 16).
 */
async function collectPlaylistTrackPages(
  firstPage: TrackPage,
  fetchPageAtOffset: (offset: number) => Promise<Response>,
): Promise<Array<{ id: string; duration_ms: number }>> {
  const out: Array<{ id: string; duration_ms: number }> = []
  let offset = 0
  let page: TrackPage | null = firstPage
  const total = firstPage.total

  while (page) {
    pushTrackRows(out, page)
    const n = (page.items ?? []).length
    if (n === 0) break
    offset += n
    if (typeof total === 'number' && offset >= total) break
    if (n < PLAYLIST_PAGE_LIMIT) break

    const res = await fetchPageAtOffset(offset)
    if (!res.ok) throw new Error(await spotifyErrorMessage(res))
    page = (await res.json()) as TrackPage
  }
  return out
}

async function collectFallbackPlaylistTracks(
  playlistId: string,
): Promise<Array<{ id: string; duration_ms: number }>> {
  const trackFields = encodeURIComponent('items(item(id,duration_ms),track(id,duration_ms)),total')
  const tracksPath = (o: number) =>
    `/playlists/${playlistId}/tracks?limit=${PLAYLIST_PAGE_LIMIT}&offset=${o}&fields=${trackFields}&${MARKET_FROM_TOKEN}`

  const t0 = await spotifyRequest(tracksPath(0))
  if (t0.ok) {
    const firstPage = (await t0.json()) as TrackPage
    return collectPlaylistTrackPages(firstPage, (offset) => spotifyRequest(tracksPath(offset)))
  }

  const tf = encodeURIComponent(
    'tracks.items(item(id,duration_ms),track(id,duration_ms)),tracks.next,tracks.total',
  )
  const metaRes = await spotifyRequest(`/playlists/${playlistId}?fields=${tf}&${MARKET_FROM_TOKEN}`)
  if (!metaRes.ok) throw new Error(await spotifyErrorMessage(metaRes))
  const body = (await metaRes.json()) as PlaylistTracksField
  const tracks = body.tracks
  if (!tracks?.items?.length) {
    throw new Error(
      'Spotify returned no tracks for this playlist. Open the playlist in Spotify and confirm it is public, then try again while signed into an account that is allowed on this app’s Developer Dashboard (User Management in Development mode).',
    )
  }

  const out: Array<{ id: string; duration_ms: number }> = []
  pushTrackRows(out, tracks)
  let next = tracks.next
  while (next) {
    const res = await spotifyRequest(next)
    if (!res.ok) throw new Error(await spotifyErrorMessage(res))
    const page = (await res.json()) as TrackPage
    pushTrackRows(out, page)
    next = page.next
  }

  return out
}

/**
 * Reads ordered tracks with durations for decoding.
 * Uses `GET /playlists/{id}/items` (non-deprecated; `limit` ≤ 50 per OpenAPI).
 * If the first `items` request is 403, tries deprecated `GET …/tracks` with offset paging, then `GET …playlist?fields=tracks…`.
 */
export async function getAllPlaylistTracks(playlistId: string): Promise<Array<{ id: string; duration_ms: number }>> {
  const itemsPath0 = `/playlists/${playlistId}/items?limit=${PLAYLIST_PAGE_LIMIT}&offset=0&fields=${ITEM_FIELDS}&${MARKET_FROM_TOKEN}`
  const firstRes = await spotifyRequest(itemsPath0)

  if (firstRes.status === 403) {
    return collectFallbackPlaylistTracks(playlistId)
  }
  if (!firstRes.ok) throw new Error(await spotifyErrorMessage(firstRes))

  const firstPage = (await firstRes.json()) as TrackPage
  return collectPlaylistTrackPages(firstPage, (offset) =>
    spotifyRequest(
      `/playlists/${playlistId}/items?limit=${PLAYLIST_PAGE_LIMIT}&offset=${offset}&fields=${ITEM_FIELDS}&${MARKET_FROM_TOKEN}`,
    ),
  )
}

export type PlaylistDisplayTrack = {
  id: string
  name: string
  artistLine: string
  durationMs: number
  /** Smallest album image URL from Spotify (list-friendly). */
  coverUrl: string | null
}

const DISPLAY_ITEM_FIELDS = encodeURIComponent(
  'items(item(id,type,name,duration_ms,artists(name),album(images(url))),track(id,type,name,duration_ms,artists(name),album(images(url)))),total',
)

function artistLineFromTrack(t: Record<string, unknown>): string {
  const artists = t.artists
  if (!Array.isArray(artists) || artists.length === 0) return 'Unknown artist'
  const names: string[] = []
  for (const a of artists) {
    if (a && typeof a === 'object' && typeof (a as { name?: string }).name === 'string') {
      names.push((a as { name: string }).name)
    }
  }
  return names.length > 0 ? names.join(', ') : 'Unknown artist'
}

/** Spotify returns album images largest-first; use the last URL as a light thumbnail. */
function coverUrlFromTrack(t: Record<string, unknown>): string | null {
  const album = t.album
  if (!album || typeof album !== 'object') return null
  const images = (album as { images?: unknown }).images
  if (!Array.isArray(images) || images.length === 0) return null
  const urls: string[] = []
  for (const im of images) {
    if (im && typeof im === 'object' && typeof (im as { url?: string }).url === 'string') {
      const u = (im as { url: string }).url.trim()
      if (u) urls.push(u)
    }
  }
  if (urls.length === 0) return null
  return urls[urls.length - 1] ?? urls[0] ?? null
}

function pushDisplayRows(out: PlaylistDisplayTrack[], page: TrackPage): void {
  const rows = page.items ?? []
  for (const row of rows) {
    const t = row.item ?? row.track
    if (!t || typeof t !== 'object') continue
    if (typeof t.type === 'string' && t.type !== 'track') continue
    const id = t.id
    const ms = durationMsFromTrack(t)
    const name = typeof t.name === 'string' && t.name.trim() ? t.name : 'Unknown track'
    if (typeof id !== 'string' || id.length === 0 || ms === null) continue
    out.push({
      id,
      name,
      artistLine: artistLineFromTrack(t),
      durationMs: ms,
      coverUrl: coverUrlFromTrack(t),
    })
  }
}

async function collectDisplayPagesLoop(
  firstPage: TrackPage,
  fetchPageAtOffset: (offset: number) => Promise<Response>,
): Promise<PlaylistDisplayTrack[]> {
  const out: PlaylistDisplayTrack[] = []
  let offset = 0
  let page: TrackPage | null = firstPage
  const total = firstPage.total

  while (page) {
    pushDisplayRows(out, page)
    const n = (page.items ?? []).length
    if (n === 0) break
    offset += n
    if (typeof total === 'number' && offset >= total) break
    if (n < PLAYLIST_PAGE_LIMIT) break

    const res = await fetchPageAtOffset(offset)
    if (!res.ok) throw new Error(await spotifyErrorMessage(res))
    page = (await res.json()) as TrackPage
  }
  return out
}

async function collectFallbackPlaylistDisplay(playlistId: string): Promise<PlaylistDisplayTrack[]> {
  const tracksPath = (o: number) =>
    `/playlists/${playlistId}/tracks?limit=${PLAYLIST_PAGE_LIMIT}&offset=${o}&fields=${DISPLAY_ITEM_FIELDS}&${MARKET_FROM_TOKEN}`

  const t0 = await spotifyRequest(tracksPath(0))
  if (t0.ok) {
    const firstPage = (await t0.json()) as TrackPage
    return collectDisplayPagesLoop(firstPage, (offset) => spotifyRequest(tracksPath(offset)))
  }

  const tf = encodeURIComponent(
    'tracks.items(item(id,type,name,duration_ms,artists(name),album(images(url))),track(id,type,name,duration_ms,artists(name),album(images(url)))),tracks.next,tracks.total',
  )
  const metaRes = await spotifyRequest(`/playlists/${playlistId}?fields=${tf}&${MARKET_FROM_TOKEN}`)
  if (!metaRes.ok) throw new Error(await spotifyErrorMessage(metaRes))
  const body = (await metaRes.json()) as PlaylistTracksField
  const tracks = body.tracks
  if (!tracks?.items?.length) {
    throw new Error(
      'Spotify returned no tracks for this playlist. Open the playlist in Spotify and confirm it is public, then try again while signed into an account that is allowed on this app’s Developer Dashboard (User Management in Development mode).',
    )
  }

  const out: PlaylistDisplayTrack[] = []
  pushDisplayRows(out, tracks)
  let next = tracks.next
  while (next) {
    const res = await spotifyRequest(next)
    if (!res.ok) throw new Error(await spotifyErrorMessage(res))
    const page = (await res.json()) as TrackPage
    pushDisplayRows(out, page)
    next = page.next
  }
  return out
}

/** Ordered track rows with title and artists for UI preview (same paging rules as decode fetch). */
export async function getPlaylistTracksForDisplay(playlistId: string): Promise<PlaylistDisplayTrack[]> {
  const path0 = `/playlists/${playlistId}/items?limit=${PLAYLIST_PAGE_LIMIT}&offset=0&fields=${DISPLAY_ITEM_FIELDS}&${MARKET_FROM_TOKEN}`
  const firstRes = await spotifyRequest(path0)

  if (firstRes.status === 403) {
    return collectFallbackPlaylistDisplay(playlistId)
  }
  if (!firstRes.ok) throw new Error(await spotifyErrorMessage(firstRes))

  const firstPage = (await firstRes.json()) as TrackPage
  return collectDisplayPagesLoop(firstPage, (offset) =>
    spotifyRequest(
      `/playlists/${playlistId}/items?limit=${PLAYLIST_PAGE_LIMIT}&offset=${offset}&fields=${DISPLAY_ITEM_FIELDS}&${MARKET_FROM_TOKEN}`,
    ),
  )
}

export type CurrentUser = {
  id: string
  display_name: string | null
}

export function fetchCurrentUser(): Promise<CurrentUser> {
  return spotifyJson<CurrentUser>('/me')
}
