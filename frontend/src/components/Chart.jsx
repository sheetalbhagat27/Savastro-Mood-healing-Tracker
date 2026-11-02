// Sovastro Mood Trend SVG Chart
const COL = { 5: '#ff7a1a', 4: '#f95701', 3: '#fbbf24', 2: '#f87171', 1: '#ef4444' }

export default function Chart({ series }) {
  const W = 640, H = 260, px = 44, py = 30, n = series.length
  const x = i => px + i * (W - px - 16) / Math.max(n - 1, 1), y = v => H - py - (v - 1) * (H - 2 * py - 10) / 4
  let seg = [], d = ''; series.forEach((s, i) => { if (s.score == null) { if (seg.length) d += 'M' + seg.join('L'); seg = [] } else seg.push(x(i) + ',' + y(s.score)) }); if (seg.length) d += 'M' + seg.join('L')
  const step = n > 10 ? 3 : 1
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      <defs>
        <linearGradient id="sovastroLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff7a1a" />
          <stop offset="100%" stopColor="#f95701" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#f95701" floodOpacity="0.4" />
        </filter>
      </defs>

      {[[5, '😄'], [3, '😐'], [1, '😣']].map(([v, e]) => (
        <g key={v}>
          <line x1={px} x2={W - 8} y1={y(v)} y2={y(v)} stroke="#1f2333" strokeDasharray="4 5" />
          <text x="6" y={y(v) + 6} fontSize="20">{e}</text>
        </g>
      ))}

      {d && (
        <path
          d={d}
          fill="none"
          stroke="url(#sovastroLineGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
        />
      )}

      {series.map((s, i) => (
        <g key={i}>
          {i % step === 0 && (
            <text x={x(i)} y={H - 6} fill="#94a3b8" fontSize="12" fontFamily="'Manrope', sans-serif" textAnchor="middle">
              {s.label}
            </text>
          )}
          {s.score != null && (
            <circle
              cx={x(i)}
              cy={y(s.score)}
              r={n > 10 ? 4.5 : 6.5}
              fill={COL[s.score] || '#f95701'}
              stroke="#0a0a0f"
              strokeWidth="2"
            />
          )}
          {s.emoji && n <= 7 && (
            <text x={x(i)} y={y(s.score) - 14} fontSize="20" textAnchor="middle">
              {s.emoji}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}
