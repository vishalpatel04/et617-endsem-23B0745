import { useCallback, useState } from 'react'
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'
import { CircleCheck, Lightbulb, Lock, Play, TriangleExclamationPoint } from 'lucide-react'
import Pendulum from '../components/Pendulum.jsx'
import RacePendulums from '../components/RacePendulums.jsx'
import Rich from '../components/Rich.jsx'
import { Button, Card, Key } from '../components/ui.jsx'
import { MISCONCEPTION_FEEDBACK, PREDICTIONS, VARIABLES, variableById } from '../content.js'
import { useLang } from '../lang.js'
import { changedVariables, compareTrials, measureTenSwings, round2 } from '../physics.js'
import { logEvent } from '../storage.js'

const DEFAULT_SETTINGS = { length: 50, mass: 100, angle: 10 }

// Variable names in the learner's language (length / mass / angle), joined with "and".
function vname(t, id) {
  return t(variableById(id).short)
}

function joinNames(t, ids) {
  return ids.map((id) => vname(t, id)).join(t(' and '))
}

function predictionIsWrong(learner, id) {
  const choice = learner.predictions?.[id]
  const prediction = PREDICTIONS.find((p) => p.id === id)
  return Boolean(choice) && !prediction.options.find((o) => o.id === choice)?.correct
}

