import { refreshAccessToken } from './authActions'
import {
  accessTokenIsFresh,
  getAccessToken,
  hydrateFromSession,
  getRefreshToken,
} from './tokens'

const API = 'https://api.spotify.com/v1'

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/** Ensures a usable access token, refreshing when needed. */
export async function ensureAccessToken(): Promise<string> {
  hydrateFromSession()
  if (accessTokenIsFresh()) return getAccessToken()!

  if (getRefreshToken()) {
    await refreshAccessToken()
    const t = getAccessToken()
    if (t) return t
  }

  throw new Error('Not signed in — connect with Spotify.')
}

type WebApiErrorObject = { status?: number; message?: string; reason?: string }

function pickMessageFromJson(j: unknown): string | null {
  if (!j || typeof j !== 'object') return null
  const o = j as Record<string, unknown>

  if (typeof o.error === 'object' && o.error !== null) {
    const e = o.error as WebApiErrorObject
    if (typeof e.message === 'string' && e.message.trim()) return e.message.trim()
    if (typeof e.reason === 'string' && e.reason.trim()) return e.reason.trim()
  }
  if (typeof o.error === 'string' && o.error.trim()) return o.error.trim()
  if (typeof o.message === 'string' && o.message.trim()) return o.message.trim()
  return null
}

/** Reads response body as text first so we never drop Spotify’s message if JSON shape varies. */
async function parseSpotifyError(res: Response): Promise<string> {
  const status = res.status
  let raw = ''
  try {
    raw = await res.text()
  } catch {
    return `Spotify API error (${status})`
  }

  if (raw) {
    try {
      const msg = pickMessageFromJson(JSON.parse(raw) as unknown)
      if (msg) return appendSpotifyErrorHints(status, msg)
    } catch {
      const trimmed = raw.trim().slice(0, 400)
      if (trimmed) return appendSpotifyErrorHints(status, trimmed)
    }
  }

  return appendSpotifyErrorHints(status, `Spotify API error (${status})`)
}

function appendSpotifyErrorHints(status: number, message: string): string {
  const lower = message.toLowerCase()
  if (
    lower.includes('active premium subscription required') ||
    (lower.includes('premium subscription') && lower.includes('owner of the app'))
  ) {
    return `${message} — Spotify requires an active Premium plan on the Spotify account that owns this client id in the Developer Dashboard (https://developer.spotify.com/dashboard). It is not the same as “Manage apps” in your listening account. After you subscribe or your plan changes, Spotify says API access can lag for a few hours.`
  }
  if (status !== 403) return message
  const devHint =
    'While the app is in Development mode on https://developer.spotify.com/dashboard , open your app → User Management and add the Spotify account you sign in with (the dashboard owner is allowed automatically; everyone else must be listed).'
  if (
    lower.includes('not registered') ||
    lower.includes('developer dashboard') ||
    lower.includes('user not registered')
  ) {
    return `${message} — ${devHint}`
  }
  if (lower === 'spotify api error (403)') {
    return `${message} — Common cause: ${devHint}`
  }
  return message
}

/**
 * Spotify Web API request. Retries on 429 using Retry-After or exponential backoff.
 * Refreshes access token once on 401.
 */
export async function spotifyRequest(
  pathOrUrl: string,
  init: RequestInit = {},
  attempt = 0,
): Promise<Response> {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${API}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`

  const token = await ensureAccessToken()
  const headers = new Headers(init.headers ?? undefined)
  headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(url, {
    ...init,
    headers,
  })

  if (res.status === 401 && attempt === 0) {
    await refreshAccessToken()
    return spotifyRequest(pathOrUrl, init, 1)
  }

  if (res.status === 429 && attempt < 6) {
    const ra = res.headers.get('Retry-After')
    const fromHeader = ra ? parseInt(ra, 10) * 1000 : NaN
    const backoff = Number.isFinite(fromHeader)
      ? fromHeader
      : Math.min(60_000, 1000 * 2 ** attempt + Math.random() * 500)
    await sleep(backoff)
    return spotifyRequest(pathOrUrl, init, attempt + 1)
  }

  return res
}

export async function spotifyJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await spotifyRequest(path, init)
  if (!res.ok) {
    throw new Error(await parseSpotifyError(res))
  }
  return res.json() as Promise<T>
}
