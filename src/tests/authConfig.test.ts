import { describe, expect, it, vi } from 'vitest'

describe('authConfig', () => {
  it('SCOPES includes playlist read/write and profile scopes', async () => {
    const { SCOPES } = await import('../spotify/authConfig')
    expect(SCOPES).toContain('playlist-modify-public')
    expect(SCOPES).toContain('playlist-read-private')
    expect(SCOPES).toContain('user-read-private')
  })

  it('getClientId and getRedirectUri read stubbed Vite env', async () => {
    vi.stubEnv('VITE_SPOTIFY_CLIENT_ID', 'test-client')
    vi.stubEnv('VITE_SPOTIFY_REDIRECT_URI', 'http://127.0.0.1:5173/callback')
    vi.resetModules()
    const { getClientId, getRedirectUri } = await import('../spotify/authConfig')
    try {
      expect(getClientId()).toBe('test-client')
      expect(getRedirectUri()).toBe('http://127.0.0.1:5173/callback')
    } finally {
      vi.unstubAllEnvs()
      vi.resetModules()
    }
  })
})
