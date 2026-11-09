import { useEffect, useState } from 'react'
import { api } from '../api'
import { useToast } from '../context/ToastContext'
export default function Admin() {
  const toast = useToast()
  const [s, setS] = useState(null), [users, setUsers] = useState([]), [leads, setLeads] = useState([]), [bookings, setBookings] = useState([])
  const load = () => {
    api('/admin/stats').then(setS).catch(e => toast(e.message, 'err')); api('/admin/users').then(setUsers).catch(() => {})
    api('/admin/leads').then(setLeads).catch(() => {}); api('/admin/bookings').then(setBookings).catch(() => {})
  }
  useEffect(load, [])
  const role = async (u, r) => { try { await api(`/admin/users/${u._id}/role`, { method: 'PATCH', body: { role: r } }); toast(`${u.name} is now ${r}`); load() } catch (e) { toast(e.message, 'err') } }
  const handled = async l => { await api(`/admin/leads/${l._id}`, { method: 'PATCH', body: { handled: !l.handled } }).catch(() => {}); load() }
  const bstatus = async (b, status) => { await api(`/admin/bookings/${b._id}`, { method: 'PATCH', body: { status } }).catch(() => {}); load() }
  return (
    <div>
      <h1>Admin</h1>
      {s && <div className="stats">{[['Clients', s.users], ['Astrologers', s.astrologers], ['Moods today', s.moodsToday], ['Active remedies', s.remedies], ['New leads', s.leads], ['Bookings', s.bookings]].map(([l, v]) => <div className="stat" key={l}><b>{v}</b><small>{l}</small></div>)}</div>}
      <h2>Users &amp; roles</h2>
      <div className="tablewrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead><tbody>
        {users.map(u => <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td><select value={u.role} onChange={e => role(u, e.target.value)}><option>user</option><option>astrologer</option><option>admin</option></select></td></tr>)}
      </tbody></table></div>
      <h2>Consultation requests</h2>
      <div className="tablewrap"><table><thead><tr><th>Name</th><th>Phone</th><th>Birth</th><th>Topic</th><th>Expert</th><th></th></tr></thead><tbody>
        {leads.map(l => <tr key={l._id} className={l.handled ? 'muted' : ''}><td>{l.name}</td><td>{l.phone}</td><td>{l.dob} {l.tob} · {l.pob}</td><td>{l.topic}</td><td>{l.expert || '–'}</td><td><button className="link" onClick={() => handled(l)}>{l.handled ? 'Reopen' : 'Mark handled'}</button></td></tr>)}
        {!leads.length && <tr><td colSpan="6">No requests yet.</td></tr>}
      </tbody></table></div>
      <h2>Guide bookings</h2>
      <div className="tablewrap"><table><thead><tr><th>Client</th><th>Guide</th><th>When</th><th>Status</th></tr></thead><tbody>
        {bookings.map(b => <tr key={b._id}><td>{b.user?.name}</td><td>{b.guide?.name}</td><td>{b.date} {b.time}</td><td><select value={b.status} onChange={e => bstatus(b, e.target.value)}><option>pending</option><option>confirmed</option><option>cancelled</option></select></td></tr>)}
        {!bookings.length && <tr><td colSpan="4">No bookings yet.</td></tr>}
      </tbody></table></div>
    </div>
  )
}
