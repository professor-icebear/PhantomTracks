import { useState } from 'react'
import { decodePlaylistInput } from '../phantom/decode'
import { parsePlaylistId } from '../phantom/playlistId'
import { getPlaylistTracksForDisplay, type PlaylistDisplayTrack } from '../spotify/playlist'
import { PlaylistPreview } from './PlaylistPreview'

type ReadFlowProps = {
  onBack: () => void
}

export function ReadFlow({ onBack }: ReadFlowProps) {
  const [input, setInput] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<'idle' | 'loading'>('idle')
  const [previewTracks, setPreviewTracks] = useState<PlaylistDisplayTrack[] | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  async function loadPlaylistPreview(playlistId: string) {
    setPreviewLoading(true)
    setPreviewError(null)
    setPreviewTracks(null)
    try {
      const rows = await getPlaylistTracksForDisplay(playlistId)
      setPreviewTracks(rows)
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Could not load track list.')
    } finally {
      setPreviewLoading(false)
    }
  }

  async function onDecode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setPreviewTracks(null)
    setPreviewError(null)
    setPreviewLoading(false)
    setPhase('loading')
    try {
      const text = await decodePlaylistInput(input)
      setMessage(text)
      const id = parsePlaylistId(input)
      if (id) void loadPlaylistPreview(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decode failed.')
    } finally {
      setPhase('idle')
    }
  }

  const showPreview = message !== null

  const formBlock = (
    <form className="send-form" onSubmit={(e) => void onDecode(e)}>
      <p className="section-kicker">Decode</p>
      <h1 className="title-serif sm">Read a hidden message</h1>

      <label className="field">
        <span className="field-label">Playlist URL or ID</span>
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://open.spotify.com/playlist/…"
          required
        />
      </label>

      {error ? <p className="error-text">{error}</p> : null}

      {message !== null ? (
        <div className="reveal-box">
          <p className="field-label">Message</p>
          <p className="reveal-text">{message}</p>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => void navigator.clipboard.writeText(message)}
          >
            Copy message
          </button>
        </div>
      ) : null}

      <p className="warn-copy">
        This hides a message in plain sight; it is not encryption. Anyone who knows to use this app on your
        playlist can read it.
      </p>

      <button type="submit" className="btn-spotify" disabled={phase === 'loading' || !input.trim()}>
        {phase === 'loading' ? 'Fetching & decoding…' : 'Decode'}
      </button>
    </form>
  )

  return (
    <div className={`screen flow${showPreview ? ' flow-with-preview' : ''}`}>
      <header className="screen-header">
        <button type="button" className="link-btn" onClick={onBack}>
          ← Back
        </button>
      </header>

      {showPreview ? (
        <div className="flow-split-inner">
          <div className="flow-primary">{formBlock}</div>
          <aside className="flow-preview" aria-label="Playlist track list">
            <PlaylistPreview
              subtitle="Stored order on Spotify — do not reorder."
              tracks={previewTracks}
              loading={previewLoading}
              error={previewError}
            />
          </aside>
        </div>
      ) : (
        formBlock
      )}
    </div>
  )
}
