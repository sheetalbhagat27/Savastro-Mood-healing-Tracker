import { createContext, useContext, useState, useCallback, useRef } from 'react'
const Ctx = createContext(() => {})
export const useToast = () => useContext(Ctx)
export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null)
  const t = useRef()
  const toast = useCallback((text, type = 'ok') => { setMsg({ text, type }); clearTimeout(t.current); t.current = setTimeout(() => setMsg(null), 4000) }, [])
  return <Ctx.Provider value={toast}>{children}<div className={`toast ${msg ? 'show' : ''} ${msg?.type === 'err' ? 'err' : ''}`} role="status">{msg?.text}</div></Ctx.Provider>
}
