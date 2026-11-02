import { useState } from 'react'
import { api } from '../api.js'
export const MOODS = [['happy', '😄', 'Happy'], ['good', '🙂', 'Good'], ['okay', '😐', 'Okay'], ['confused', '😕', 'Confused'], ['notgood', '🙁', 'Not very good'], ['low', '😔', 'Low'], ['anxious', '😰', 'Anxious'], ['stressed', '😣', 'Stressed']]
export default function Mood({ today, onDone }) {
  const [sel, setSel] = useState(today?.mood || null)
  const submit = async () => { const r = await api('mood', { mood: sel }); if (r.error) return alert(r.error); onDone() }
  return <div className="center"><h1 style={{ fontSize: 36 }}>How are you feeling today?</h1>
    <p className="sub">Pick one and submit.</p>
    <div className="moods">{MOODS.map(m => <button key={m[0]} className={'mood' + (sel === m[0] ? ' sel' : '')} onClick={() => setSel(m[0])}>{m[1]}<span>{m[2]}</span></button>)}</div>
    <button className="btn" disabled={!sel} onClick={submit}>{today ? 'Update' : 'Submit'}</button></div>
}
