function base64UrlEncode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomVerifier(): string {
  const arr = new Uint8Array(64)
  crypto.getRandomValues(arr)
  return base64UrlEncode(arr.buffer)
}

export async function sha256Base64Url(plain: string): Promise<string> {
  const data = new TextEncoder().encode(plain)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(hash)
}

const VERIFIER_KEY = 'phantomtracks_pkce_verifier'

export async function createVerifierAndChallenge(): Promise<{ verifier: string; challenge: string }> {
  const verifier = randomVerifier()
  const challenge = await sha256Base64Url(verifier)
  return { verifier, challenge }
}

export function storeCodeVerifier(verifier: string): void {
  sessionStorage.setItem(VERIFIER_KEY, verifier)
}

export function consumeCodeVerifier(): string | null {
  const v = sessionStorage.getItem(VERIFIER_KEY)
  if (v) sessionStorage.removeItem(VERIFIER_KEY)
  return v
}
