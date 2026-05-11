type LandingProps = {
  onConnect: () => void
  connecting: boolean
}

/** First screen: usage only + Spotify connect (no marketing landing). */
export function Landing({ onConnect, connecting }: LandingProps) {
  return (
    <div className="screen connect-gate">
      <div className="nebula" aria-hidden />
      <div className="connect-gate-inner">
        <header className="connect-brand">phantom tracks</header>

        <p className="connect-kicker">Usage</p>
        <ol className="connect-list">
          <li>Connect the Spotify account that will create playlists or read a shared playlist.</li>
          <li>
            After signing in, choose <strong>Send</strong> to hide text in a new playlist, or{' '}
            <strong>Read</strong> to paste a playlist link and reveal the message.
          </li>
          <li>Do not reorder, add, or remove tracks in an encoded playlist or the message is lost.</li>
        </ol>

        <div className="connect-cta">
          <button type="button" className="btn-spotify btn-spotify-wide" disabled={connecting} onClick={onConnect}>
            {connecting ? 'Redirecting…' : 'Connect with Spotify'} <span aria-hidden>↗</span>
          </button>
        </div>

        <p className="connect-note">
          Spotify may require Premium on the Developer Dashboard owner for API access.
        </p>
      </div>
    </div>
  )
}
