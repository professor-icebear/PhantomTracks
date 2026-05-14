import { describe, expect, it } from 'vitest'
import { spotifyErrorMessage } from '../spotify/api'

function jsonResponse(obj: unknown, status = 400): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('spotifyErrorMessage', () => {
  it('reads nested error.message', async () => {
    const res = jsonResponse({ error: { message: 'Invalid limit' } }, 400)
    expect(await spotifyErrorMessage(res)).toBe('Invalid limit')
  })

  it('reads top-level string error', async () => {
    const res = jsonResponse({ error: 'bad_oauth' }, 401)
    expect(await spotifyErrorMessage(res)).toBe('bad_oauth')
  })

  it('reads top-level message', async () => {
    const res = jsonResponse({ message: 'Something went wrong' }, 500)
    expect(await spotifyErrorMessage(res)).toBe('Something went wrong')
  })

  it('falls back to trimmed non-JSON body', async () => {
    const res = new Response('plain error text', { status: 502 })
    expect(await spotifyErrorMessage(res)).toContain('plain error')
  })

  it('appends Premium hint for known subscription errors', async () => {
    const res = jsonResponse(
      { error: { message: 'Active Premium subscription required' } },
      403,
    )
    const msg = await spotifyErrorMessage(res)
    expect(msg).toContain('Premium')
    expect(msg).toContain('developer.spotify.com/dashboard')
  })

  it('appends User Management hint for not registered 403', async () => {
    const res = jsonResponse({ error: { message: 'User not registered in the Developer Dashboard' } }, 403)
    const msg = await spotifyErrorMessage(res)
    expect(msg).toContain('User Management')
  })
})
