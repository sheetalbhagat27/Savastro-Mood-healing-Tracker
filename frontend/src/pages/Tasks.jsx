import { useEffect, useState } from 'react'
import { api } from '../services/api.js'

export default function Tasks({ onStart, refresh }) {
  const [a, set] = useState([])
  const [f, setF] = useState({ name: 'Om Namah Shivay', target: 5, seconds: 20 })
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const load = () => {
    api('activities')
      .then(res => set(Array.isArray(res) ? res : []))
      .catch(err => console.error('Failed to load tasks:', err))
  }

  useEffect(() => {
    load()
  }, [refresh])

  const assign = async () => {
    setLoading(true)
    try {
      await api('activities', f)
      setOpen(false)
      load()
    } catch (err) {
      alert(err.message || 'Failed to assign task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>Healing tasks</h1>
      <p className="sub">Remedies from your astrologer.</p>
      {!a.length && <div className="card center sub">No tasks yet.</div>}
      {a.slice().reverse().map(x => (
        <div className="card row" key={x._id || x.id}>
          <div style={{ flex: 1 }}>
            <b>{x.name}</b> <span className={x.status === 'done' ? 'done' : 'pend'}>{x.status === 'done' ? '✓ Done' : '● Pending'}</span>
            <div className="sub" style={{ margin: 0 }}>{x.by} · {x.count}/{x.target}</div>
          </div>
          {x.status === 'pending' && (
            <button className="btn" style={{ padding: '10px 22px' }} onClick={() => onStart(x)}>
              Start
            </button>
          )}
        </div>
      ))}
      <button className="btn ghost" onClick={() => setOpen(!open)}>
        {open ? 'Cancel' : '+ Assign task (astrologer)'}
      </button>
      {open && (
        <div className="card" style={{ marginTop: 14 }}>
          <input
            value={f.name}
            onChange={e => setF({ ...f, name: e.target.value })}
            placeholder="Task name"
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="number"
              value={f.target}
              onChange={e => setF({ ...f, target: e.target.value })}
              title="Times"
            />
            <input
              type="number"
              value={f.seconds}
              onChange={e => setF({ ...f, seconds: e.target.value })}
              title="Seconds"
            />
          </div>
          <p className="sub" style={{ margin: '0 0 10px', fontSize: 12 }}>Times · Seconds</p>
          <button className="btn" disabled={loading} onClick={assign}>
            {loading ? 'Sending...' : 'Send to user'}
          </button>
        </div>
      )}
    </div>
  )
}
