import { describe, expect, it } from 'vitest'
import {
  consumeCodeVerifier,
  createVerifierAndChallenge,
  sha256Base64Url,
  storeCodeVerifier,
} from '../spotify/pkce'

describe('pkce', () => {
  it('sha256Base64Url matches known SHA-256("") base64url', async () => {
    expect(await sha256Base64Url('')).toBe('47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU')
  })

  it('createVerifierAndChallenge produces verifier whose SHA-256 is the challenge', async () => {
    const { verifier, challenge } = await createVerifierAndChallenge()
    expect(verifier.length).toBeGreaterThan(10)
    expect(await sha256Base64Url(verifier)).toBe(challenge)
  })

  it('storeCodeVerifier and consumeCodeVerifier round-trip once', () => {
    storeCodeVerifier('verifier-secret-xyz')
    expect(consumeCodeVerifier()).toBe('verifier-secret-xyz')
    expect(consumeCodeVerifier()).toBeNull()
  })
})
