/** Parse Spotify playlist id from URL, URI, or raw id. */
export function parsePlaylistId(input: string): string | null {
  const s = input.trim()
  const fromUrl = s.match(/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/)
  if (fromUrl) return fromUrl[1] ?? null
  const fromUri = s.match(/^spotify:playlist:([a-zA-Z0-9]+)$/)
  if (fromUri) return fromUri[1] ?? null
  if (/^[a-zA-Z0-9]{22}$/.test(s)) return s
  return null
}
