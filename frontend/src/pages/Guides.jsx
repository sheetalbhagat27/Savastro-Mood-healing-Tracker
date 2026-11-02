import { useEffect, useState } from 'react'
import { api } from '../services/api.js'

export default function Guides() {
  const [p, set] = useState([])

  useEffect(() => {
    api('pros')
      .then(res => set(Array.isArray(res) ? res : []))
      .catch(err => console.error('Failed to load guides:', err))
  }, [])

  return (
    <div>
      <h1>Talk to a guide</h1>
      <p className="sub">Optional. Not a replacement for medical or psychological care.</p>
      {p.map(x => (
        <div className="card row" key={x.id || x._id}>
          <div style={{ fontSize: 34 }}>🔮</div>
          <div style={{ flex: 1 }}>
            <b>{x.name}</b>
            <div className="sub" style={{ margin: 0 }}>
              {x.type} · {x.exp} yrs · ★ {x.rating}
            </div>
            <span className="tag">{x.avail}</span>
          </div>
          <div className="center">
            <b>₹{x.price}</b>
            <div>
              <button className="btn ghost" style={{ marginTop: 4 }}>
                Book
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
