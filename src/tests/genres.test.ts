import { describe, expect, it } from 'vitest'
import { GENRES } from '../genres'

describe('GENRES', () => {
  it('has entries with label and Spotify search token', () => {
    expect(GENRES.length).toBeGreaterThan(5)
    for (const g of GENRES) {
      expect(typeof g.label).toBe('string')
      expect(g.label.length).toBeGreaterThan(0)
      expect(typeof g.value).toBe('string')
      expect(g.value.length).toBeGreaterThan(0)
    }
  })

  it('uses hyphenated tokens where the Web API expects them', () => {
    const values = GENRES.map((g) => g.value)
    expect(values).toContain('hip-hop')
    expect(values).toContain('r-n-b')
  })
})
