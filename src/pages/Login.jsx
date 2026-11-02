import { useState } from 'react'
import { api } from '../api.js'
export default function Login({ onLogin }) {
  const [f, set] = useState({ name: '', email: '' })
  const go = async () => { if (!f.email.includes('@')) return alert('Enter a valid email'); const u = await api('login', f); localStorage.setItem('sov_user', JSON.stringify(u)); onLogin(u) }
  return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}><div className="card center" style={{ maxWidth: 380, width: '100%' }}>
    <div className="logo" style={{ padding: 0 }}>Sovastro</div><p className="sub">Your mood, your healing journey.</p>
    <input placeholder="Your name" value={f.name} onChange={e => set({ ...f, name: e.target.value })} />
    <input placeholder="Email" value={f.email} onChange={e => set({ ...f, email: e.target.value })} onKeyDown={e => e.key === 'Enter' && go()} />
    <p><button className="btn" style={{ width: '100%' }} onClick={go}>Login</button></p></div></div>
}
