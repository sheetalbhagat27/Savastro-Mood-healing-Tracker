import { useState } from 'react'
import Modal from './Modal'
import { api } from '../api'
import { useToast } from '../context/ToastContext'
const TOPICS = ['Talk to an Astrologer', 'Career confusion', 'Feeling lost', 'Relationship challenges', 'Finding my purpose', 'When will I get married?']
export default function LeadModal({ expert = '', onClose }) {
  const toast = useToast()
  const [f, setF] = useState({ name: '', phone: '', dob: '', tob: '', pob: '', topic: TOPICS[0] })
  const [err, setErr] = useState({}), [busy, setBusy] = useState(false)
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const check = () => {
    const e = {}
    if (f.name.trim().length < 2) e.name = 'Enter your full name'
    if (!/^[6-9]\d{9}$/.test(f.phone.replace(/[\s+-]/g, '').replace(/^91/, ''))) e.phone = 'Enter a valid 10-digit mobile number'
    if (!f.dob) e.dob = 'Select your date of birth'
    if (f.pob.trim().length < 2) e.pob = 'Enter your place of birth'
    setErr(e); return !Object.keys(e).length
  }
  const submit = async ev => {
    ev.preventDefault(); if (!check()) return
    setBusy(true)
    try { await api('/leads', { method: 'POST', body: { ...f, expert } }); toast(`Thank you ${f.name.split(' ')[0]}! Our astrologer will contact you shortly.`); onClose() }
    catch (e) { toast(e.message, 'err') } finally { setBusy(false) }
  }
  const field = (k, label, p = {}) => <label>{label}<input className={err[k] ? 'bad' : ''} value={f[k]} onChange={set(k)} {...p} /><em className="err">{err[k]}</em></label>
  return (
    <Modal title={expert ? `Consult ${expert}` : 'Talk to an Astrologer'} sub="Share your details and we’ll connect you with an expert." onClose={onClose}>
      <form onSubmit={submit} noValidate>
        {field('name', 'Full name', { autoComplete: 'name', autoFocus: true })}
        {field('phone', 'Mobile number', { inputMode: 'tel', placeholder: '10-digit number' })}
        <div className="row2">{field('dob', 'Date of birth', { type: 'date' })}<label>Time of birth<input type="time" value={f.tob} onChange={set('tob')} /></label></div>
        {field('pob', 'Place of birth')}
        <label>Your question<select value={f.topic} onChange={set('topic')}>{TOPICS.map(t => <option key={t}>{t}</option>)}</select></label>
        <button className="btn btn-lg full" disabled={busy}>{busy ? 'Sending…' : 'Request Consultation'}</button>
      </form>
    </Modal>
  )
}
