import { describe, expect, it } from 'vitest'
import {
  isOAuthAccessDenied,
  shouldOfferAccessRequestForApiMessage,
} from '../accessRequest'

describe('accessRequest', () => {
  it('isOAuthAccessDenied', () => {
    expect(isOAuthAccessDenied('access_denied')).toBe(true)
    expect(isOAuthAccessDenied(null)).toBe(false)
    expect(isOAuthAccessDenied('invalid_client')).toBe(false)
  })

  it('shouldOfferAccessRequestForApiMessage detects dev allowlist hints', () => {
    expect(
      shouldOfferAccessRequestForApiMessage(
        'User not registered in the Developer Dashboard — add them in User Management.',
      ),
    ).toBe(true)
    expect(
      shouldOfferAccessRequestForApiMessage(
        'Spotify API error (403) — Common cause: While the app is in Development mode… User Management…',
      ),
    ).toBe(true)
  })

  it('shouldOfferAccessRequestForApiMessage skips premium-on-owner', () => {
    expect(
      shouldOfferAccessRequestForApiMessage(
        'An active Premium subscription is required on the owner of the app account.',
      ),
    ).toBe(false)
  })
})
