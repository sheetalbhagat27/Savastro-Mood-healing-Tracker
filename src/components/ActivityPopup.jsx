import { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'
// notification -> OK -> timer + tap counter -> Done. Not finished = stays pending, reminded again.
export default function ActivityPopup({ act, onClose }) {
  const [stage, setStage] = useState(act.notify ? 'ask' : 'run'), [left, setLeft] = useState(act.seconds), [c, setC] = useState(act.count || 0), t = useRef()
  useEffect(() => { if (stage !== 'run') return; t.current = setInterval(() => setLeft(l => l - 1), 1000); return () => clearInterval(t.current) }, [stage])
  useEffect(() => { if (stage === 'run' && left <= 0) { clearInterval(t.current); if (c < act.target) setStage('late') } }, [left])
  const tap = () => { if (left > 0 && c < act.target) { setC(c + 1); api(`activities/${act.id}/progress`, { count: c + 1 }) } }
  const done = async () => { clearInterval(t.current); await api(`activities/${act.id}/complete`, {}); setStage('ok'); setTimeout(onClose, 1200) }
  return <div className="modal"><div className="box">
    {stage === 'ask' && <><div className="big">🕉️</div><h2>{act.name}</h2><p className="sub">{act.by} suggests {act.target} times today. Let's do it together. It takes {act.seconds} seconds.</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}><button className="btn" onClick={() => setStage('run')}>OK</button><button className="btn ghost" onClick={() => { api(`activities/${act.id}/later`, {}); onClose() }}>Later</button></div></>}
    {stage === 'run' && <><h2>{act.name}</h2><div className="big">{Math.max(left, 0)}s</div><p className="sub">{c} / {act.target}</p>
      <button className="btn" onClick={tap}>+1 Chant</button>{c >= act.target && <p><button className="btn" onClick={done}>Done ✓</button></p>}<p><button className="btn ghost" onClick={onClose}>Close</button></p></>}
    {stage === 'late' && <><h2>Time is up</h2><p className="sub">{c}/{act.target} done. It stays pending and we will remind you.</p><button className="btn" onClick={onClose}>OK</button></>}
    {stage === 'ok' && <><div className="big">✓</div><h2>Well done!</h2></>}
  </div></div>
}
