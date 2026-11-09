const BASE = import.meta.env.VITE_API_URL || '/api'
export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(BASE + path, {
    method, credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.error || 'Something went wrong'), { status: res.status })
  return data
}
export const today = () => new Date().toLocaleDateString('en-CA')
export const MOODS = [
  ['happy', '😄', 'Happy'], ['good', '🙂', 'Good'], ['okay', '😐', 'Okay'], ['confused', '😕', 'Confused'],
  ['notgood', '🙁', 'Not very good'], ['low', '😔', 'Low'], ['anxious', '😰', 'Anxious'], ['stressed', '😣', 'Stressed']
]
