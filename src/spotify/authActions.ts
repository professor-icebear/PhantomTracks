import { SPOTIFY_AUTH, SPOTIFY_TOKEN, SCOPES, getClientId, getRedirectUri } from './authConfig'
import { createVerifierAndChallenge, storeCodeVerifier, consumeCodeVerifier } from './pkce'
import { setSessionFromAuthResponse, setAccessTokenOnly, getRefreshToken } from './tokens'

let exchangeInflight: Promise<void> | null = null
let exchangeInflightCode: string | null = null
/** Avoids a second token exchange with the same one-time code after the inflight promise settles. */
let exchangeCompletedForCode: string | null = null

export async function beginLogin(): Promise<void> {
  exchangeCompletedForCode = null
  const { verifier, challenge } = await createVerifierAndChallenge()
  storeCodeVerifier(verifier)
  const clientId = getClientId()
  const redirectUri = getRedirectUri()
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  })
  window.location.assign(`${SPOTIFY_AUTH}?${params.toString()}`)
}

/** Deduplicates concurrent exchange for the same auth code (e.g. React StrictMode remounts). */
export function exchangeCodeForSessionOnce(code: string): Promise<void> {
  if (exchangeCompletedForCode === code) return Promise.resolve()
  if (exchangeInflight && exchangeInflightCode === code) return exchangeInflight
  exchangeInflightCode = code
  exchangeInflight = exchangeCodeForSession(code)
    .then(() => {
      exchangeCompletedForCode = code
    })
    .finally(() => {
      exchangeInflight = null
      exchangeInflightCode = null
    })
  return exchangeInflight
}

async function exchangeCodeForSession(code: string): Promise<void> {
  const verifier = consumeCodeVerifier()
  if (!verifier) {
    throw new Error('PKCE verifier missing — try connecting again.')
  }
  const clientId = getClientId()
  const redirectUri = getRedirectUri()
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: verifier,
  })
  const tryOnce = () =>
    fetch(SPOTIFY_TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

  let res = await tryOnce()
  if (!res.ok) {
    res = await tryOnce()
  }
  if (!res.ok) {
    const err = await safeJson(res)
    throw new Error(err?.error_description ?? err?.error ?? `Token exchange failed (${res.status})`)
  }
  const data = (await res.json()) as {
    access_token: string
    refresh_token: string
    expires_in: number
  }
  setSessionFromAuthResponse(data)
}

async function safeJson(res: Response): Promise<{ error?: string; error_description?: string } | null> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export async function refreshAccessToken(): Promise<void> {
  const rt = getRefreshToken()
  if (!rt) throw new Error('No refresh token — connect with Spotify again.')
  const clientId = getClientId()
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: rt,
    client_id: clientId,
  })
  const res = await fetch(SPOTIFY_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) {
    const err = await safeJson(res)
    throw new Error(err?.error_description ?? err?.error ?? `Refresh failed (${res.status})`)
  }
  const data = (await res.json()) as {
    access_token: string
    expires_in: number
    refresh_token?: string
  }
  setAccessTokenOnly(data.access_token, data.expires_in)
  if (data.refresh_token) {
    setSessionFromAuthResponse({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    })
  }
}
