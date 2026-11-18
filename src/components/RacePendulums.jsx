import { useEffect, useRef, useState } from 'react'
import { Flag, Play } from 'lucide-react'
import { MISCONCEPTION_FEEDBACK, RACE_GUESSES, RACES } from '../content.js'
import { idealPeriod, round2 } from '../physics.js'
import { logEvent } from '../storage.js'
import { Button, Card, Key } from './ui.jsx'

const PX_PER_CM = 2.4
const PIVOT_Y = 26
const PIVOTS = { a: 85, b: 235 }

function bobAt(pivotX, lengthCm, degrees) {
  const rad = (degrees * Math.PI) / 180
  const L = lengthCm * PX_PER_CM
  return [pivotX + L * Math.sin(rad), PIVOT_Y + L * Math.cos(rad)]
}

// Contrasting cases: two pendulums start together, differing in only one thing.
export default function RacePendulums({ learner, speed }) {
  const [raceId, setRaceId] = useState(RACES[0].id)
  const [guess, setGuess] = useState(null)
  const [running, setRunning] = useState(false)
  const [t, setT] = useState(0)
  const [result, setResult] = useState(null)
  const finishRef = useRef(null)

  const race = RACES.find((r) => r.id === raceId)
  const periods = { a: idealPeriod(race.a.length), b: idealPeriod(race.b.length) }
  const total = 10 * Math.max(periods.a, periods.b)

  useEffect(() => {
    if (!running) return undefined
    let frame = 0
    let last = performance.now()
    let sim = 0
    const tick = (now) => {
      sim = Math.min(sim + (Math.min(now - last, 50) / 1000) * speed, total)
      last = now
      setT(sim)
      if (sim >= total) {
        finishRef.current?.()
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running, speed, total])

  useEffect(() => {
    finishRef.current = () => {
      setRunning(false)
      const timeA = round2(10 * periods.a)
      const timeB = round2(10 * periods.b)
      const winner = Math.abs(timeA - timeB) < 0.3 ? 'together' : timeA < timeB ? 'a' : 'b'
      setResult({ winner, timeA, timeB })
      logEvent(learner, 'race_result', { race: race.id, guess, winner })
    }
  })

  const choose = (id) => {
    if (running) return
    setRaceId(id)
    setGuess(null)
    setResult(null)
    setT(0)
  }

  const start = () => {
    setResult(null)
    setT(0)
    setRunning(true)
    logEvent(learner, 'race_start', { race: race.id, guess })
  }

  const swingsOf = (id) => Math.min(10, Math.floor((running || result ? t : 0) / periods[id] + 1e-6))
  const thetaOf = (id) => {
    const p = race[id]
    if (!running || t >= 10 * periods[id]) return p.angle
    return p.angle * Math.cos((2 * Math.PI * t) / periods[id])
  }
  const right = result && guess === result.winner

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      <Card>
        <svg viewBox="0 0 320 300" className="w-full" role="img" aria-label={`Race: ${race.label}`}>
          <rect x="20" y="14" width="280" height="10" rx="3" className="fill-slate-700" />
          {['a', 'b'].map((id) => {
            const p = race[id]
            const [bx, by] = bobAt(PIVOTS[id], p.length, thetaOf(id))
            const radius = 8 + p.mass / 40
            const finished = swingsOf(id) >= 10
            return (
              <g key={id}>
                <line x1={PIVOTS[id]} y1={PIVOT_Y} x2={PIVOTS[id]} y2={PIVOT_Y + 250} strokeDasharray="4 5" className="stroke-slate-300" />
                <line x1={PIVOTS[id]} y1={PIVOT_Y} x2={bx} y2={by} className="stroke-slate-800" strokeWidth="2" />
                <circle cx={bx} cy={by} r={radius} className={finished ? 'fill-emerald-400 stroke-emerald-700' : 'fill-amber-400 stroke-amber-700'} strokeWidth="2" />
                <text x={bx} y={by + 4} textAnchor="middle" className="fill-slate-900 text-[11px] font-bold">
                  {id.toUpperCase()}
                </text>
                <circle cx={PIVOTS[id]} cy={PIVOT_Y} r="4" className="fill-slate-800" />
              </g>
            )
          })}
        </svg>
        <div className="mt-2 grid grid-cols-2 gap-2 text-center">
          {['a', 'b'].map((id) => (
            <div key={id} className={`rounded-xl p-2 ${swingsOf(id) >= 10 ? 'bg-emerald-100' : 'bg-slate-100'}`}>
              <p className="text-sm font-semibold">
                {id.toUpperCase()}: {race[id].length} cm, {race[id].mass} g, {race[id].angle}°
              </p>
              <p className="text-xl font-bold">
                {swingsOf(id)} / 10 swings {swingsOf(id) >= 10 && <Flag className="inline size-5 text-emerald-700" aria-label="finished" />}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        <Card tone="info">
          <h2 className="text-lg font-bold">Race two pendulums</h2>
          <p className="mt-1">
            Both start at the same moment. In each race only <Key>one thing</Key> is different. Choose a race and predict the winner.
          </p>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Choose a race">
            {RACES.map((r) => (
              <button
                key={r.id}
                type="button"
                disabled={running}
                onClick={() => choose(r.id)}
                aria-pressed={raceId === r.id}
                className={`rounded-xl border px-3 py-2 font-medium ${raceId === r.id ? 'border-indigo-600 bg-white text-indigo-800' : 'border-indigo-200 text-slate-700 hover:bg-white'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold">Your prediction: which pendulum finishes 10 swings first?</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-3" role="group" aria-label="Your prediction">
            {RACE_GUESSES.map((g) => (
              <button
                key={g.id}
                type="button"
                disabled={running}
                onClick={() => setGuess(g.id)}
                aria-pressed={guess === g.id}
                className={`min-h-12 rounded-xl border p-2 font-medium ${guess === g.id ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-300 hover:border-indigo-400'}`}
              >
                {g.label}
              </button>
            ))}
          </div>
          <Button className="mt-3" onClick={start} disabled={!guess || running}>
            <Play className="size-5" aria-hidden="true" /> {running ? 'Racing…' : 'Start the race'}
          </Button>
          {!guess && <p className="mt-2 text-sm text-slate-600">Make a prediction to start.</p>}
        </Card>

        {result && (
          <Card tone={right ? 'good' : 'warn'} aria-live="polite">
            <p className="text-lg font-bold">
              {result.winner === 'together' ? 'They finished together!' : `${result.winner.toUpperCase()} finished first!`}{' '}
              <span className="font-normal">
                (A: {result.timeA.toFixed(1)} s, B: {result.timeB.toFixed(1)} s for 10 swings)
              </span>
            </p>
            <p className="mt-1 font-medium">{right ? 'Your prediction was right.' : 'Your prediction was different. That is how we learn!'}</p>
            <p className="mt-2">{race.explain}</p>
            {!right && race.misconception && <p className="mt-2 text-slate-700">{MISCONCEPTION_FEEDBACK[race.misconception]}</p>}
          </Card>
        )}
      </div>
    </div>
  )
}
