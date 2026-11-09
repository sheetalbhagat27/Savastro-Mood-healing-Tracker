import { useEffect, useState } from 'react'
import { api, today } from '../api'
import Modal from '../components/Modal'
import { useToast } from '../context/ToastContext'
export default function Guides() {
  const toast = useToast()
  const [guides, setGuides] = useState([]), [bookings, setBookings] = useState([]), [pick, setPick] = useState(null)
  const [f, setF] = useState({ date: today(), time: '18:00', note: '' }), [busy, setBusy] = useState(false)
  const load = () => { api('/guides').then(setGuides).catch(() => {}); api('/bookings/mine').then(setBookings).catch(() => {}) }
  useEffect(load, [])
  const book = async e => {
    e.preventDefault(); setBusy(true)
    try { await api(`/guides/${pick._id}/book`, { method: 'POST', body: f }); toast('Booking requested. We will confirm it shortly.'); setPick(null); load() }
    catch (x) { toast(x.message, 'err') } finally { setBusy(false) }
  }
  const cancel = async b => { if (confirm('Cancel this booking?')) { await api(`/bookings/${b._id}`, { method: 'DELETE' }).catch(x => toast(x.message, 'err')); load() } }
  return (
    <div>
      <h1>Talk to a guide</h1><p className="sub">Optional. Not a replacement for medical or psychological care.</p>
      {guides.map(g => (
        <div className="card row" key={g._id}>
          <img className="av sm" src={g.photo} alt={g.name} />
          <div style={{ flex: 1 }}><b>{g.name}</b><div className="role">{g.type}</div><small>{g.exp} yrs · ★ {g.rating} · {g.languages}</small></div>
          <div className="center"><b>₹{g.price}</b><div><button className="btn" onClick={() => setPick(g)}>Book</button></div></div>
        </div>
      ))}
      <h2 style={{ marginTop: 32 }}>My bookings</h2>
      {!bookings.length ? <p className="sub">No bookings yet.</p> : bookings.map(b => (
        <div className="card row" key={b._id}>
          <div style={{ flex: 1 }}><b>{b.guide?.name}</b><div><small>{b.date} at {b.time}</small></div></div>
          <span className={`chip ${b.status === 'confirmed' ? 'ok' : b.status === 'cancelled' ? 'bad' : ''}`}>{b.status}</span>
          {b.status !== 'cancelled' && <button className="btn-o" onClick={() => cancel(b)}>Cancel</button>}
        </div>
      ))}
      {pick && <Modal title={`Book ${pick.name}`} sub={`₹${pick.price} · ${pick.type}`} onClose={() => setPick(null)}>
        <form onSubmit={book}>
          <div className="row2"><label>Date<input type="date" min={today()} value={f.date} onChange={e => setF({ ...f, date: e.target.value })} required /></label>
            <label>Time<input type="time" value={f.time} onChange={e => setF({ ...f, time: e.target.value })} required /></label></div>
          <label>What would you like to discuss?<textarea rows="3" maxLength="500" value={f.note} onChange={e => setF({ ...f, note: e.target.value })} /></label>
          <button className="btn btn-lg full" disabled={busy}>{busy ? 'Booking…' : 'Confirm booking'}</button>
        </form></Modal>}
    </div>
  )
}
