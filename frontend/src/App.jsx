import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppShell from './components/AppShell'
import Home from './pages/Home'
import Auth from './pages/Auth'
import Today from './pages/Today'
import Report from './pages/Report'
import Tasks from './pages/Tasks'
import Guides from './pages/Guides'
import Remedies from './pages/Remedies'
import Admin from './pages/Admin'

function Guard({ roles, children }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="sub" style={{ padding: 40 }}>Loading…</p>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/app" replace />
  return children
}
function Landing() { const { user } = useAuth(); return user && user.role !== 'user' ? <Navigate to="remedies" replace /> : <Today /> }

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/register" element={<Auth mode="register" />} />
      <Route path="/app" element={<Guard><AppShell /></Guard>}>
        <Route index element={<Landing />} />
        <Route path="report" element={<Guard roles={['user']}><Report /></Guard>} />
        <Route path="tasks" element={<Guard roles={['user']}><Tasks /></Guard>} />
        <Route path="guides" element={<Guard roles={['user']}><Guides /></Guard>} />
        <Route path="remedies" element={<Remedies />} />
        <Route path="admin" element={<Guard roles={['admin']}><Admin /></Guard>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
