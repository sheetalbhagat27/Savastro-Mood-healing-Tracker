import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
export default function Auth({ mode }) {
  const reg = mode === 'register'
  const { user, login, register } = useAuth(), nav = useNavigate()
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' }), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  if (user) return <Navigate to="/app" replace />
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const submit = async e => {
    e.preventDefault(); setErr('')
    if (reg && f.password.length < 8) return setErr('Password must be at least 8 characters')
    setBusy(true)
    try { reg ? await register(f) : await login(f.email, f.password); nav('/app') }
    catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <div className="authwrap">
      <form className="authbox" onSubmit={submit}>
        <a className="logo" href="/">SOVASTRO</a>
        <h2>{reg ? 'Create your account' : 'Welcome back'}</h2>
        <p className="sub">{reg ? 'Start your daily practice in a minute.' : 'Log in to continue your practice.'}</p>
        {reg && <label>Full name<input value={f.name} onChange={set('name')} required autoComplete="name" /></label>}
        <label>Email<input type="email" value={f.email} onChange={set('email')} required autoComplete="email" /></label>
        {reg && <label>Mobile (optional)<input value={f.phone} onChange={set('phone')} inputMode="tel" /></label>}
        <label>Password<input type="password" value={f.password} onChange={set('password')} required minLength={reg ? 8 : 1} autoComplete={reg ? 'new-password' : 'current-password'} /></label>
        {err && <div className="alert" role="alert">{err}</div>}
        <button className="btn btn-lg full" disabled={busy}>{busy ? 'Please wait…' : reg ? 'Create account' : 'Log in'}</button>
        <p className="swap">{reg ? <>Already have an account? <Link to="/login">Log in</Link></> : <>New to Sovastro? <Link to="/register">Create an account</Link></>}</p>
      </form>
    </div>
  )
}
