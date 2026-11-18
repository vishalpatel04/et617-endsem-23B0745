import { useEffect, useRef, useState } from 'react'
import { idealPeriod } from '../physics.js'

const PIVOT_X = 150
const PIVOT_Y = 28
const PX_PER_CM = 2.6
const ARC_R = 70

function point(radius, degrees) {
  const rad = (degrees * Math.PI) / 180
  return [PIVOT_X + radius * Math.sin(rad), PIVOT_Y + radius * Math.cos(rad)]
}

// Animated virtual pendulum with three measuring tools: ruler (cm), protractor (degrees) and stopwatch.
export default function Pendulum({ length, mass, angle, running, speed, lastTime, onDone }) {
  const [simTime, setSimTime] = useState(0)
  const onDoneRef = useRef(onDone)
  const period = idealPeriod(length)

  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  useEffect(() => {
    if (!running) return undefined
    let frame = 0
    let last = performance.now()
    let t = 0
    const total = 10 * period
    const tick = (now) => {
      t = Math.min(t + (Math.min(now - last, 50) / 1000) * speed, total)
      last = now
      setSimTime(t)
      if (t >= total) {
        onDoneRef.current?.()
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running, period, speed])

  const theta = running ? angle * Math.cos((2 * Math.PI * simTime) / period) : angle
  const [bx, by] = point(length * PX_PER_CM, theta)
  const radius = 8 + mass / 40
  const swings = running ? Math.min(10, Math.floor(simTime / period + 1e-6)) : 0
  const clock = running ? simTime : (lastTime ?? 0)
  const [ax, ay] = point(ARC_R, -25)
  const [bx2, by2] = point(ARC_R, 25)

  return (
    <figure className="flex flex-col items-center">
      <svg
        viewBox="0 0 300 330"
        className="w-full max-w-[22rem]"
        role="img"
        aria-label={`Pendulum with a ${length} cm string and a ${mass} g bob, pulled back ${angle} degrees`}
      >
        <rect x="60" y="14" width="180" height="10" rx="3" className="fill-slate-700" />
        {/* Protractor */}
        <path d={`M ${ax} ${ay} A ${ARC_R} ${ARC_R} 0 0 0 ${bx2} ${by2}`} fill="none" className="stroke-sky-500" strokeWidth="1.5" />
        {[-20, -15, -10, -5, 0, 5, 10, 15, 20].map((deg) => {
          const [x1, y1] = point(deg % 10 === 0 ? 60 : 64, deg)
          const [x2, y2] = point(ARC_R, deg)
          return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-sky-500" strokeWidth="1.2" />
        })}
        {[-20, -10, 10, 20].map((deg) => {
          const [x, y] = point(84, deg)
          return (
            <text key={deg} x={x} y={y + 4} textAnchor="middle" className="fill-sky-700 text-[9px]">
              {Math.abs(deg)}°
            </text>
          )
        })}
        {/* Rest position */}
        <line x1={PIVOT_X} y1={PIVOT_Y} x2={PIVOT_X} y2={PIVOT_Y + 265} strokeDasharray="4 5" className="stroke-slate-300" />
        {/* Ruler */}
        <rect x="270" y={PIVOT_Y} width="24" height={100 * PX_PER_CM} rx="3" className="fill-amber-100 stroke-amber-400" />
        {Array.from({ length: 11 }, (_, i) => i * 10).map((cm) => (
          <g key={cm}>
            <line x1="270" y1={PIVOT_Y + cm * PX_PER_CM} x2={cm % 20 === 0 ? 280 : 276} y2={PIVOT_Y + cm * PX_PER_CM} className="stroke-amber-700" />
            {cm % 20 === 0 && cm > 0 && (
              <text x="292" y={PIVOT_Y + cm * PX_PER_CM + 3} textAnchor="end" className="fill-amber-800 text-[8px]">
                {cm}
              </text>
            )}
          </g>
        ))}
        <line x1="266" y1={PIVOT_Y + length * PX_PER_CM} x2="294" y2={PIVOT_Y + length * PX_PER_CM} className="stroke-rose-600" strokeWidth="2" />
        {/* String and bob */}
        <line x1={PIVOT_X} y1={PIVOT_Y} x2={bx} y2={by} className="stroke-slate-800" strokeWidth="2" />
        <circle cx={bx} cy={by} r={radius} className="fill-amber-400 stroke-amber-700" strokeWidth="2" />
        <text x={bx} y={by + 3} textAnchor="middle" className="fill-amber-900 text-[8px] font-semibold">
          {mass}g
        </text>
        <circle cx={PIVOT_X} cy={PIVOT_Y} r="4" className="fill-slate-800" />
      </svg>
      <figcaption className="mt-2 grid w-full max-w-[22rem] grid-cols-2 gap-2 text-center">
        <div className="rounded-xl bg-slate-900 px-3 py-2 font-mono text-2xl text-emerald-300" aria-label="Stopwatch">
          {clock.toFixed(2)} s
        </div>
        <div className="rounded-xl bg-slate-100 px-3 py-2 text-slate-800">
          <span className="block text-xs text-slate-500">Swings counted</span>
          <span className="text-xl font-bold">{swings} / 10</span>
        </div>
      </figcaption>
    </figure>
  )
}
