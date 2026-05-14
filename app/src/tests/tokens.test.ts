import { beforeEach, describe, expect, it } from 'vitest'
import {
  accessTokenIsFresh,
  clearSession,
  getAccessToken,
  getRefreshToken,
  hydrateFromSession,
  setSessionFromAuthResponse,
} from '../spotify/tokens'

beforeEach(() => {
  clearSession()
  sessionStorage.clear()
})

describe('tokens', () => {
  it('setSessionFromAuthResponse stores access in memory and refresh in sessionStorage', () => {
    setSessionFromAuthResponse({
      access_token: 'at-1',
      refresh_token: 'rt-1',
      expires_in: 3600,
    })
    expect(getAccessToken()).toBe('at-1')
    expect(getRefreshToken()).toBe('rt-1')
    expect(sessionStorage.getItem('phantomtracks_rt')).toBe('rt-1')
    expect(accessTokenIsFresh()).toBe(true)
  })

  it('hydrateFromSession reads refresh and expiry from sessionStorage', () => {
    sessionStorage.setItem('phantomtracks_rt', 'stored-rt')
    sessionStorage.setItem('phantomtracks_at_exp', String(Date.now() + 3_600_000))
    hydrateFromSession()
    expect(getRefreshToken()).toBe('stored-rt')
    expect(getAccessToken()).toBeNull()
  })

  it('clearSession removes tokens from memory and sessionStorage', () => {
    setSessionFromAuthResponse({
      access_token: 'at-3',
      refresh_token: 'rt-3',
      expires_in: 3600,
    })
    clearSession()
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
    expect(sessionStorage.getItem('phantomtracks_rt')).toBeNull()
  })
})
