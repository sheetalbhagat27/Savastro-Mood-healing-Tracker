import { useEffect, useState } from 'react'
import { api } from '../api'
import { useToast } from '../context/ToastContext'
const PRESETS = ['Om Namah Shivay', 'Gayatri Mantra', 'Maha Mrityunjaya Mantra', 'Hanuman Chalisa', 'Custom…']
export default function Tasks() {
  const toast = useToast()
  const [list, setList] = useState(null), [name, setName] = useState(PRESETS[0]), [custom, setCustom] = useState(''), [target, setTarget] = useState(11)
  const load = () => api('/tasks').then(setList).catch(e => toast(e.message, 'err'))
  useEffect(() => { load() }, [])
  const add = async e => {
    e.preventDefault()
    try { await api('/tasks', { method: 'POST', body: { name: name === 'Custom…' ? custom : name, target } }); setCustom(''); load() } catch (x) { toast(x.message, 'err') }
  }
  const tap = async t => {
    const count = Math.min(t.target, t.count + 1)
    setList(l => l.map(x => x._id === t._id ? { ...x, count } : x))
    try { await api(`/tasks/${t._id}/progress`, { method: 'PATCH', body: { count } } ) } catch (x) { toast(x.message, 'err'); load() }
  }
  const done = async t => { try { await api(`/tasks/${t._id}/complete`, { method: 'POST' }); toast('Task completed. Well done!'); load() } catch (x) { toast(x.message, 'err') } }
  const del = async t => { if (confirm('Delete this task?')) { await api(`/tasks/${t._id}`, { method: 'DELETE' }).catch(() => {}); load() } }
  return (
    <div>
      <h1>Tasks</h1><p className="sub">Count your japa or daily practice and mark it complete.</p>
      <form className="card inline" onSubmit={add}>
        <label>Practice<select value={name} onChange={e => setName(e.target.value)}>{PRESETS.map(p => <option key={p}>{p}</option>)}</select></label>
        {name === 'Custom…' && <label>Name<input value={custom} onChange={e => setCustom(e.target.value)} required /></label>}
        <label>Target count<input type="number" min="1" max="1008" value={target} onChange={e => setTarget(e.target.value)} /></label>
        <button className="btn">Add task</button>
      </form>
      {!list ? <p className="sub">Loading…</p> : !list.length ? <p className="sub">No tasks yet. Add your first one above.</p> : list.map(t => (
        <div className="card task" key={t._id}>
          <div style={{ flex: 1 }}>
            <b>{t.name}</b>
            <div className="bar"><i style={{ width: `${(t.count / t.target) * 100}%` }} /></div>
            <small>{t.count} / {t.target}</small>
          </div>
          {t.status === 'done' ? <span className="chip ok">✓ Completed</span> : <>
            <button className="btn" disabled={t.count >= t.target} onClick={() => tap(t)}>+1</button>
            <button className="btn-o" disabled={t.count < t.target} onClick={() => done(t)}>Complete</button></>}
          <button className="icon" aria-label="Delete task" onClick={() => del(t)}>🗑</button>
        </div>
      ))}
    </div>
  )
}
