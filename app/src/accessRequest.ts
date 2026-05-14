/** Inbox for access requests when Web3Forms is not configured (mailto fallback). */
export const ACCESS_REQUEST_MAILTO = 'abdullahasim200528@gmail.com'

/** Spotify returned the user cancelled the consent screen — not an allowlist issue. */
export function isOAuthAccessDenied(error: string | null): boolean {
  return error === 'access_denied'
}

/**
 * True when failure is plausibly “not on User Management” / dev-mode API denial.
 * Avoids treating Premium-on-owner or user-cancelled flows as access requests.
 */
export function shouldOfferAccessRequestForApiMessage(message: string): boolean {
  const m = message.toLowerCase()
  if (m.includes('owner of the app') && m.includes('premium')) return false
  if (m.includes('active premium subscription required')) return false
  if (m.includes('pkce verifier missing')) return false
  if (m.includes('invalid_grant')) return false
  if (m.includes('not registered')) return true
  if (m.includes('user not registered')) return true
  if (m.includes('user management')) return true
  if (m.includes('development mode')) return true
  if (m.includes('common cause:') && m.includes('user management')) return true
  if (m.includes('spotify api error (403)')) return true
  return false
}

export type SubmitAccessRequestPayload = {
  name: string
  email: string
  note: string
  hint: string
}

export type SubmitAccessRequestResult =
  | { ok: true; mode: 'web3forms' | 'mailto' }
  | { ok: false; error: string }

function buildMessageBody(payload: SubmitAccessRequestPayload): string {
  const lines = [
    'Access request for Phantom Tracks (Spotify Developer Dashboard — User Management / dev mode).',
    '',
    `Name: ${payload.name.trim()}`,
    `Spotify account email: ${payload.email.trim()}`,
    '',
    'Technical context from the app:',
    payload.hint.trim(),
  ]
  if (payload.note.trim()) {
    lines.push('', 'Optional message from applicant:', payload.note.trim())
  }
  return lines.join('\n')
}

/**
 * Sends the request via Web3Forms when `VITE_WEB3FORMS_ACCESS_KEY` is set; otherwise opens a
 * prefilled mailto to {@link ACCESS_REQUEST_MAILTO}.
 */
export async function submitAccessRequestEmail(
  payload: SubmitAccessRequestPayload,
): Promise<SubmitAccessRequestResult> {
  const body = buildMessageBody(payload)
  const key = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY?.trim()

  if (key) {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: key,
        subject: '[Phantom Tracks] Permission request — Spotify dev allowlist',
        name: payload.name.trim(),
        email: payload.email.trim(),
        replyto: payload.email.trim(),
        message: body,
      }),
    })
    let json: { success?: boolean; message?: string } | null = null
    try {
      json = (await res.json()) as { success?: boolean; message?: string }
    } catch {
      json = null
    }
    if (!res.ok || !json?.success) {
      const err =
        typeof json?.message === 'string' && json.message.trim()
          ? json.message.trim()
          : `Send failed (${res.status}). Check the Web3Forms access key or try the email option below.`
      return { ok: false, error: err }
    }
    return { ok: true, mode: 'web3forms' }
  }

  const subject = encodeURIComponent('[Phantom Tracks] Permission request — Spotify dev allowlist')
  const maxBody = 1800
  const clipped = body.length > maxBody ? `${body.slice(0, maxBody)}\n…(truncated)` : body
  const mailtoUrl = `mailto:${ACCESS_REQUEST_MAILTO}?subject=${subject}&body=${encodeURIComponent(clipped)}`
  window.location.href = mailtoUrl
  return { ok: true, mode: 'mailto' }
}
