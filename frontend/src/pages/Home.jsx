import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import LeadModal from '../components/LeadModal'
export default function Home() {
  const { user } = useAuth()
  const [lead, setLead] = useState(null), [guides, setGuides] = useState([])
  useEffect(() => { api('/guides').then(setGuides).catch(() => {}) }, [])
  return (
    <>
      <header className="nav">
        <a href="/" className="logo">SOVASTRO</a>
        <div className="nav-r">
          {user ? <Link className="btn btn-sm" to="/app">Open dashboard</Link> : <><Link className="link" to="/login">Log in</Link><Link className="btn btn-sm" to="/register">Get started</Link></>}
        </div>
      </header>
      <section className="hero">
        <div className="hero-txt">
          <span className="pill">☀ LIFE &amp; CAREER GUIDANCE</span>
          <h1>Do You Feel<br /><em>Stuck in Life?</em></h1>
          <p>Find clarity in your next steps with thoughtful astrology guidance for career, relationships and personal growth.</p>
          <button className="btn btn-lg" onClick={() => setLead('')}>Talk to an Astrologer <i>→</i></button>
        </div>
        <div className="hero-img"><img src="/assets/hero.png" alt="Woman watching the sunrise from a mountain" /></div>
      </section>
      <section className="sec">
        <h2>Your daily practice, in one place</h2>
        <p className="sub">Check in with your mood, follow remedies given by your astrologer and see your progress over time.</p>
        <div className="cards3">
          {[['🌤️', 'Daily mood check-in', 'Log how you feel once a day and watch your weekly and monthly trends.'], ['🪔', 'Remedies from your astrologer', 'Timers, counters, photo proof and check-ins make every remedy easy to follow and verify.'], ['✨', 'Book a guide', 'Choose an experienced astrologer, pick a time slot and manage your bookings.']].map(([i, t, d]) => (
            <div className="card" key={t}><span className="ic">{i}</span><h4>{t}</h4><p>{d}</p></div>
          ))}
        </div>
      </section>
      <section className="sec">
        <h2>Meet Our Life Guidance Experts</h2>
        <p className="sub">Connect with experienced astrologers who can guide you on your life journey.</p>
        <div className="cards3">
          {guides.map(g => (
            <article className="ex" key={g._id}>
              <img className="av" src={g.photo} alt={g.name} />
              <div><h4>{g.name}</h4><div className="role">{g.type}</div><div className="meta">{g.exp} Years Exp<br />{g.languages}</div></div>
              <div className="ex-b"><span className="on">Online</span><button className="btn" onClick={() => setLead(g.name)}>Consult Now</button></div>
            </article>
          ))}
        </div>
      </section>
      <section className="cta">
        <div><h3>Your Next Chapter<br /><em>Starts Here</em></h3><p>Talk to a trusted astrologer and get the clarity you need for a brighter tomorrow.</p></div>
        <button className="btn btn-lg" onClick={() => setLead('')}>Talk to an Astrologer <i>→</i></button>
      </section>
      <footer className="foot">© {new Date().getFullYear()} Sovastro. Guidance is not a substitute for medical or psychological care.</footer>
      {lead !== null && <LeadModal expert={lead} onClose={() => setLead(null)} />}
    </>
  )
}
