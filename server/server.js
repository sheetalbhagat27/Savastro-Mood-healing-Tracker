// Sovastro Mood & Healing – demo API (Express + JSON file). Users are identified by email via the x-user header.
import express from 'express'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express(); app.use(express.json()); app.use(express.static(path.join(__dirname, '../dist')))
const DB = path.join(__dirname, 'data.json'), REMIND_MS = 60 * 1000, EDIT_MS = 2 * 3600 * 1000
const MOODS = { happy:['😄','Happy',5], good:['🙂','Good',4], okay:['😐','Okay',3], confused:['😕','Confused',3], notgood:['🙁','Not very good',2], low:['😔','Low',2], anxious:['😰','Anxious',1], stressed:['😣','Stressed',1] }
const day = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10), today = () => day(new Date())
let db = fs.existsSync(DB) ? JSON.parse(fs.readFileSync(DB)) : { moods: [], activities: [], pros: [
  { id:1, name:'Acharya Devendra Shastri', type:'Vedic Astrologer', tags:['low','fluctuating'], exp:18, price:350, rating:4.9, avail:'Today 6 PM' },
  { id:2, name:'Meera Nandini', type:'Tarot Reader', tags:['fluctuating'], exp:9, price:250, rating:4.7, avail:'Today 8 PM' },
  { id:3, name:'Swami Bodhi', type:'Meditation Guide', tags:['low','positive'], exp:14, price:200, rating:4.8, avail:'Tomorrow 7 AM' }] }
const save = () => fs.writeFileSync(DB, JSON.stringify(db))
app.use('/api', (q, r, n) => { q.u = (q.get('x-user') || 'guest').toLowerCase(); n() })
const mine = q => db.moods.filter(m => m.u === q.u)

app.post('/api/login', (q, r) => r.json({ email: (q.body.email || '').toLowerCase(), name: q.body.name || 'Friend' }))
app.get('/api/mood/today', (q, r) => r.json(mine(q).find(m => m.date === today()) || null))
app.post('/api/mood', (q, r) => {
  const { mood } = q.body; if (!MOODS[mood]) return r.status(400).json({ error: 'Please select how you feel' })
  const ex = mine(q).find(m => m.date === today()), now = new Date()
  if (ex) { if (now - new Date(ex.at) > EDIT_MS) return r.status(403).json({ error: 'Today\'s mood can no longer be changed' }); Object.assign(ex, { mood, score: MOODS[mood][2] }) }
  else db.moods.push({ u: q.u, date: today(), mood, score: MOODS[mood][2], at: now })
  save(); r.json({ ok: true })
})
app.post('/api/demo', (q, r) => { // sample data for a quick look
  const sc = [3,2,2,1,2,3,4,3,2,1,2,4,4,5,4,3,2,2,3,4,5,4,3,4,5,4]; const keys = { 5:'happy', 4:'good', 3:'okay', 2:'low', 1:'stressed' }
  db.moods = db.moods.filter(m => m.u !== q.u || m.date === today())
  sc.forEach((s, i) => { if (i % 9 === 4) return; const d = new Date(Date.now() - (sc.length - i) * 86400000); db.moods.push({ u: q.u, date: day(d), mood: keys[s], score: s, at: d }) })
  save(); r.json({ ok: true })
})

const avg = a => a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : null
app.get('/api/report', (q, r) => {
  const range = q.query.range === 'month' ? 'month' : 'week', now = new Date(), all = mine(q)
  const n = range === 'week' ? 7 : new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const series = [], rows = []
  for (let i = 0; i < n; i++) {
    const d = range === 'week' ? new Date(now.getTime() - (6 - i) * 86400000) : new Date(now.getFullYear(), now.getMonth(), i + 1)
    const e = all.find(x => x.date === day(d)); if (e) rows.push({ ...e, label: range === 'week' ? d.toLocaleDateString('en', { weekday: 'short' }) : String(i + 1) })
    series.push({ label: range === 'week' ? d.toLocaleDateString('en', { weekday: 'short' }) : String(i + 1), score: e ? e.score : null, emoji: e ? MOODS[e.mood][0] : null })
  }
  const sc = rows.map(x => x.score), dist = {}; rows.forEach(x => dist[x.mood] = (dist[x.mood] || 0) + 1)
  const good = sc.filter(s => s >= 4).length, tough = sc.filter(s => s <= 2).length, h = Math.floor(sc.length / 2)
  const diff = sc.length > 3 ? avg(sc.slice(h)) - avg(sc.slice(0, h)) : 0
  let swings = 0; for (let i = 1; i < sc.length; i++) if (Math.abs(sc[i] - sc[i - 1]) >= 2) swings++
  let run = 0, maxRun = 0; sc.forEach(s => { run = s <= 2 ? run + 1 : 0; maxRun = Math.max(maxRun, run) })
  const trend = swings >= Math.max(3, sc.length * 0.3) ? 'Up and down' : diff > 0.4 ? 'Getting better' : diff < -0.4 ? 'Getting lower' : 'Steady'
  let cat = 'positive', msg = 'A good stretch. Keep up what is working for you.'
  if (sc.length && (tough / sc.length >= 0.4 || maxRun >= 3)) { cat = 'low'; msg = 'Some days were hard. Talking to someone you trust, or a professional, can help.' }
  else if (trend === 'Up and down') { cat = 'fluctuating'; msg = 'Your mood moved a lot. A little rest and reflection may help.' }
  if (!sc.length) msg = 'No moods yet for this period.'
  const best = rows.length ? rows.reduce((a, b) => b.score > a.score ? b : a) : null, low = rows.length ? rows.reduce((a, b) => b.score < a.score ? b : a) : null
  r.json({ series, avg: avg(sc), tracked: sc.length, total: n, missed: n - sc.length, good, tough, trend, msg, cat, dist, best: best && { label: best.label, emoji: MOODS[best.mood][0] }, low: low && { label: low.label, emoji: MOODS[low.mood][0] } })
})
app.get('/api/pros', (q, r) => r.json(db.pros))

app.get('/api/activities', (q, r) => r.json(db.activities.filter(a => a.u === q.u)))
app.post('/api/activities', (q, r) => { const b = q.body; const a = { id: Date.now(), u: q.u, name: b.name, by: b.by || 'Acharya Devendra Shastri', target: +b.target || 5, seconds: +b.seconds || 20, count: 0, status: 'pending', last: null }; db.activities.push(a); save(); r.json(a) })
const act = q => db.activities.find(a => a.id == q.params.id && a.u === q.u)
app.post('/api/activities/:id/progress', (q, r) => { const a = act(q); if (a) { a.count = Math.min(a.target, +q.body.count || 0); save() } r.json(a) })
app.post('/api/activities/:id/complete', (q, r) => { const a = act(q); if (!a || a.count < a.target) return r.status(400).json({ error: 'Not finished' }); a.status = 'done'; save(); r.json(a) })
app.post('/api/activities/:id/later', (q, r) => { const a = act(q); if (a) { a.last = new Date(); save() } r.json({ ok: true }) })
app.get('/api/notify', (q, r) => { // client polls; use FCM/APNs push in production
  const a = db.activities.find(x => x.u === q.u && x.status === 'pending' && (!x.last || Date.now() - new Date(x.last) > REMIND_MS))
  if (a) { a.last = new Date(); save() } r.json(a || null)
})
app.get('*', (q, r) => r.sendFile(path.join(__dirname, '../dist/index.html')))
app.listen(3000, () => console.log('Sovastro on http://localhost:3000'))
