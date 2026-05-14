import { useState, type FormEvent } from 'react'
import {
  ACCESS_REQUEST_MAILTO,
  submitAccessRequestEmail,
  type SubmitAccessRequestPayload,
} from '../accessRequest'

type AccessRequestFormProps = {
  /** Technical context included in the email to the maintainer only — not shown in the UI. */
  hint: string
  onBack: () => void
}

export function AccessRequestForm({ hint, onBack }: AccessRequestFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<'web3forms' | 'mailto' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setError(null)
    const n = name.trim()
    const em = email.trim()
    if (!n) {
      setError('Please enter your name.')
      return
    }
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setError('Please enter a valid Spotify account email.')
      return
    }
    setBusy(true)
    const payload: SubmitAccessRequestPayload = { name: n, email: em, note: note.trim(), hint }
    try {
      const r = await submitAccessRequestEmail(payload)
      if (r.ok === false) {
        setError(r.error)
      } else {
        setDone(r.mode)
      }
    } catch {
      setError('Something went wrong. Try again or use your email app.')
    } finally {
      setBusy(false)
    }
  }

  function onFormSubmit(e: FormEvent) {
    e.preventDefault()
    void handleSubmit()
  }

  if (done === 'web3forms') {
    return (
      <div className="screen connect-gate access-request-gate">
        <div className="nebula" aria-hidden />
        <div className="connect-gate-inner access-request-inner">
          <p className="connect-kicker">Request sent</p>
          <p className="connect-lead">
            Thanks — your request was sent. If your account can be added, you’ll hear back by email.
          </p>
          <button type="button" className="btn-ghost access-request-back" onClick={onBack}>
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  if (done === 'mailto') {
    return (
      <div className="screen connect-gate access-request-gate">
        <div className="nebula" aria-hidden />
        <div className="connect-gate-inner access-request-inner">
          <p className="connect-kicker">Email app</p>
          <p className="connect-lead">
            This project isn’t configured with a form API key, so your default mail app should have opened
            with a message addressed to <span className="access-request-mono">{ACCESS_REQUEST_MAILTO}</span>.
            Send that email to finish the request.
          </p>
          <button type="button" className="btn-ghost access-request-back" onClick={onBack}>
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen connect-gate access-request-gate">
      <div className="nebula" aria-hidden />
      <div className="connect-gate-inner access-request-inner">
        <header className="connect-brand">phantom tracks</header>
        <p className="connect-kicker">Request access</p>
        <p className="connect-lead">
          We couldn’t finish connecting your Spotify account to this app. Right now it’s only available to a
          small group of people.
        </p>
        <p className="connect-lead connect-lead-tight">
          If you’d like to use it, send your name and the email on your Spotify account below. Someone on the
          team will add you to the list of approved users as soon as possible.
        </p>

        <form className="access-request-form" onSubmit={onFormSubmit}>
          <label className="field access-request-field">
            <span className="field-label">Your name</span>
            <input
              className="input"
              type="text"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              required
            />
          </label>
          <label className="field access-request-field">
            <span className="field-label">Spotify account email</span>
            <input
              className="input"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={254}
              required
            />
          </label>
          <label className="field access-request-field">
            <span className="field-label">Optional message</span>
            <textarea
              className="input textarea access-request-textarea"
              name="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Anything that helps identify your Spotify account or why you need access."
            />
          </label>

          {error ? (
            <p className="access-request-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="access-request-actions">
            <button type="button" className="btn-ghost" disabled={busy} onClick={onBack}>
              Cancel
            </button>
            <button type="submit" className="btn-spotify" disabled={busy}>
              {busy ? 'Sending…' : 'Send request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
