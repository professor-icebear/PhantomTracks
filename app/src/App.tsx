import { useEffect, useState } from 'react'
import { ensureAccessToken } from './spotify/api'
import { beginLogin, exchangeCodeForSessionOnce } from './spotify/authActions'
import { fetchCurrentUser, type CurrentUser } from './spotify/playlist'
import { clearSession, getRefreshToken, hydrateFromSession } from './spotify/tokens'
import { Landing } from './ui/Landing'
import { ModeSelect } from './ui/ModeSelect'
import { ReadFlow } from './ui/ReadFlow'
import { SendFlow } from './ui/SendFlow'

type Screen = 'landing' | 'mode' | 'send' | 'read'

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [authBanner, setAuthBanner] = useState<string | null>(null)
  const [connectBusy, setConnectBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function boot() {
      const params = new URLSearchParams(window.location.search)
      const oauthErr = params.get('error')
      if (oauthErr) {
        const raw = params.get('error_description')
        let desc: string | undefined
        if (raw) {
          try {
            desc = decodeURIComponent(raw.replace(/\+/g, ' '))
          } catch {
            desc = raw
          }
        }
        setAuthBanner(
          desc ?? 'Spotify denied access. Phantom Tracks needs playlist permission to work.',
        )
        history.replaceState({}, '', window.location.pathname)
        return
      }

      const code = params.get('code')
      if (code) {
        try {
          await exchangeCodeForSessionOnce(code)
        } catch (e) {
          if (!cancelled) {
            setAuthBanner(e instanceof Error ? e.message : 'Sign-in failed.')
          }
          history.replaceState({}, '', window.location.pathname)
          return
        }
        history.replaceState({}, '', window.location.pathname)
        try {
          const me = await fetchCurrentUser()
          if (!cancelled) {
            setUser(me)
            setScreen('mode')
          }
        } catch (e) {
          if (!cancelled) {
            setAuthBanner(e instanceof Error ? e.message : 'Unknown error')
          }
        }
        return
      }

      hydrateFromSession()
      if (!getRefreshToken()) return
      try {
        await ensureAccessToken()
        const me = await fetchCurrentUser()
        if (!cancelled) {
          setUser(me)
          setScreen('mode')
        }
      } catch {
        clearSession()
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [])

  async function onConnect() {
    setAuthBanner(null)
    setConnectBusy(true)
    try {
      await beginLogin()
    } catch (e) {
      setConnectBusy(false)
      setAuthBanner(e instanceof Error ? e.message : 'Could not start Spotify sign-in.')
    }
  }

  function onDisconnect() {
    clearSession()
    setUser(null)
    setScreen('landing')
  }

  return (
    <div className="app-shell">
      {authBanner ? (
        <div className="banner" role="alert">
          {authBanner}
          <button type="button" className="banner-dismiss" onClick={() => setAuthBanner(null)}>
            Dismiss
          </button>
        </div>
      ) : null}

      {screen === 'landing' ? <Landing onConnect={onConnect} connecting={connectBusy} /> : null}

      {screen === 'mode' && user ? (
        <ModeSelect
          user={user}
          onSend={() => setScreen('send')}
          onRead={() => setScreen('read')}
          onDisconnect={onDisconnect}
        />
      ) : null}

      {screen === 'send' ? <SendFlow onBack={() => setScreen('mode')} /> : null}
      {screen === 'read' ? <ReadFlow onBack={() => setScreen('mode')} /> : null}
    </div>
  )
}
