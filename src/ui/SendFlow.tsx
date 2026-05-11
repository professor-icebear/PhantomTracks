import { useMemo, useState } from 'react'
import { GENRES } from '../genres'
import { MAX_UTF8_BYTES, utf8ByteLength } from '../codec/textBits'
import { createEncodedPlaylist, type EncodeProgress } from '../phantom/encode'

type SendFlowProps = {
  onBack: () => void
}

function defaultPlaylistTitle(): string {
  const d = new Date()
  return `Evening sequence — ${d.toISOString().slice(0, 10)}`
}

export function SendFlow({ onBack }: SendFlowProps) {
  const [message, setMessage] = useState('')
  const [genre, setGenre] = useState(GENRES[0]!.value)
  const [playlistName, setPlaylistName] = useState(defaultPlaylistTitle)
  const [progress, setProgress] = useState<EncodeProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ url: string; name: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const bytes = useMemo(() => utf8ByteLength(message), [message])

  function onMessageChange(v: string) {
    const enc = new TextEncoder()
    let out = v
    while (enc.encode(out).length > MAX_UTF8_BYTES && out.length > 0) {
      out = out.slice(0, -1)
    }
    setMessage(out)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    setProgress({ stage: 'fetching', current: 0, total: 1 })
    try {
      const r = await createEncodedPlaylist(message, genre, playlistName, setProgress)
      setResult({ url: r.url, name: r.name })
      setProgress(null)
    } catch (err) {
      setProgress(null)
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const progressLabel =
    progress?.stage === 'fetching'
      ? `Finding songs (${progress.current}/${progress.total})`
      : progress?.stage === 'encoding'
        ? 'Arranging message'
        : progress?.stage === 'writing'
          ? `Creating playlist (${progress.current}/${progress.total})`
          : null

  return (
    <div className="screen flow">
      <header className="screen-header">
        <button type="button" className="link-btn" onClick={onBack}>
          ← Back
        </button>
      </header>

      {result ? (
        <div className="success-panel">
          <p className="section-kicker">Ready</p>
          <h2 className="title-serif sm">{result.name}</h2>
          <a className="playlist-link" href={result.url} target="_blank" rel="noreferrer">
            Open in Spotify ↗
          </a>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => void navigator.clipboard.writeText(result.url)}
          >
            Copy link
          </button>
        </div>
      ) : (
        <form className="send-form" onSubmit={(e) => void handleSubmit(e)}>
          <p className="section-kicker">Encode</p>
          <h1 className="title-serif sm">Hide a message in a playlist</h1>

          <label className="field">
            <span className="field-label">Message</span>
            <textarea
              className="input textarea"
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              rows={6}
              placeholder="Your message appears only after decoding here."
              maxLength={2000}
              required
            />
            <span className="field-hint">
              {bytes} / {MAX_UTF8_BYTES} UTF-8 bytes
            </span>
          </label>

          <label className="field">
            <span className="field-label">Genre seed</span>
            <select className="input select" value={genre} onChange={(e) => setGenre(e.target.value)}>
              {GENRES.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
            <span className="field-hint">Used to search for candidate tracks.</span>
          </label>

          <label className="field">
            <span className="field-label">Playlist name</span>
            <input
              className="input"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
            />
          </label>

          <p className="warn-copy">
            Do not reorder, add, or remove tracks after creation — the message lives in the exact order
            Spotify stores.
          </p>

          {error ? <p className="error-text">{error}</p> : null}

          {progressLabel ? (
            <div className="progress-block">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${progressPct(progress)}%`,
                  }}
                />
              </div>
              <p className="progress-label">{progressLabel}</p>
            </div>
          ) : null}

          <button type="submit" className="btn-spotify" disabled={busy || message.trim().length === 0}>
            {busy ? 'Working…' : 'Encode & create playlist'}
          </button>
        </form>
      )}
    </div>
  )
}

function progressPct(p: EncodeProgress | null): number {
  if (!p) return 0
  if (p.stage === 'fetching') return Math.min(33, (p.current / Math.max(1, p.total)) * 33)
  if (p.stage === 'encoding') return 50
  if (p.stage === 'writing') return 50 + (p.current / Math.max(1, p.total)) * 50
  return 0
}
