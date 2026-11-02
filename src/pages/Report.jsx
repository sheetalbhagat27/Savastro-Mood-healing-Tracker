import { useEffect, useState } from 'react'
import { api } from '../api.js'
import Chart from '../components/Chart.jsx'
import { MOODS } from './Mood.jsx'
export default function Report({ range }) {
  const [r, set] = useState(null); const load = () => api('report?range=' + range).then(set); useEffect(() => { set(null); load() }, [range]); if (!r) return null
  const month = range === 'month', max = Math.max(1, ...Object.values(r.dist))
  return <div><h1>{month ? 'This month' : 'This week'}</h1><p className="sub">{r.tracked ? r.msg : 'No moods yet for this period.'}</p>
    <div className="card">{r.tracked ? <Chart series={r.series} /> : <p className="center sub">Nothing to show yet.</p>}</div>
    {r.tracked < 3 && <p className="center"><button className="btn ghost" onClick={async () => { await api('demo', {}); load() }}>Add sample data</button></p>}
    {r.tracked > 0 && <>
      <div className="stats"><div className="stat"><b>{r.avg}</b><span>Average (of 5)</span></div><div className="stat"><b>{r.good}</b><span>Good days</span></div>
        <div className="stat"><b>{r.tough}</b><span>Tough days</span></div><div className="stat"><b>{r.trend}</b><span>Trend</span></div></div>
      {month && <div className="card" style={{ marginTop: 16 }}><h3 style={{ marginBottom: 8 }}>How your days felt</h3>
        {MOODS.filter(m => r.dist[m[0]]).map(m => <div className="row" key={m[0]}><span style={{ width: 130 }}>{m[1]} {m[2]}</span><div className="bar"><i style={{ width: r.dist[m[0]] / max * 100 + '%' }} /></div><b>{r.dist[m[0]]}</b></div>)}
        <p className="sub" style={{ margin: '14px 0 0' }}>Best day: {r.best.emoji} {r.best.label} · Lowest day: {r.low.emoji} {r.low.label} · Not logged: {r.missed} days</p></div>}
      <p className="sub" style={{ fontSize: 12 }}>This is a wellness note, not a medical diagnosis.</p></>}</div>
}
