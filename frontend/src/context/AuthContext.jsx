import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../api'
const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { api('/auth/me').then(d => setUser(d.user)).catch(() => setUser(null)).finally(() => setLoading(false)) }, [])
  const login = useCallback(async (email, password) => { const d = await api('/auth/login', { method: 'POST', body: { email, password } }); setUser(d.user); return d.user }, [])
  const register = useCallback(async body => { const d = await api('/auth/register', { method: 'POST', body }); setUser(d.user); return d.user }, [])
  const logout = useCallback(async () => { await api('/auth/logout', { method: 'POST' }).catch(() => {}); setUser(null) }, [])
  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>
}