export default function Lab({ learner, update, goTo }) {
  const { t, lang } = useLang()
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
  const [mode, setMode] = useState('lab')
  const [view, setView] = useState('2d')
  const [turn, setTurn] = useState(35)
  const [plotVar, setPlotVar] = useState('length')

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

  const tabs = (
    <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label={t('Lab views')}>
      {[
        ['lab', t('My fair tests')],
        ['race', t('Race two pendulums')],
      ].map(([id, label]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={mode === id}
          disabled={running}
          onClick={() => {
            setMode(id)
            logEvent(learner, 'lab_view', { view: id })
          }}
          className={`min-h-11 rounded-xl px-4 font-semibold ${mode === id ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-white text-slate-800 hover:bg-indigo-50'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )

  if (mode === 'race') {
    return (
      <div>
        {tabs}
        <RacePendulums learner={learner} speed={speed} />
      </div>
    )
  }

  return (
    <div>
    {tabs}
    <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex rounded-xl border border-slate-300 p-1 text-sm" role="group" aria-label={t('View')}>
              {[
                ['2d', t('2D: measure')],
                ['3d', t('3D view')],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setView(id)
                    logEvent(learner, 'pendulum_view', { view: id })
                  }}
                  aria-pressed={view === id}
                  className={`rounded-lg px-3 py-1.5 font-medium ${view === id ? 'bg-indigo-600 text-white' : 'text-slate-700'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {view === '3d' && (
              <label className="flex items-center gap-2 text-sm font-medium">
                {t('Turn the view')}
                <input type="range" min="0" max="75" step="5" value={turn} onChange={(e) => setTurn(Number(e.target.value))} className="w-28 accent-indigo-600" aria-label={t('Turn the 3D view')} />
              </label>
            )}
          </div>
          <Pendulum {...settings} running={running} speed={speed} lastTime={lastTrial?.tenSwings} onDone={finish} view={view} turn={turn} />
          {view === '3d' && <p className="mt-2 text-center text-xs text-slate-500">{t('Switch to 2D to read the ruler and protractor.')}</p>}
        </Card>
        <Card>
          <h2 className="text-lg font-bold">{t('Set up your experiment')}</h2>
          {helper && (
            <p className="mt-2 flex items-start gap-2 rounded-xl bg-indigo-50 p-3 text-sm text-indigo-900">
              <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                <Rich text={t('Fair-test helper is on: only the <b>{v}</b> can change. The other sliders are locked to trial {n}.', { v: vname(t, helper), n: helperFrom })} />{' '}
                <button type="button" className="font-semibold underline" onClick={() => setHelper(null)}>
                  {t('Turn off')}
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
                      {t(v.name)} {lang === 'en' && <span className="text-sm text-slate-500">({v.hindi})</span>}
                    </span>
                    <span className="flex items-center gap-1 text-lg font-bold tabular-nums">
                      {locked && !running && <Lock className="size-4 text-slate-400" aria-label={t('locked')} />}
                      {settings[v.id]}
                      {v.unit === '°' ? '°' : ` ${t(v.unit)}`}
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
                    aria-label={t(v.name)}
                  />
                </label>
              )
            })}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button onClick={run} disabled={running} className="min-w-44 flex-1 whitespace-nowrap">
              <Play className="size-5" aria-hidden="true" /> {running ? t('Timing 10 swings…') : t('Run 10 swings')}
            </Button>
            <div className="flex rounded-xl border border-slate-300 p-1 text-sm" role="group" aria-label={t('Animation speed')}>
              {[1, 4].map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={running}
                  onClick={() => setSpeed(s)}
                  aria-pressed={speed === s}
                  className={`rounded-lg px-3 py-1.5 font-medium ${speed === s ? 'bg-indigo-600 text-white' : 'text-slate-700'}`}
                >
                  {s === 1 ? t('Real speed') : t('4× faster')}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card tone="info">
          <h2 className="text-lg font-bold">{t('Your experiments')}</h2>
          <p className="mt-1 text-slate-700">
            {wrong.length
              ? t('You predicted that the {names} would work differently, so let’s test {first} first.', { names: joinNames(t, wrong), first: vname(t, order[0]) })
              : t('Your predictions look strong. Test each one to be sure.')}{' '}
            <Rich text={t('For each test, change <k>only one thing</k> between two trials.')} />
          </p>
          <ol className="mt-3 space-y-2">
            {order.map((id, i) => (
              <li key={id} className="flex items-center gap-2">
                {done[id] ? (
                  <CircleCheck className="size-5 text-emerald-600" aria-label={t('done')} />
                ) : (
                  <span className="grid size-5 place-items-center rounded-full border-2 border-slate-400 text-xs font-bold">{i + 1}</span>
                )}
                <span className={done[id] ? 'text-slate-500 line-through' : 'font-medium'}>
                  {t('Test the {v}: change only the {v}', { v: vname(t, id) })}
                </span>
              </li>
            ))}
          </ol>
          {Object.keys(done).length > 0 && (
            <p className="mt-3 text-sm text-slate-700">
              {t('Challenge: try 25 cm and then 100 cm. Is the period 4 times longer, or less?')}
            </p>
          )}
        </Card>

        {result && <ResultCard result={result} learner={learner} hintLevel={hintLevel} showHint={showHint} startHelper={startHelper} revise={revise} />}

        <Card>
          <h2 className="text-lg font-bold">{t('Your data table')}</h2>
          {learner.trials.length === 0 ? (
            <p className="mt-2 text-slate-600">{t('No trials yet. Press “Run 10 swings” to time your first trial.')}</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[30rem] text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="py-1 pr-2">{t('Trial')}</th>
                    <th className="pr-2">{t('Length')}</th>
                    <th className="pr-2">{t('Mass')}</th>
                    <th className="pr-2">{t('Angle')}</th>
                    <th className="pr-2">{t('10 swings')}</th>
                    <th>{t('Period (one swing)')}</th>
                  </tr>
                </thead>
                <tbody>
                  {learner.trials.map((tr, i) => {
                    const changed = i > 0 ? changedVariables(learner.trials[i - 1], tr) : []
                    const cell = (id) => (changed.includes(id) ? 'bg-amber-200 font-semibold' : '')
                    return (
                      <tr key={tr.n} className={`border-t border-slate-200 ${highlightRows.includes(tr.n) ? 'bg-rose-100' : ''}`}>
                        <td className="py-1.5 pr-2 font-semibold">{tr.n}</td>
                        <td className={`pr-2 ${cell('length')}`}>{tr.length} {t('cm')}</td>
                        <td className={`pr-2 ${cell('mass')}`}>{tr.mass} {t('g')}</td>
                        <td className={`pr-2 ${cell('angle')}`}>{tr.angle}°</td>
                        <td className="pr-2 tabular-nums">{tr.tenSwings.toFixed(2)} {t('s')}</td>
                        <td className="font-bold tabular-nums">{tr.period.toFixed(2)} {t('s')}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <p className="mt-2 text-xs text-slate-500">{t('Yellow cells changed since the trial above.')}</p>
            </div>
          )}
        </Card>

        {learner.trials.length > 1 && (
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold">{t('Graph: period vs {v}', { v: vname(t, plotVar) })}</h2>
              <div className="flex rounded-xl border border-slate-300 p-1 text-sm" role="group" aria-label={t('Plot period against')}>
                {VARIABLES.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setPlotVar(v.id)
                      logEvent(learner, 'graph_axis', { variable: v.id })
                    }}
                    aria-pressed={plotVar === v.id}
                    className={`rounded-lg px-3 py-1.5 font-medium capitalize ${plotVar === v.id ? 'bg-indigo-600 text-white' : 'text-slate-700'}`}
                  >
                    {t(v.short)}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 8, right: 12, bottom: 18, left: 0 }}>
                  <CartesianGrid stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    dataKey={plotVar}
                    name={t(variableById(plotVar).name)}
                    unit={plotVar === 'angle' ? '°' : ` ${t(variableById(plotVar).unit)}`}
                    domain={[0, variableById(plotVar).max]}
                    label={{ value: `${t(variableById(plotVar).name)} (${t(variableById(plotVar).unit)})`, position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis type="number" dataKey="period" name={t('Period')} unit={` ${t('s')}`} domain={[0, 2.2]} width={lang === 'hi' ? 96 : 64} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={learner.trials} fill="#4f46e5" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {plotVar === 'length'
                ? t('How to read it: do the points rise as the string gets longer? Do they rise in a straight line, or do they bend?')
                : t('How to read it: if the points make a flat line, the period does not depend on the {v}. If they rise or fall, it does.', { v: vname(t, plotVar) })}
            </p>
          </Card>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant={remaining.length ? 'secondary' : 'success'} onClick={() => goTo('check')} disabled={running}>
            {remaining.length === 0 ? t('All 3 fair tests done: go to Check') : remaining.length === 1 ? t('Go to Check (1 test left)') : t('Go to Check ({n} tests left)', { n: remaining.length })}
          </Button>
        </div>
      </div>
    </div>
    </div>
  )
}

function ResultCard({ result, learner, hintLevel, showHint, startHelper, revise }) {
  const { t } = useLang()
  const { kind, trial, prev, comparison } = result

  if (kind === 'first') {
    return (
      <Card tone="info" aria-live="polite">
        <p>
          <Rich text={t('Trial 1 is saved. 10 swings took <b>{ten} s</b>, so one swing (the <k>period</k>) is <b>{p} s</b>. Now change <k>one thing</k> and run again.', { ten: trial.tenSwings.toFixed(2), p: trial.period.toFixed(2) })} />
        </p>
      </Card>
    )
  }

  if (kind === 'repeat') {
    return (
      <Card tone="info" aria-live="polite">
        <p>{t('Same settings as trial {n}. The period is {a} s (it was {b} s). Repeating a trial checks your timing. Now change one thing.', { n: prev.n, a: trial.period.toFixed(2), b: prev.period.toFixed(2) })}</p>
      </Card>
    )
  }

  if (kind === 'unfair') {
    // Design challenge: support learning from an unsuccessful experiment without revealing the answer.
    return (
      <Card tone="warn" aria-live="polite">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <TriangleExclamationPoint className="size-5 text-amber-600" aria-hidden="true" /> {t('Not a fair test yet')}
        </h3>
        <p className="mt-1">
          <Rich text={t('Between trial {a} and trial {b} you changed the <b>{names}</b>. The period went from {p1} s to {p2} s, but we cannot tell which change caused it.', { a: prev.n, b: trial.n, names: joinNames(t, comparison.changed), p1: prev.period.toFixed(2), p2: trial.period.toFixed(2) })} />
        </p>
        <div className="mt-3 space-y-3 border-t border-amber-200 pt-3">
          <p className="flex gap-2">
            <Lightbulb className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
            <span>
              <Rich text={t('<b>Hint 1:</b> Which ONE thing do you want to test? Start from trial {n} and change only that one thing.', { n: trial.n })} />
            </span>
          </p>
          {hintLevel >= 2 && (
            <p className="flex gap-2">
              <Lightbulb className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
              <span>
                <Rich text={t('<b>Hint 2:</b> Look at rows {a} and {b} in your table (shaded red). The yellow cells changed. In a fair test, only ONE cell is yellow.', { a: prev.n, b: trial.n })} />
              </span>
            </p>
          )}
          {hintLevel >= 3 && (
            <div className="flex gap-2">
              <Lightbulb className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
              <div>
                <p>
                  <Rich text={t('<b>Hint 3: fair-test helper.</b> We copy trial {n} and unlock only the thing you choose to test. Change it and run again:', { n: trial.n })} />
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {comparison.changed.map((id) => (
                    <Button key={id} variant="secondary" onClick={() => startHelper(id)}>
                      {t('Test only the {v}', { v: vname(t, id) })}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {hintLevel < 3 && (
            <Button variant="ghost" onClick={() => showHint(hintLevel + 1)}>
              {t('Show the next hint')}
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
        <CircleCheck className="size-5 text-emerald-600" aria-hidden="true" /> {t('Fair test of the {v}', { v: vname(t, id) })}
      </h3>
      <p className="mt-1">
        {t('You changed only the {v} ({a} {u} → {b} {u}) and kept the rest the same.', { v: vname(t, id), a: prev[id], b: trial[id], u: variable.unit === '°' ? '°' : t(variable.unit) })}
      </p>
      <p className="mt-2 text-lg">
        <Rich text={t('Period: <b>{a} s</b> → <b>{b} s</b>:', { a: prev.period.toFixed(2), b: trial.period.toFixed(2) })} />{' '}
        <Key>{observed === 'same' ? t('about the same') : observed === 'more' ? t('longer') : t('shorter')}</Key>
        {observed === 'same' && <span className="text-sm text-slate-600"> {t('(the difference is smaller than stopwatch error)')}</span>}
      </p>
      {expected &&
        (matches ? (
          <p className="mt-2 font-medium text-emerald-800">{t('This matches your prediction. Well done, scientist!')}</p>
        ) : (
          <div className="mt-3 rounded-xl bg-white p-3">
            <p>
              {t('Your prediction was different.')} {misconception && observed === 'same' ? t(MISCONCEPTION_FEEDBACK[misconception]) : t('Your data is the boss: a longer string gives a longer period.')}
            </p>
            {revised ? (
              <p className="mt-2 font-medium text-indigo-800">
                {revised === 'changed-mind' ? t('You updated your idea. That is what scientists do!') : t('Fine: run another fair test to be sure.')}
              </p>
            ) : (
              <div className="mt-2">
                <p className="font-medium">{t('What do you think now?')}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="success" onClick={() => revise(id, 'changed-mind')}>
                    {t('My data changed my idea')}
                  </Button>
                  <Button variant="secondary" onClick={() => revise(id, 'test-again')}>
                    {t('I want to test again')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
    </Card>
  )
}
