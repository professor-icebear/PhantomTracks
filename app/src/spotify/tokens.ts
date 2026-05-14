const SK_REFRESH = 'phantomtracks_rt'
const SK_EXPIRES = 'phantomtracks_at_exp'

let accessToken: string | null = null
let refreshToken: string | null = null
/** Epoch ms when access token is considered expired (with skew). */
let accessExpiresAt = 0

export function setSessionFromAuthResponse(data: {
  access_token: string
  refresh_token: string
  expires_in: number
}): void {
  accessToken = data.access_token
  refreshToken = data.refresh_token
  accessExpiresAt = Date.now() + data.expires_in * 1000 - 30_000
  try {
    sessionStorage.setItem(SK_REFRESH, data.refresh_token)
    sessionStorage.setItem(SK_EXPIRES, String(accessExpiresAt))
  } catch {
    /* ignore quota / private mode */
  }
}

export function hydrateFromSession(): void {
  try {
    const rt = sessionStorage.getItem(SK_REFRESH)
    const exp = sessionStorage.getItem(SK_EXPIRES)
    if (rt) refreshToken = rt
    if (exp) accessExpiresAt = parseInt(exp, 10) || 0
  } catch {
    /* ignore */
  }
}

export function clearSession(): void {
  accessToken = null
  refreshToken = null
  accessExpiresAt = 0
  try {
    sessionStorage.removeItem(SK_REFRESH)
    sessionStorage.removeItem(SK_EXPIRES)
  } catch {
    /* ignore */
  }
}

export function setAccessTokenOnly(token: string, expiresIn: number): void {
  accessToken = token
  accessExpiresAt = Date.now() + expiresIn * 1000 - 30_000
  try {
    sessionStorage.setItem(SK_EXPIRES, String(accessExpiresAt))
  } catch {
    /* ignore */
  }
}

export function getRefreshToken(): string | null {
  return refreshToken ?? (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SK_REFRESH) : null)
}

export function getAccessToken(): string | null {
  return accessToken
}

export function accessTokenIsFresh(): boolean {
  return !!accessToken && Date.now() < accessExpiresAt
}

export function getAccessExpiresAt(): number {
  return accessExpiresAt
}
