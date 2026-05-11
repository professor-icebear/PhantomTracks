import { spotifyRequest, spotifyJson } from './api'

type MePlaylistResponse = {
  id: string
  name: string
  external_urls: { spotify: string }
}

export async function createPlaylist(name: string): Promise<MePlaylistResponse> {
  const res = await spotifyRequest('/me/playlists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      public: true,
      description:
        '🔐 Phantom Tracks — do not reorder, add, or remove tracks or the hidden message is lost.',
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

type Page = {
  items: Array<{ track: { id: string; duration_ms: number } | null }>
  next: string | null
}

export async function getAllPlaylistTracks(playlistId: string): Promise<Array<{ id: string; duration_ms: number }>> {
  const firstPath = `/playlists/${playlistId}/tracks?limit=100&fields=items(track(id,duration_ms)),next`
  const first = await spotifyJson<Page>(firstPath)
  const out: Array<{ id: string; duration_ms: number }> = []
  function pushItems(page: Page) {
    for (const row of page.items) {
      const t = row.track
      if (t?.id && typeof t.duration_ms === 'number') {
        out.push({ id: t.id, duration_ms: t.duration_ms })
      }
    }
  }
  pushItems(first)
  let next = first.next
  while (next) {
    const res = await spotifyRequest(next)
    if (!res.ok) throw new Error((await readErr(res)) ?? `Fetch playlist failed (${res.status})`)
    const page = (await res.json()) as Page
    pushItems(page)
    next = page.next
  }
  return out
}

export type CurrentUser = {
  id: string
  display_name: string | null
}

export function fetchCurrentUser(): Promise<CurrentUser> {
  return spotifyJson<CurrentUser>('/me')
}
