import { useEffect, useState } from 'react'
import { api, getUser, authApi } from './services/api.js'
import Login from './pages/Login.jsx'
import Mood from './pages/Mood.jsx'
import Report from './pages/Report.jsx'
import Tasks from './pages/Tasks.jsx'
import Guides from './pages/Guides.jsx'
import ActivityPopup from './components/ActivityPopup.jsx'

const NAV = [
  ['mood', 'mood', 'Today'],
  ['week', 'show_chart', 'Weekly'],
  ['month', 'calendar_month', 'Monthly'],
  ['tasks', 'self_improvement', 'Tasks'],
  ['guides', 'auto_awesome', 'Guides']
]

export default function App() {
  const [u, setU] = useState(getUser())
  const [tab, setTab] = useState('mood')
  const [today, setToday] = useState(undefined)
  const [act, setAct] = useState(null)
  const [tick, setTick] = useState(0)

  const loadToday = () => {
    api('mood/today')
      .then(setToday)
      .catch((err) => {
        if (err.status === 401) {
          authApi.logout()
          setU(null)
        }
        setToday(null)
      })
  }

  // Sync profile & load today mood when user is authenticated
  useEffect(() => {
    if (u) {
      loadToday()
      authApi.getMe().catch((err) => {
        if (err.status === 401) {
          authApi.logout()
          setU(null)
        }
      })
    }
  }, [u])

  // Reminder poll for astrologer healing tasks
  useEffect(() => {
    if (!u) return
    const pollReminders = async () => {
      if (act) return
      try {
        const a = await api('activities/notify')
        if (a) setAct({ ...a, notify: true })
      } catch (err) {
        // Silently ignore periodic poll errors
      }
    }
    const t0 = setTimeout(pollReminders, 2000)
    const t = setInterval(pollReminders, 15000)
    return () => {
      clearTimeout(t0)
      clearInterval(t)
    }
  }, [u, act])

  const handleLogout = () => {
    authApi.logout()
    setU(null)
    setToday(undefined)
  }

  if (!u) return <Login onLogin={setU} />
  if (today === undefined) return null

  const locked = !today // mood must be submitted before other tabs unlock
  const page =
    locked || tab === 'mood' ? (
      <Mood today={today} onDone={() => { loadToday(); setTab('week') }} />
    ) : tab === 'week' ? (
      <Report range="week" />
    ) : tab === 'month' ? (
      <Report range="month" />
    ) : tab === 'tasks' ? (
      <Tasks onStart={setAct} refresh={tick} />
    ) : (
      <Guides />
    )

  return (
    <div className="app">
      <aside className="side">
        <div className="logo">Sovastro</div>
        {NAV.map(([k, ic, l]) => (
          <button
            key={k}
            className={'nav' + (tab === k || (locked && k === 'mood') ? ' on' : '')}
            disabled={locked && k !== 'mood'}
            onClick={() => setTab(k)}
          >
            <span className="material-symbols-outlined">{ic}</span>
            <small style={{ fontSize: 15 }}>{l}</small>
          </button>
        ))}
        <div className="grow" />
        <button className="nav" onClick={handleLogout}>
          <span className="material-symbols-outlined">logout</span>
          <small style={{ fontSize: 15 }}>Logout</small>
        </button>
      </aside>
      <main className="main">{page}</main>
      {act && (
        <ActivityPopup
          act={act}
          onClose={() => {
            setAct(null)
            setTick(tick + 1)
          }}
        />
      )}
    </div>
  )
}
