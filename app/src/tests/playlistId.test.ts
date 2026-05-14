import { describe, expect, it } from 'vitest'
import { parsePlaylistId } from '../phantom/playlistId'

describe('parsePlaylistId', () => {
  it('parses open.spotify.com playlist URL', () => {
    expect(parsePlaylistId('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M')).toBe(
      '37i9dQZF1DXcBWIGoYBM5M',
    )
    expect(parsePlaylistId('  http://open.spotify.com/playlist/abcXYZ0123456789012ab  ')).toBe(
      'abcXYZ0123456789012ab',
    )
  })

  it('parses spotify:playlist: URI', () => {
    expect(parsePlaylistId('spotify:playlist:abcXYZ0123456789012ab')).toBe('abcXYZ0123456789012ab')
  })

  it('accepts raw 22-character id', () => {
    expect(parsePlaylistId('abcdefghijabcdefghijab')).toBe('abcdefghijabcdefghijab')
  })

  it('returns null for invalid input', () => {
    expect(parsePlaylistId('')).toBeNull()
    expect(parsePlaylistId('too-short')).toBeNull()
    expect(parsePlaylistId('https://example.com/playlist/abcXYZ0123456789012ab')).toBeNull()
    expect(parsePlaylistId('spotify:track:abcXYZ0123456789012ab')).toBeNull()
  })
})
