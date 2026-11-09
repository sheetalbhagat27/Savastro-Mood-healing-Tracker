import { useEffect } from 'react'
export default function Modal({ title, sub, onClose, children }) {
  useEffect(() => {
    const esc = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', esc); document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = '' }
  }, [onClose])
  return (
    <div className="modal" role="dialog" aria-modal="true" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="box">
        <button className="x" aria-label="Close" onClick={onClose}>×</button>
        <h3>{title}</h3>{sub && <p className="msub">{sub}</p>}
        {children}
      </div>
    </div>
  )
}
