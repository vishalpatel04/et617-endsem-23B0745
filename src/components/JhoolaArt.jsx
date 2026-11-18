// Decorative playground jhoola (swing) for the start screen. The seat really swings.
export default function JhoolaArt({ className = '' }) {
  return (
    <svg viewBox="0 0 300 260" className={className} aria-hidden="true">
      <line x1="20" y1="248" x2="290" y2="248" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
      <path d="M 95 196 Q 155 222 215 196" fill="none" stroke="#7dd3fc" strokeWidth="3" strokeDasharray="6 6" />
      <g stroke="#475569" strokeWidth="7" strokeLinecap="round">
        <line x1="40" y1="246" x2="70" y2="24" />
        <line x1="100" y1="246" x2="70" y2="24" />
        <line x1="210" y1="246" x2="240" y2="24" />
        <line x1="270" y1="246" x2="240" y2="24" />
        <line x1="60" y1="22" x2="250" y2="22" />
      </g>
      <g className="jhoola-swing">
        <line x1="130" y1="22" x2="130" y2="190" stroke="#92400e" strokeWidth="3" />
        <line x1="180" y1="22" x2="180" y2="190" stroke="#92400e" strokeWidth="3" />
        <rect x="118" y="188" width="74" height="12" rx="5" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />
      </g>
    </svg>
  )
}
