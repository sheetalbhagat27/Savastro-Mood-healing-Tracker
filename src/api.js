export const user = () => JSON.parse(localStorage.getItem('sov_user') || 'null')
export const api = (u, body) => fetch('/api/' + u, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'x-user': user()?.email || '' }, body: body ? JSON.stringify(body) : undefined }).then(r => r.json())
