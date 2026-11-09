import { useEffect, useState } from 'react'
import { api, MOODS } from '../api'
import Bars from '../components/Bars'
export default function Report() {
  const [range, setRange] = useState('week'), [d, setD] = useState(null), [err, setErr] = useState('')
  useEffect(() => { setD(null); api(`/moods/report?range=${range}`).then(setD).catch(e => setErr(e.message)) }, [range])
  return (
    <div>
      <div className="head"><h1>Mood report</h1>
        <div className="seg">{['week', 'month'].map(r => <button key={r} className={range === r ? 'on' : ''} onClick={() => setRange(r)}>{r === 'week' ? 'Weekly' : 'Monthly'}</button>)}</div></div>
      {err && <div className="alert">{err}</div>}
      {!d ? <p className="sub">Loading…</p> : <>
        <div className="stats">
          <div className="stat"><b>{d.average ?? '–'}</b><small>Average score (out of 5)</small></div>
          <div className="stat"><b>{d.logged}/{d.days}</b><small>Days logged</small></div>
          <div className="stat"><b>{d.streak}</b><small>Day streak</small></div>
        </div>
        <div className="card"><Bars series={d.series} /></div>
        <div className="card"><h4>How you felt</h4>
          {!d.logged ? <p className="sub">No check-ins yet. Log your mood on the Today page.</p> :
            <div className="dist">{MOODS.filter(m => d.distribution[m[0]]).map(m => <span key={m[0]} className="chip">{m[1]} {m[2]} · {d.distribution[m[0]]}</span>)}</div>}
        </div>
      </>}
    </div>
  )
}
