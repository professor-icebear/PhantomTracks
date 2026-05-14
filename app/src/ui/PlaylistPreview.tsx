import { useState } from 'react'
import type { PlaylistDisplayTrack } from '../spotify/playlist'

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

function TrackCover({ url, label }: { url: string | null; label: string }) {
  const [broken, setBroken] = useState(false)
  if (!url || broken) {
    return (
      <div
        className="playlist-preview-cover playlist-preview-cover--placeholder"
        title={label}
        aria-hidden
      />
    )
  }
  return (
    <img
      className="playlist-preview-cover"
      src={url}
      alt=""
      loading="lazy"
      decoding="async"
      title={label}
      onError={() => setBroken(true)}
    />
  )
}

export type PlaylistPreviewProps = {
  title?: string
  subtitle?: string
  tracks: PlaylistDisplayTrack[] | null
  loading: boolean
  error: string | null
}

export function PlaylistPreview({ title, subtitle, tracks, loading, error }: PlaylistPreviewProps) {
  return (
    <div className="playlist-preview">
      <div className="playlist-preview-header">
        <p className="section-kicker playlist-preview-kicker">Listening order</p>
        {title ? <h2 className="playlist-preview-title">{title}</h2> : null}
        {subtitle ? <p className="playlist-preview-sub">{subtitle}</p> : null}
        {tracks !== null && !loading && !error ? (
          <p className="playlist-preview-meta">{tracks.length} tracks</p>
        ) : null}
      </div>

      {error ? <p className="playlist-preview-error">{error}</p> : null}

      {loading ? (
        <div className="playlist-preview-skeleton" aria-hidden>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="playlist-preview-skeleton-row">
              <span className="playlist-preview-skeleton-idx" />
              <span className="playlist-preview-skeleton-art" />
              <span className="playlist-preview-skeleton-line" />
            </div>
          ))}
        </div>
      ) : null}

      {!loading && tracks && tracks.length > 0 ? (
        <ul className="playlist-preview-list">
          {tracks.map((t, i) => (
            <li key={`${t.id}-${i}`} className="playlist-preview-row">
              <span className="playlist-preview-idx">{i + 1}</span>
              <TrackCover url={t.coverUrl} label={t.name} />
              <div className="playlist-preview-main">
                <span className="playlist-preview-name">{t.name}</span>
                <span className="playlist-preview-artist">{t.artistLine}</span>
              </div>
              <span className="playlist-preview-dur">{formatDuration(t.durationMs)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {!loading && tracks && tracks.length === 0 && !error ? (
        <p className="playlist-preview-empty">No tracks returned for preview.</p>
      ) : null}
    </div>
  )
}
