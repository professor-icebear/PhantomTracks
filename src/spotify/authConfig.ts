export const SPOTIFY_AUTH = 'https://accounts.spotify.com/authorize'
export const SPOTIFY_TOKEN = 'https://accounts.spotify.com/api/token'

export const SCOPES = [
  /** Documented for `GET /v1/me` (Get Current User's Profile). */
  'user-read-private',
  'user-read-email',
  'playlist-modify-public',
  'playlist-modify-private',
  'playlist-read-private',
].join(' ')

export function getClientId(): string {
  const id = import.meta.env.VITE_SPOTIFY_CLIENT_ID
  if (!id) throw new Error('Missing VITE_SPOTIFY_CLIENT_ID in environment.')
  return id
}

export function getRedirectUri(): string {
  const u = import.meta.env.VITE_SPOTIFY_REDIRECT_URI
  if (!u) throw new Error('Missing VITE_SPOTIFY_REDIRECT_URI in environment.')
  return u
}
