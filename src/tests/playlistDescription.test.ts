import { describe, expect, it } from 'vitest'
import {
  PLAYLIST_DESCRIPTION_FIXED,
  PLAYLIST_DESCRIPTION_MAX_BYTES,
  resolvePlaylistDescription,
} from '../spotify/playlist'

describe('resolvePlaylistDescription', () => {
  it('returns default copy when input is empty or whitespace', () => {
    const expected = PLAYLIST_DESCRIPTION_FIXED
    expect(new TextEncoder().encode(expected).length).toBeLessThanOrEqual(PLAYLIST_DESCRIPTION_MAX_BYTES)
    expect(resolvePlaylistDescription('')).toBe(expected)
    expect(resolvePlaylistDescription('  \n')).toBe(expected)
  })

  it('returns user text exactly when non-empty', () => {
    expect(resolvePlaylistDescription('My note')).toBe('My note')
    expect(resolvePlaylistDescription('  trimmed  ')).toBe('trimmed')
  })

  it('truncates UTF-8 to PLAYLIST_DESCRIPTION_MAX_BYTES', () => {
    const long = 'é'.repeat(200)
    const out = resolvePlaylistDescription(long)
    expect(new TextEncoder().encode(out).length).toBeLessThanOrEqual(PLAYLIST_DESCRIPTION_MAX_BYTES)
    expect(out.length).toBeGreaterThan(0)
    expect(long.startsWith(out) || out.length < long.length).toBe(true)
  })

  it('default description fits within max bytes', () => {
    const d = resolvePlaylistDescription('')
    expect(new TextEncoder().encode(d).length).toBeLessThanOrEqual(PLAYLIST_DESCRIPTION_MAX_BYTES)
  })
})
