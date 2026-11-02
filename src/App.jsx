import { useEffect, useState } from 'react'
import { api, user as getUser } from './api.js'
import Login from './pages/Login.jsx'
import Mood from './pages/Mood.jsx'
import Report from './pages/Report.jsx'
import Tasks from './pages/Tasks.jsx'
import Guides from './pages/Guides.jsx'
import ActivityPopup from './components/ActivityPopup.jsx'
const NAV = [['mood', 'mood', 'Today'], ['week', 'show_chart', 'Weekly'], ['month', 'calendar_month', 'Monthly'], ['tasks', 'self_improvement', 'Tasks'], ['guides', 'auto_awesome', 'Guides']]
export default function App() {
  const [u, setU] = useState(getUser()), [tab, setTab] = useState('mood'), [today, setToday] = useState(undefined), [act, setAct] = useState(null), [tick, setTick] = useState(0)
  const loadToday = () => api('mood/today').then(setToday)
  useEffect(() => { if (u) loadToday() }, [u])
  useEffect(() => { // reminder poll (swap for push notifications in production)
    if (!u) return; const p = async () => { if (act) return; const a = await api('notify'); if (a) setAct({ ...a, notify: true }) }
    const t0 = setTimeout(p, 2000), t = setInterval(p, 15000); return () => { clearTimeout(t0); clearInterval(t) }
  }, [u, act])
  if (!u) return <Login onLogin={setU} />
  if (today === undefined) return null
  const locked = !today // mood must be submitted before anything else
  const page = locked || tab === 'mood' ? <Mood today={today} onDone={() => { loadToday(); setTab('week') }} /> : tab === 'week' ? <Report range="week" /> : tab === 'month' ? <Report range="month" /> : tab === 'tasks' ? <Tasks onStart={setAct} refresh={tick} /> : <Guides />
  return <div className="app"><aside className="side"><div className="logo">Sovastro</div>
    {NAV.map(([k, ic, l]) => <button key={k} className={'nav' + (tab === k || (locked && k === 'mood') ? ' on' : '')} disabled={locked && k !== 'mood'} onClick={() => setTab(k)}><span className="material-symbols-outlined">{ic}</span><small style={{ fontSize: 15 }}>{l}</small></button>)}
    <div className="grow" /><button className="nav" onClick={() => { localStorage.removeItem('sov_user'); setU(null) }}><span className="material-symbols-outlined">logout</span><small style={{ fontSize: 15 }}>Logout</small></button></aside>
    <main className="main">{page}</main>
    {act && <ActivityPopup act={act} onClose={() => { setAct(null); setTick(tick + 1) }} />}</div>
}
