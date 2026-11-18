import { CircleCheck, Circle } from 'lucide-react'
import Rich from '../components/Rich.jsx'
import { Button, Card } from '../components/ui.jsx'
import { PREDICTIONS, REAL_LIFE, SESSION_MINUTES } from '../content.js'
import { useLang } from '../lang.js'
import { logEvent } from '../storage.js'

const OBSERVED = { mass: 'About the same time', angle: 'About the same time', length: 'Longer string, longer swing' }

function clock(ms) {
  const total = Math.floor((ms ?? 0) / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

export default function Summary({ learner, update, onStop, goTo }) {
  const { t } = useLang()
  const fair = learner.fairTests ?? {}
  const answers = learner.answers ?? {}
  const fairCount = ['mass', 'angle', 'length'].filter((id) => fair[id]).length
  const predicted = PREDICTIONS.every((p) => learner.predictions?.[p.id])
  const numericRight = answers.numeric?.verdict === 'correct'
  const explainRight = answers.explanation?.label === 'correct'
  // Each tick needs evidence; when it is missing we say exactly what to do and where.
  const outcomes = [
    {
      text: t('Predict and check how length, mass and angle change the period'),
      done: predicted && fairCount === 3,
      todo: predicted ? t('Finish one fair test each for mass, angle and length ({n} of 3 done).', { n: fairCount }) : t('Make all three predictions first.'),
      step: predicted ? 'lab' : 'predict',
      action: predicted ? t('Open the lab') : t('Open Predict'),
    },
    {
      text: t('Design a fair test that changes only one thing'),
      done: fairCount >= 2 && Boolean(answers.fairPair?.correct),
      todo: fairCount < 2 ? t('Finish at least 2 fair tests in the lab ({n} done).', { n: fairCount }) : t('Check Task 2 is not right yet: find the pair where only ONE thing changes.'),
      step: fairCount < 2 ? 'lab' : 'check',
      action: fairCount < 2 ? t('Open the lab') : t('Open Check'),
    },
    {
      text: t('Explain with data, and calculate the period for a 4× shorter string'),
      done: numericRight && explainRight,
      todo: [!numericRight && t('Check Task 1 is not right yet: compare your 100 cm and 25 cm trials.'), !explainRight && t('Check Task 3: explain using numbers from two trials where only the mass changed.')]
        .filter(Boolean)
        .join(' '),
      step: 'check',
      action: t('Open Check'),
    },
  ]

  const base = { time: clock(learner.elapsedMs), total: SESSION_MINUTES, n: learner.trials.length, h: learner.hintsUsed ?? 0 }
  const summaryLine = !base.h
    ? t('Time used: <b>{time}</b> of {total}:00. You ran {n} trials.', base)
    : base.h === 1
      ? t('Time used: <b>{time}</b> of {total}:00. You ran {n} trials and used 1 hint.', base)
      : t('Time used: <b>{time}</b> of {total}:00. You ran {n} trials and used {h} hints.', base)

  const finish = () => {
    update((l) => ({ ...l, completedAt: l.completedAt ?? Date.now() }))
    logEvent(learner, 'complete', { elapsedMs: learner.elapsedMs, outcomes: outcomes.map((o) => o.done) })
    onStop(t('Great work! Your turn is saved. Hand the tablet to the next friend.'))
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card tone="good">
        <h1 className="text-2xl font-bold sm:text-3xl">{t('Great work, {name}!', { name: learner.name })}</h1>
        <p className="mt-1 text-lg">
          <Rich text={summaryLine} />
        </p>
      </Card>
      <Card>
        <h2 className="text-lg font-bold">{t('Your ideas vs your data')}</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left">
            <thead className="text-sm text-slate-500">
              <tr>
                <th className="py-1 pr-3">{t('Change')}</th>
                <th className="pr-3">{t('You predicted')}</th>
                <th className="pr-3">{t('Your fair test showed')}</th>
              </tr>
            </thead>
            <tbody>
              {PREDICTIONS.map((p) => {
                const option = p.options.find((o) => o.id === learner.predictions?.[p.id])
                return (
                  <tr key={p.id} className="border-t border-slate-200">
                    <td className="py-2 pr-3 font-semibold capitalize">{t(p.id)}</td>
                    <td className={`pr-3 ${option && !option.correct ? 'text-amber-700' : ''}`}>{option ? t(option.label) : t('Not answered')}</td>
                    <td className="pr-3">{fair[p.id] ? t(OBSERVED[p.id]) : t('Not tested yet')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <Card>
        <h2 className="text-lg font-bold">{t('What you can now do')}</h2>
        <ul className="mt-2 space-y-2">
          {outcomes.map((o) => (
            <li key={o.text} className="flex items-start gap-2">
              {o.done ? <CircleCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-label={t('achieved')} /> : <Circle className="mt-0.5 size-5 shrink-0 text-slate-400" aria-label={t('not yet')} />}
              <span>
                {o.text}
                {!o.done && (
                  <span className="mt-1 block rounded-lg bg-amber-50 p-2 text-sm text-slate-700">
                    {t('To tick this:')} {o.todo}{' '}
                    <button type="button" className="font-semibold text-indigo-700 underline" onClick={() => goTo(o.step)}>
                      {o.action}
                    </button>
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Card>
      <Card tone="info">
        <h2 className="text-lg font-bold">{t('Where you see this')}</h2>
        <ul className="mt-2 grid gap-2 sm:grid-cols-3">
          {REAL_LIFE.map((r) => (
            <li key={r.title} className="rounded-xl bg-white p-3">
              <p className="font-semibold">{t(r.title)}</p>
              <p className="mt-1 text-sm text-slate-700">{t(r.text)}</p>
            </li>
          ))}
        </ul>
      </Card>
      <div className="flex justify-end">
        <Button variant="success" onClick={finish}>
          {t('Finish and save my turn')}
        </Button>
      </div>
    </div>
  )
}
