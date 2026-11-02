// One simple line. Missing days stay as gaps.
const COL = { 5: '#4cd7f6', 4: '#8be0a4', 3: '#ffb95f', 2: '#d0bcff', 1: '#ffb4ab' }
export default function Chart({ series }) {
  const W = 640, H = 260, px = 44, py = 30, n = series.length
  const x = i => px + i * (W - px - 16) / Math.max(n - 1, 1), y = v => H - py - (v - 1) * (H - 2 * py - 10) / 4
  let seg = [], d = ''; series.forEach((s, i) => { if (s.score == null) { if (seg.length) d += 'M' + seg.join('L'); seg = [] } else seg.push(x(i) + ',' + y(s.score)) }); if (seg.length) d += 'M' + seg.join('L')
  const step = n > 10 ? 3 : 1
  return <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
    {[[5, '😄'], [3, '😐'], [1, '😣']].map(([v, e]) => <g key={v}><line x1={px} x2={W - 8} y1={y(v)} y2={y(v)} stroke="#2b303c" strokeDasharray="4 5" /><text x="6" y={y(v) + 6} fontSize="20">{e}</text></g>)}
    <path d={d} fill="none" stroke="#d0bcff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    {series.map((s, i) => <g key={i}>{i % step === 0 && <text x={x(i)} y={H - 6} fill="#9aa0b6" fontSize="12" textAnchor="middle">{s.label}</text>}
      {s.score != null && <circle cx={x(i)} cy={y(s.score)} r={n > 10 ? 4 : 6} fill={COL[s.score]} />}
      {s.emoji && n <= 7 && <text x={x(i)} y={y(s.score) - 14} fontSize="20" textAnchor="middle">{s.emoji}</text>}</g>)}
  </svg>
}
