import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
export default function AppShell() {
  const { user, logout } = useAuth(), nav = useNavigate()
  const staff = user.role !== 'user'
  const links = staff
    ? [['remedies', '🪔', 'Remedies'], ...(user.role === 'admin' ? [['admin', '🛡️', 'Admin']] : [])]
    : [['', '🌤️', 'Today'], ['report', '📈', 'Reports'], ['tasks', '🧘', 'Tasks'], ['guides', '✨', 'Guides'], ['remedies', '🪔', 'Remedies']]
  return (
    <div className="shell">
      <aside className="side">
        <a className="logo" href="/">SOVASTRO</a>
        <nav>
          {links.map(([to, ic, l]) => <NavLink key={l} to={to} end={to === ''} className={({ isActive }) => 'nav' + (isActive ? ' on' : '')}><span>{ic}</span><b>{l}</b></NavLink>)}
        </nav>
        <div className="grow" />
        <div className="who"><b>{user.name}</b><small>{user.role}</small></div>
        <button className="nav" onClick={async () => { await logout(); nav('/') }}><span>🚪</span><b>Logout</b></button>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  )
}
