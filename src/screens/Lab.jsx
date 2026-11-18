import { useCallback, useState } from 'react'
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'
import { CircleCheck, Lightbulb, Lock, Play, TriangleExclamationPoint } from 'lucide-react'
import Pendulum from '../components/Pendulum.jsx'
import { Button, Card, Key } from '../components/ui.jsx'
import { MISCONCEPTION_FEEDBACK, PREDICTIONS, VARIABLES, variableById } from '../content.js'
import { changedVariables, compareTrials, measureTenSwings, round2 } from '../physics.js'
import { logEvent } from '../storage.js'

const DEFAULT_SETTINGS = { length: 50, mass: 100, angle: 10 }

function names(ids) {
  return ids.map((id) => variableById(id).short).join(' and ')
}

function predictionIsWrong(learner, id) {
  const choice = learner.predictions?.[id]
  const prediction = PREDICTIONS.find((p) => p.id === id)
  return Boolean(choice) && !prediction.options.find((o) => o.id === choice)?.correct
}

export default function Lab({ learner, update, goTo }) {
  const lastTrial = learner.trials.at(-1)
  const [settings, setSettings] = useState(() =>
    lastTrial ? { length: lastTrial.length, mass: lastTrial.mass, angle: lastTrial.angle } : DEFAULT_SETTINGS,
  )
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(4)
  const [result, setResult] = useState(null)
  const [hintLevel, setHintLevel] = useState(0)
  const [helper, setHelper] = useState(null)
  const [helperFrom, setHelperFrom] = useState(null)

  // Adaptivity (learner profile): experiments the learner predicted wrongly come first.
  const wrong = ['mass', 'angle', 'length'].filter((id) => predictionIsWrong(learner, id))
  const order = ['mass', 'angle', 'length'].sort((a, b) => Number(wrong.includes(b)) - Number(wrong.includes(a)))
  const done = learner.fairTests ?? {}
  const remaining = order.filter((id) => !done[id])

  const showHint = (level) => {
    setHintLevel(level)
    update((l) => ({ ...l, hintsUsed: (l.hintsUsed ?? 0) + 1 }))
    logEvent(learner, 'hint', { level })
  }

  const run = () => {
    setResult(null)
    setRunning(true)
    logEvent(learner, 'trial_start', { ...settings, speed })
  }

  const finish = useCallback(() => {
    setRunning(false)
    const tenSwings = measureTenSwings(settings.length)
    const prev = learner.trials.at(-1) ?? null
    const trial = { n: learner.trials.length + 1, ...settings, tenSwings, period: round2(tenSwings / 10), ts: Date.now() }
    const comparison = prev ? compareTrials(prev, trial) : null
    let kind = 'first'
    if (comparison) kind = comparison.changed.length === 0 ? 'repeat' : comparison.changed.length === 1 ? 'fair' : 'unfair'
    update((l) => {
      const next = { ...l, trials: [...l.trials, trial] }
      if (kind === 'fair') {
        const id = comparison.changed[0]
        next.fairTests = { ...l.fairTests, [id]: { from: prev.n, to: trial.n, same: comparison.same } }
      }
      if (kind === 'unfair') next.unfairCount = (l.unfairCount ?? 0) + 1
      return next
    })
    logEvent(learner, kind === 'unfair' ? 'unfair_test' : kind === 'fair' ? 'fair_test' : 'trial', {
      trial,
      changed: comparison?.changed ?? [],
      periodChange: comparison?.diff ?? null,
    })
    setResult({ kind, trial, prev, comparison })
    // Adaptivity (interaction): a second unfair test jumps straight to the fair-test helper.
    if (kind === 'unfair') setHintLevel((learner.unfairCount ?? 0) >= 1 ? 3 : 1)
    else setHintLevel(0)
    if (kind === 'fair') setHelper(null)
  }, [learner, settings, update])

  // Fair-test helper: copy the latest trial and unlock only the chosen variable,
  // so the next run differs from the latest trial in exactly one thing.
  const startHelper = (id) => {
    const base = result.trial
    setSettings({ length: base.length, mass: base.mass, angle: base.angle })
    setHelper(id)
    setHelperFrom(base.n)
    showHint(3)
    logEvent(learner, 'fair_test_helper', { variable: id, copiedTrial: base.n })
  }

  const revise = (id, belief) => {
    update((l) => ({ ...l, revised: { ...l.revised, [id]: belief } }))
    logEvent(learner, 'revise_prediction', { variable: id, belief, earlier: learner.predictions?.[id] ?? null })
  }

  const highlightRows =
    result?.kind === 'unfair' && hintLevel >= 2 ? [result.prev.n, result.trial.n] : []

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card>
          <Pendulum {...settings} running={running} speed={speed} lastTime={lastTrial?.tenSwings} onDone={finish} />
        </Card>
        <Card>
          <h2 className="text-lg font-bold">Set up your experiment</h2>
          {helper && (
            <p className="mt-2 flex items-start gap-2 rounded-xl bg-indigo-50 p-3 text-sm text-indigo-900">
              <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                Fair-test helper is on: only the <b>{variableById(helper).short}</b> can change. The other sliders are locked
                to trial {helperFrom}.{' '}
                <button type="button" className="font-semibold underline" onClick={() => setHelper(null)}>
                  Turn off
                </button>
              </span>
            </p>
          )}
          <div className="mt-4 space-y-5">
            {VARIABLES.map((v) => {
              const locked = running || (helper !== null && helper !== v.id)
              return (
                <label key={v.id} className="block">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-medium">
                      {v.name} <span className="text-sm text-slate-500">({v.hindi})</span>
                    </span>
                    <span className="flex items-center gap-1 text-lg font-bold tabular-nums">
                      {locked && !running && <Lock className="size-4 text-slate-400" aria-label="locked" />}
                      {settings[v.id]}
                      {v.unit === '°' ? '°' : ` ${v.unit}`}
                    </span>
                  </span>
                  <input
                    type="range"
                    min={v.min}
                    max={v.max}
                    step={v.step}
                    value={settings[v.id]}
                    disabled={locked}
                    onChange={(e) => setSettings((s) => ({ ...s, [v.id]: Number(e.target.value) }))}
                    className="mt-2 h-8 w-full accent-indigo-600 disabled:opacity-40"
                    aria-label={v.name}
                  />
                </label>
              )
            })}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button onClick={run} disabled={running} className="flex-1">
              <Play className="size-5" aria-hidden="true" /> {running ? 'Timing 10 swings…' : 'Run 10 swings'}
            </Button>
            <div className="flex rounded-xl border border-slate-300 p-1 text-sm" role="group" aria-label="Animation speed">
              {[1, 4].map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={running}
                  onClick={() => setSpeed(s)}
                  aria-pressed={speed === s}
                  className={`rounded-lg px-3 py-1.5 font-medium ${speed === s ? 'bg-indigo-600 text-white' : 'text-slate-700'}`}
                >
                  {s === 1 ? 'Real speed' : '4× faster'}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card tone="info">
          <h2 className="text-lg font-bold">Your experiments</h2>
          <p className="mt-1 text-slate-700">
            {wrong.length
              ? `You predicted that the ${names(wrong)} would work differently, so let’s test ${variableById(order[0]).short} first.`
              : 'Your predictions look strong. Test each one to be sure.'}{' '}
            For each test, change <Key>only one thing</Key> between two trials.
          </p>
          <ol className="mt-3 space-y-2">
            {order.map((id, i) => (
              <li key={id} className="flex items-center gap-2">
                {done[id] ? (
                  <CircleCheck className="size-5 text-emerald-600" aria-label="done" />
                ) : (
                  <span className="grid size-5 place-items-center rounded-full border-2 border-slate-400 text-xs font-bold">{i + 1}</span>
                )}
                <span className={done[id] ? 'text-slate-500 line-through' : 'font-medium'}>
                  Test the {variableById(id).short}: change only the {variableById(id).short}
                </span>
              </li>
            ))}
          </ol>
          {Object.keys(done).length > 0 && (
            <p className="mt-3 text-sm text-slate-700">
              Challenge: try 25 cm and then 100 cm. Is the period 4 times longer, or less?
            </p>
          )}
        </Card>

        {result && <ResultCard result={result} learner={learner} hintLevel={hintLevel} showHint={showHint} startHelper={startHelper} revise={revise} />}

        <Card>
          <h2 className="text-lg font-bold">Your data table</h2>
          {learner.trials.length === 0 ? (
            <p className="mt-2 text-slate-600">No trials yet. Press “Run 10 swings” to time your first trial.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[30rem] text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="py-1 pr-2">Trial</th>
                    <th className="pr-2">Length</th>
                    <th className="pr-2">Mass</th>
                    <th className="pr-2">Angle</th>
                    <th className="pr-2">10 swings</th>
                    <th>Period (one swing)</th>
                  </tr>
                </thead>
                <tbody>
                  {learner.trials.map((t, i) => {
                    const changed = i > 0 ? changedVariables(learner.trials[i - 1], t) : []
                    const cell = (id) => (changed.includes(id) ? 'bg-amber-200 font-semibold' : '')
                    return (
                      <tr key={t.n} className={`border-t border-slate-200 ${highlightRows.includes(t.n) ? 'bg-rose-100' : ''}`}>
                        <td className="py-1.5 pr-2 font-semibold">{t.n}</td>
                        <td className={`pr-2 ${cell('length')}`}>{t.length} cm</td>
                        <td className={`pr-2 ${cell('mass')}`}>{t.mass} g</td>
                        <td className={`pr-2 ${cell('angle')}`}>{t.angle}°</td>
                        <td className="pr-2 tabular-nums">{t.tenSwings.toFixed(2)} s</td>
                        <td className="font-bold tabular-nums">{t.period.toFixed(2)} s</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <p className="mt-2 text-xs text-slate-500">Yellow cells changed since the trial above.</p>
            </div>
          )}
        </Card>

        {learner.trials.length > 1 && (
          <Card>
            <h2 className="text-lg font-bold">Graph: period vs length</h2>
            <div className="mt-2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 8, right: 12, bottom: 18, left: 0 }}>
                  <CartesianGrid stroke="#e2e8f0" />
                  <XAxis type="number" dataKey="length" name="Length" unit=" cm" domain={[0, 100]} label={{ value: 'String length (cm)', position: 'insideBottom', offset: -10 }} />
                  <YAxis type="number" dataKey="period" name="Period" unit=" s" domain={[0, 2.2]} width={52} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={learner.trials} fill="#4f46e5" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant={remaining.length ? 'secondary' : 'success'} onClick={() => goTo('check')} disabled={running}>
            {remaining.length ? `Go to Check (${remaining.length} test${remaining.length > 1 ? 's' : ''} left)` : 'All 3 fair tests done: go to Check'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ResultCard({ result, learner, hintLevel, showHint, startHelper, revise }) {
  const { kind, trial, prev, comparison } = result

  if (kind === 'first') {
    return (
      <Card tone="info" aria-live="polite">
        <p>
          Trial 1 is saved. 10 swings took <b>{trial.tenSwings.toFixed(2)} s</b>, so one swing (the <Key>period</Key>) is{' '}
          <b>{trial.period.toFixed(2)} s</b>. Now change <Key>one thing</Key> and run again.
        </p>
      </Card>
    )
  }

  if (kind === 'repeat') {
    return (
      <Card tone="info" aria-live="polite">
        <p>
          Same settings as trial {prev.n}. The period is {trial.period.toFixed(2)} s (it was {prev.period.toFixed(2)} s). Repeating a
          trial checks your timing. Now change one thing.
        </p>
      </Card>
    )
  }

  if (kind === 'unfair') {
    // Design challenge: support learning from an unsuccessful experiment without revealing the answer.
    return (
      <Card tone="warn" aria-live="polite">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <TriangleExclamationPoint className="size-5 text-amber-600" aria-hidden="true" /> Not a fair test yet
        </h3>
        <p className="mt-1">
          Between trial {prev.n} and trial {trial.n} you changed the <b>{names(comparison.changed)}</b>. The period went from{' '}
          {prev.period.toFixed(2)} s to {trial.period.toFixed(2)} s, but we cannot tell which change caused it.
        </p>
        <div className="mt-3 space-y-3 border-t border-amber-200 pt-3">
          <p className="flex gap-2">
            <Lightbulb className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
            <span>
              <b>Hint 1:</b> Which ONE thing do you want to test? Start from trial {trial.n} and change only that one thing.
            </span>
          </p>
          {hintLevel >= 2 && (
            <p className="flex gap-2">
              <Lightbulb className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
              <span>
                <b>Hint 2:</b> Look at rows {prev.n} and {trial.n} in your table (shaded red). The yellow cells changed. In a fair
                test, only ONE cell is yellow.
              </span>
            </p>
          )}
          {hintLevel >= 3 && (
            <div className="flex gap-2">
              <Lightbulb className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
              <div>
                <p>
                  <b>Hint 3: fair-test helper.</b> We copy trial {trial.n} and unlock only the thing you choose to test. Change it and run again:
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {comparison.changed.map((id) => (
                    <Button key={id} variant="secondary" onClick={() => startHelper(id)}>
                      Test only the {variableById(id).short}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {hintLevel < 3 && (
            <Button variant="ghost" onClick={() => showHint(hintLevel + 1)}>
              Show the next hint
            </Button>
          )}
        </div>
      </Card>
    )
  }

  // Fair test: compare the result with the learner's prediction and invite a revised hypothesis.
  const id = comparison.changed[0]
  const variable = variableById(id)
  const observed = comparison.same ? 'same' : trial.period > prev.period ? 'more' : 'less'
  let expected = learner.predictions?.[id]
  if (id === 'length' && expected && trial.length < prev.length) {
    expected = expected === 'more' ? 'less' : expected === 'less' ? 'more' : 'same'
  }
  const matches = expected === observed
  const misconception = id === 'mass' ? 'M1' : id === 'angle' ? 'M2' : null
  const revised = learner.revised?.[id]

  return (
    <Card tone="good" aria-live="polite">
      <h3 className="flex items-center gap-2 text-lg font-bold">
        <CircleCheck className="size-5 text-emerald-600" aria-hidden="true" /> Fair test of the {variable.short}
      </h3>
      <p className="mt-1">
        You changed only the {variable.short} ({prev[id]} {variable.unit} → {trial[id]} {variable.unit}) and kept the rest the same.
      </p>
      <p className="mt-2 text-lg">
        Period: <b>{prev.period.toFixed(2)} s</b> → <b>{trial.period.toFixed(2)} s</b>:{' '}
        <Key>
          {observed === 'same' ? 'about the same' : observed === 'more' ? 'longer' : 'shorter'}
        </Key>
        {observed === 'same' && <span className="text-sm text-slate-600"> (the difference is smaller than stopwatch error)</span>}
      </p>
      {expected &&
        (matches ? (
          <p className="mt-2 font-medium text-emerald-800">This matches your prediction. Well done, scientist!</p>
        ) : (
          <div className="mt-3 rounded-xl bg-white p-3">
            <p>
              Your prediction was different. {misconception && observed === 'same' ? MISCONCEPTION_FEEDBACK[misconception] : 'Your data is the boss: a longer string gives a longer period.'}
            </p>
            {revised ? (
              <p className="mt-2 font-medium text-indigo-800">
                {revised === 'changed-mind' ? 'You updated your idea. That is what scientists do!' : 'Fine: run another fair test to be sure.'}
              </p>
            ) : (
              <div className="mt-2">
                <p className="font-medium">What do you think now?</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="success" onClick={() => revise(id, 'changed-mind')}>
                    My data changed my idea
                  </Button>
                  <Button variant="secondary" onClick={() => revise(id, 'test-again')}>
                    I want to test again
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
    </Card>
  )
}
