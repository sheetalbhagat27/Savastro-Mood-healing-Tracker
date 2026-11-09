import { MOODS } from '../api'
const em = Object.fromEntries(MOODS.map(m => [m[0], m[1]]))
export default function Bars({ series }) {
  const W = 640, H = 200, pad = 28, bw = (W - pad * 2) / series.length
  return (
    <svg viewBox={`0 0 ${W} ${H + 30}`} className="chart" role="img" aria-label="Mood scores by day">
      {[1, 2, 3, 4, 5].map(v => <g key={v}><line x1={pad} x2={W - pad} y1={H - (v / 5) * (H - 20)} y2={H - (v / 5) * (H - 20)} stroke="#f3dccf" /><text x="4" y={H - (v / 5) * (H - 20) + 4} fontSize="10" fill="#8a7f78">{v}</text></g>)}
      {series.map((s, i) => {
        const h = s.score ? (s.score / 5) * (H - 20) : 0, x = pad + i * bw + bw * 0.18
        return <g key={s.date}>
          {s.score && <rect x={x} y={H - h} width={bw * 0.64} height={h} rx="5" fill={s.score >= 4 ? '#f4511e' : s.score === 3 ? '#f7a47f' : '#f2c9b5'} />}
          {s.mood && series.length <= 7 && <text x={x + bw * 0.32} y={H - h - 6} fontSize="16" textAnchor="middle">{em[s.mood]}</text>}
          {(series.length <= 7 || i % 5 === 0) && <text x={x + bw * 0.32} y={H + 18} fontSize="10" textAnchor="middle" fill="#8a7f78">{s.date.slice(5)}</text>}
        </g>
      })}
    </svg>
  )
}
