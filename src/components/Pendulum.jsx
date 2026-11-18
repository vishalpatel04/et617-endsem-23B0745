import { useEffect, useRef, useState } from 'react'
import { useLang } from '../lang.js'
import { idealPeriod } from '../physics.js'
import Rich from './Rich.jsx'
import Scene3D from './Scene3D.jsx'

const PIVOT_X = 150
const PIVOT_Y = 28
const PX_PER_CM = 2.6
const ARC_R = 70

function point(radius, degrees) {
  const rad = (degrees * Math.PI) / 180
  return [PIVOT_X + radius * Math.sin(rad), PIVOT_Y + radius * Math.cos(rad)]
}

// Animated virtual pendulum with three measuring tools: ruler (cm), protractor (degrees) and stopwatch.
export default function Pendulum({ length, mass, angle, running, speed, lastTime, onDone, view = '2d', turn = 35 }) {
  const { t, lang } = useLang()
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
    let elapsedSim = 0
    const total = 10 * period
    const tick = (now) => {
      elapsedSim = Math.min(elapsedSim + (Math.min(now - last, 50) / 1000) * speed, total)
      last = now
      setSimTime(elapsedSim)
      if (elapsedSim >= total) {
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
  const [pathStartX, pathStartY] = point(length * PX_PER_CM, -angle)
  const [pathEndX, pathEndY] = point(length * PX_PER_CM, angle)
  // Speed and path for one full swing (small angles): path = 4·L·θ0, top speed = L·θ0·ω.
  const amplitude = (angle * Math.PI) / 180
  const omega = (2 * Math.PI) / period
  const topSpeed = (length / 100) * amplitude * omega
  const speedNow = running ? topSpeed * Math.abs(Math.sin(omega * simTime)) : 0
  const pathCm = Math.round(4 * length * amplitude)

  return (
    <figure className="flex flex-col items-center">
      {view === '3d' ? (
        <Scene3D length={length} mass={mass} angle={angle} theta={theta} turn={turn} />
      ) : (
      <svg
        viewBox="0 0 300 330"
        className="w-full max-w-[22rem]"
        role="img"
        aria-label={t('Pendulum with a {length} cm string and a {mass} g bob, pulled back {angle} degrees', { length, mass, angle })}
      >
        <rect x="60" y="14" width="180" height="10" rx="3" className="fill-slate-700" />
        {/* Protractor */}
        <path d={`M ${ax} ${ay} A ${ARC_R} ${ARC_R} 0 0 0 ${bx2} ${by2}`} fill="none" className="stroke-sky-500" strokeWidth="1.5" />
        {[-20, -15, -10, -5, 0, 5, 10, 15, 20].map((deg) => {
          const [x1, y1] = point(deg % 10 === 0 ? 60 : 64, deg)
          const [x2, y2] = point(ARC_R, deg)
          return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-sky-500" strokeWidth="1.2" />
        })}
        {[-20, 20].map((deg) => {
          const [x, y] = point(88, deg)
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
        {/* Swing path: the arc the bob travels */}
        <path d={`M ${pathStartX} ${pathStartY} A ${length * PX_PER_CM} ${length * PX_PER_CM} 0 0 0 ${pathEndX} ${pathEndY}`} fill="none" className="stroke-sky-600" strokeWidth="1.5" strokeDasharray="4 4" />
        {/* String and bob */}
        <line x1={PIVOT_X} y1={PIVOT_Y} x2={bx} y2={by} className="stroke-slate-800" strokeWidth="2" />
        <circle cx={bx} cy={by} r={radius} className="fill-amber-400 stroke-amber-700" strokeWidth="2" />
        <text x={bx} y={by + 3} textAnchor="middle" className="fill-amber-900 text-[8px] font-semibold">
          {mass}{t('g')}
        </text>
        <circle cx={PIVOT_X} cy={PIVOT_Y} r="4" className="fill-slate-800" />
      </svg>
      )}
      <figcaption className="mt-2 grid w-full max-w-[22rem] grid-cols-2 gap-2 text-center">
        <div className={`rounded-xl bg-slate-900 px-3 py-2 font-mono whitespace-nowrap text-emerald-300 ${lang === 'hi' ? 'text-xl' : 'text-2xl'}`} aria-label={t('Stopwatch')}>
          {clock.toFixed(2)} {t('s')}
        </div>
        <div className="rounded-xl bg-slate-100 px-3 py-2 text-slate-800">
          <span className="block text-xs text-slate-500">{t('Swings counted')}</span>
          <span className="text-xl font-bold">{swings} / 10</span>
        </div>
      </figcaption>
      <div className="mt-2 w-full max-w-[22rem] rounded-xl bg-sky-50 p-3 text-sm">
        <div className="flex justify-between font-medium">
          <span>{t('Speed now')}</span>
          <span className="tabular-nums">{speedNow.toFixed(2)} {t('m/s')}</span>
        </div>
        <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-sky-100" aria-hidden="true">
          <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.min(100, (speedNow / 1.2) * 100)}%` }} />
        </div>
        <p className="mt-1.5 text-slate-700">
          <Rich text={t('Dashed line: the path. One full swing travels about <b>{path} cm</b>, top speed <b>{speed} m/s</b>.', { path: pathCm, speed: topSpeed.toFixed(2) })} />
        </p>
      </div>
    </figure>
  )
}
