import { useEffect, useRef, useState } from 'react'
import { api, today } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const METHOD = { timer: '⏱ Timer', counter: '🔢 Counter', photo: '📷 Photo proof', checkin: '✅ Check-in' }
const CATS = ['Mantra', 'Meditation', 'Puja', 'Fasting', 'Charity', 'Lifestyle', 'Gemstone', 'Other']
const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

/* ---------- user: one reminder slot ---------- */
function Slot({ r, slot, comp, reload }) {
  const toast = useToast()
  const [c, setC] = useState(comp), [count, setCount] = useState(comp?.counterValue || 0)
  const [left, setLeft] = useState(0), [photo, setPhoto] = useState(''), [note, setNote] = useState(''), [busy, setBusy] = useState(false)
  const iv = useRef()
  const label = slot === 'daily' ? 'Today' : slot
  useEffect(() => {
    clearInterval(iv.current)
    if (c?.status === 'started' && r.completionMethod === 'timer') {
      const tick = () => setLeft(Math.max(0, Math.ceil(r.durationSeconds - (Date.now() - new Date(c.startedAt)) / 1000)))
      tick(); iv.current = setInterval(tick, 500)
    }
    return () => clearInterval(iv.current)
  }, [c, r])
  const act = async (fn) => { setBusy(true); try { await fn() } catch (e) { toast(e.message, 'err') } finally { setBusy(false) } }
  const start = () => act(async () => setC(await api(`/remedies/${r._id}/start`, { method: 'POST', body: { slot } })))
  const finish = () => act(async () => {
    const d = await api(`/remedies/${r._id}/complete`, { method: 'POST', body: { slot, counterValue: count, photo, note } })
    setC(d); toast(r.completionMethod === 'photo' ? 'Submitted. Your astrologer will review it.' : 'Remedy completed. Well done!'); reload()
  })
  const pickPhoto = e => {
    const file = e.target.files[0]; if (!file) return
    if (file.size > 1_000_000) return toast('Photo must be under 1 MB', 'err')
    const rd = new FileReader(); rd.onload = () => setPhoto(rd.result); rd.readAsDataURL(file)
  }
  if (c?.status === 'completed') return <div className="slot done"><b>{label}</b><span className="chip ok">✓ Done</span>{c.reviewStatus === 'pending' && <small>Awaiting review</small>}{c.reviewStatus === 'approved' && <small>Approved ✔</small>}{c.reviewStatus === 'rejected' && <small>Rejected — {c.astrologerComment || 'please redo'}</small>}</div>
  if (!c) return <div className="slot"><b>{label}</b><button className="btn" disabled={busy} onClick={start}>Start</button></div>
  const m = r.completionMethod
  return (
    <div className="slot open">
      <b>{label}</b>
      {m === 'timer' && <span className="big">{fmt(left)}</span>}
      {m === 'counter' && <><button className="btn" onClick={() => setCount(n => n + 1)}>+1</button><span className="big">{count} / {r.dailyTarget}</span></>}
      {m === 'photo' && <label className="file">{photo ? 'Photo ready ✓' : 'Choose photo'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={pickPhoto} hidden /></label>}
      {m === 'checkin' && <input className="note" placeholder="Add a note (optional)" value={note} onChange={e => setNote(e.target.value)} maxLength="500" />}
      <button className="btn-o" disabled={busy || (m === 'timer' && left > 0) || (m === 'counter' && count < r.dailyTarget) || (m === 'photo' && !photo)} onClick={finish}>Mark complete</button>
    </div>
  )
}

function History({ id }) {
  const [h, setH] = useState(null)
  useEffect(() => { api(`/remedies/${id}/progress`).then(setH).catch(() => setH([])) }, [id])
  if (!h) return <small>Loading…</small>
  return h.length ? <div className="hist">{h.slice(0, 30).map(x => <span key={x._id} className={`chip ${x.status === 'completed' ? 'ok' : ''}`}>{x.date.slice(5)} {x.slotKey !== 'daily' && x.slotKey} {x.status === 'completed' ? '✓' : '…'}</span>)}</div> : <small>No history yet.</small>
}

function UserView() {
  const [list, setList] = useState(null), [open, setOpen] = useState(null)
  const load = () => api('/remedies').then(setList).catch(() => setList([]))
  useEffect(() => { load() }, [])
  if (!list) return <p className="sub">Loading…</p>
  return (
    <div>
      <h1>My remedies</h1><p className="sub">Remedies assigned by your astrologer. Complete each slot to build your streak.</p>
      {!list.length && <div className="card"><p>No remedies yet. Your astrologer will assign them after your consultation.</p></div>}
      {list.map(r => (
        <div className="card" key={r._id}>
          <div className="rhead"><div><h4>{r.title}</h4><small>{r.category} · by {r.astrologer?.name} · {r.startDate} → {r.endDate}</small></div><span className="chip">{METHOD[r.completionMethod]}</span></div>
          <p className="instr">{r.instructions}</p>
          <small>{r.completionMethod === 'timer' && `Duration: ${fmt(r.durationSeconds)}`}{r.completionMethod === 'counter' && `Target: ${r.dailyTarget} per slot`}</small>
          {r.scheduledToday ? <div className="slots">{r.slots.map(s => <Slot key={s + (r.today.find(c => c.slotKey === s)?.status || '')} r={r} slot={s} comp={r.today.find(c => c.slotKey === s)} reload={load} />)}</div> : <p className="sub">{today() < r.startDate ? 'Starts on ' + r.startDate : 'This remedy has ended.'}</p>}
          <button className="link" onClick={() => setOpen(open === r._id ? null : r._id)}>{open === r._id ? 'Hide history' : 'View history'}</button>
          {open === r._id && <History id={r._id} />}
        </div>
      ))}
    </div>
  )
}

/* ---------- astrologer / admin ---------- */
function StaffView() {
  const toast = useToast()
  const blank = { userId: '', title: '', category: CATS[0], instructions: '', completionMethod: 'timer', dailyTarget: 11, durationMinutes: 5, times: '07:00', startDate: today(), endDate: today() }
  const [f, setF] = useState(blank), [clients, setClients] = useState([]), [list, setList] = useState(null), [pending, setPending] = useState([]), [busy, setBusy] = useState(false), [openId, setOpenId] = useState(null)
  const load = () => { api('/remedies').then(setList).catch(() => setList([])); api('/remedies/reviews/pending').then(setPending).catch(() => {}) }
  useEffect(() => { load(); api('/remedies/clients').then(setClients).catch(() => {}) }, [])
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const submit = async e => {
    e.preventDefault(); setBusy(true)
    try {
      await api('/remedies', { method: 'POST', body: { ...f, durationSeconds: Math.round(f.durationMinutes * 60), reminderTimes: f.times.split(',').map(s => s.trim()).filter(Boolean) } })
      toast('Remedy assigned'); setF({ ...blank, userId: f.userId }); load()
    } catch (x) { toast(x.message, 'err') } finally { setBusy(false) }
  }
  const review = async (id, status) => {
    const comment = status === 'rejected' ? prompt('Reason (shown to the client)') || '' : ''
    await api(`/remedies/completions/${id}/review`, { method: 'PATCH', body: { status, comment } }).catch(x => toast(x.message, 'err')); load()
  }
  const remove = async r => { if (confirm('Stop this remedy?')) { await api(`/remedies/${r._id}`, { method: 'DELETE' }).catch(x => toast(x.message, 'err')); load() } }
  const m = f.completionMethod
  return (
    <div>
      <h1>Remedies</h1><p className="sub">Assign remedies to clients and review their proof.</p>
      <form className="card" onSubmit={submit}>
        <h4>Assign a new remedy</h4>
        <div className="grid2">
          <label>Client<select value={f.userId} onChange={set('userId')} required><option value="">Select client…</option>{clients.map(c => <option key={c._id} value={c._id}>{c.name} ({c.email})</option>)}</select></label>
          <label>Title<input value={f.title} onChange={set('title')} required maxLength="140" /></label>
          <label>Category<select value={f.category} onChange={set('category')}>{CATS.map(c => <option key={c}>{c}</option>)}</select></label>
          <label>Completion method<select value={m} onChange={set('completionMethod')}>{Object.entries(METHOD).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          {m === 'timer' && <label>Duration (minutes)<input type="number" min="1" max="120" value={f.durationMinutes} onChange={set('durationMinutes')} /></label>}
          {m === 'counter' && <label>Count per slot<input type="number" min="1" max="1008" value={f.dailyTarget} onChange={set('dailyTarget')} /></label>}
          <label>Reminder times (HH:mm, comma separated)<input value={f.times} onChange={set('times')} placeholder="07:00, 19:00" /></label>
          <label>Start date<input type="date" value={f.startDate} onChange={set('startDate')} required /></label>
          <label>End date<input type="date" min={f.startDate} value={f.endDate} onChange={set('endDate')} required /></label>
        </div>
        <label>Instructions<textarea rows="3" value={f.instructions} onChange={set('instructions')} required maxLength="2000" /></label>
        <button className="btn" disabled={busy}>{busy ? 'Assigning…' : 'Assign remedy'}</button>
      </form>

      <h2>Pending reviews {pending.length > 0 && <span className="chip">{pending.length}</span>}</h2>
      {!pending.length ? <p className="sub">Nothing waiting for review.</p> : pending.map(c => (
        <div className="card row" key={c._id}>
          <div style={{ flex: 1 }}><b>{c.remedy?.title}</b><div><small>{c.user?.name} · {c.date}</small></div>{c.proofNote && <small>“{c.proofNote}”</small>}</div>
          <button className="btn-o" onClick={() => setOpenId(openId === c._id ? null : c._id)}>View proof</button>
          <button className="btn" onClick={() => review(c._id, 'approved')}>Approve</button>
          <button className="btn-o" onClick={() => review(c._id, 'rejected')}>Reject</button>
          {openId === c._id && c.proofPhoto && <img className="proof" src={c.proofPhoto} alt="Submitted proof" />}
        </div>
      ))}

      <h2>Assigned remedies</h2>
      {!list ? <p className="sub">Loading…</p> : !list.length ? <p className="sub">No remedies assigned yet.</p> : list.map(r => (
        <div className="card" key={r._id}>
          <div className="rhead"><div><h4>{r.title}</h4><small>{r.user?.name} · {r.category} · {r.startDate} → {r.endDate} · {r.reminderTimes.join(', ') || 'daily'}</small></div><span className="chip">{METHOD[r.completionMethod]}</span></div>
          <div className="rhead"><small>{r.completedCount} completions so far</small>
            <div><button className="link" onClick={() => setOpenId(openId === r._id ? null : r._id)}>History</button> <button className="link" onClick={() => remove(r)}>Stop</button></div></div>
          {openId === r._id && <History id={r._id} />}
        </div>
      ))}
    </div>
  )
}
export default function Remedies() { return useAuth().user.role === 'user' ? <UserView /> : <StaffView /> }
