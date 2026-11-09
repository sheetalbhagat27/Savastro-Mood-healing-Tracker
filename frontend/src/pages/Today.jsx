import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, MOODS } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
export default function Today() {
  const { user } = useAuth(), toast = useToast()
  const [saved, setSaved] = useState(undefined), [sel, setSel] = useState(null), [busy, setBusy] = useState(false)
  useEffect(() => { api('/moods/today').then(m => { setSaved(m); setSel(m?.mood || null) }).catch(() => setSaved(null)) }, [])
  const submit = async () => {
    setBusy(true)
    try { const m = await api('/moods', { method: 'POST', body: { mood: sel } }); setSaved(m); toast('Your mood has been saved') }
    catch (e) { toast(e.message, 'err') } finally { setBusy(false) }
  }
  if (saved === undefined) return <p className="sub">Loading…</p>
  return (
    <div className="center">
      <h1>How are you feeling today, {user.name.split(' ')[0]}?</h1>
      <p className="sub">Pick one and save. You can change it within 2 hours.</p>
      <div className="moods">
        {MOODS.map(([k, e, l]) => <button key={k} className={'mood' + (sel === k ? ' sel' : '')} onClick={() => setSel(k)} aria-pressed={sel === k}><span>{e}</span>{l}</button>)}
      </div>
      <button className="btn btn-lg" disabled={!sel || busy} onClick={submit}>{busy ? 'Saving…' : saved ? 'Update mood' : 'Save mood'}</button>
      {saved && <p className="sub" style={{ marginTop: 18 }}>Saved for today. <Link to="/app/report">See your weekly report</Link> or <Link to="/app/remedies">open today’s remedies</Link>.</p>}
    </div>
  )
}
