import { useEffect, useState } from 'react'
import { shouldOfferAccessRequestForApiMessage, isOAuthAccessDenied } from './accessRequest'
import { ensureAccessToken } from './spotify/api'
import { beginLogin, exchangeCodeForSessionOnce } from './spotify/authActions'
import { fetchCurrentUser, type CurrentUser } from './spotify/playlist'
import { clearSession, getRefreshToken, hydrateFromSession } from './spotify/tokens'
import { AccessRequestForm } from './ui/AccessRequestForm'
import { Landing } from './ui/Landing'
import { ModeSelect } from './ui/ModeSelect'
import { ReadFlow } from './ui/ReadFlow'
import { SendFlow } from './ui/SendFlow'

type Screen = 'landing' | 'mode' | 'send' | 'read'

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [authBanner, setAuthBanner] = useState<string | null>(null)
  const [accessRequestHint, setAccessRequestHint] = useState<string | null>(null)
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
        history.replaceState({}, '', window.location.pathname)
        if (!cancelled) {
          if (isOAuthAccessDenied(oauthErr)) {
            setAccessRequestHint(null)
            setAuthBanner(
              'Spotify sign-in was cancelled. Tap Connect again when you are ready to approve access.',
            )
          } else {
            setAccessRequestHint(null)
            setAuthBanner(
              desc ?? 'Spotify returned an error during sign-in. Check the Developer Dashboard redirect URI and try again.',
            )
          }
        }
        return
      }

      const code = params.get('code')
      if (code) {
        try {
          await exchangeCodeForSessionOnce(code)
        } catch (e) {
          if (!cancelled) {
            const msg = e instanceof Error ? e.message : 'Sign-in failed.'
            setAccessRequestHint(null)
            setAuthBanner(msg)
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
            const msg = e instanceof Error ? e.message : 'Unknown error'
            clearSession()
            if (shouldOfferAccessRequestForApiMessage(msg)) {
              setAuthBanner(null)
              setAccessRequestHint(msg)
            } else {
              setAccessRequestHint(null)
              setAuthBanner(msg)
            }
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
      } catch (e) {
        const msg = e instanceof Error ? e.message : ''
        clearSession()
        if (!cancelled && shouldOfferAccessRequestForApiMessage(msg)) {
          setAuthBanner(null)
          setAccessRequestHint(msg)
        }
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [])

  async function onConnect() {
    setAuthBanner(null)
    setAccessRequestHint(null)
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

  function onAccessRequestBack() {
    setAccessRequestHint(null)
    setAuthBanner(null)
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

      {accessRequestHint ? (
        <AccessRequestForm hint={accessRequestHint} onBack={onAccessRequestBack} />
      ) : screen === 'landing' ? (
        <Landing onConnect={onConnect} connecting={connectBusy} />
      ) : null}

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
