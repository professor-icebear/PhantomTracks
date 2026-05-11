type User = { display_name: string | null }

type ModeSelectProps = {
  user: User
  onSend: () => void
  onRead: () => void
  onDisconnect: () => void
}

export function ModeSelect({ user, onSend, onRead, onDisconnect }: ModeSelectProps) {
  const name = user.display_name ?? 'Listener'
  return (
    <div className="screen mode-select">
      <header className="screen-header">
        <span className="section-kicker">Signed in</span>
        <button type="button" className="link-btn" onClick={onDisconnect}>
          Sign out
        </button>
      </header>
      <p className="user-pill">{name}</p>
      <h1 className="title-serif">What would you like to do?</h1>
      <div className="mode-cards">
        <button type="button" className="mode-card" onClick={onSend}>
          <span className="mode-card-k">Send</span>
          <span className="mode-card-d">Hide a message in a new playlist.</span>
        </button>
        <button type="button" className="mode-card" onClick={onRead}>
          <span className="mode-card-k">Read</span>
          <span className="mode-card-d">Paste a playlist link and reveal the message.</span>
        </button>
      </div>
    </div>
  )
}
