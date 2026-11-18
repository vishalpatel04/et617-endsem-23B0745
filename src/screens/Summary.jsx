import { CircleCheck, Circle } from 'lucide-react'
import { Button, Card } from '../components/ui.jsx'
import { PREDICTIONS, SESSION_MINUTES } from '../content.js'
import { logEvent } from '../storage.js'

const OBSERVED = { mass: 'About the same time', angle: 'About the same time', length: 'Longer string, longer swing' }

function clock(ms) {
  const total = Math.floor((ms ?? 0) / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

export default function Summary({ learner, update, onStop }) {
  const fair = learner.fairTests ?? {}
  const answers = learner.answers ?? {}
  const outcomes = [
    { text: 'Predict and check how length, mass and angle change the period', done: PREDICTIONS.every((p) => learner.predictions?.[p.id]) && ['mass', 'angle', 'length'].every((id) => fair[id]) },
    { text: 'Design a fair test that changes only one thing', done: Object.keys(fair).length >= 2 && answers.fairPair?.correct },
    { text: 'Explain with data, and calculate the period for a 4× shorter string', done: answers.numeric?.verdict === 'correct' && answers.explanation?.label === 'correct' },
  ]

  const finish = () => {
    update((l) => ({ ...l, completedAt: l.completedAt ?? Date.now() }))
    logEvent(learner, 'complete', { elapsedMs: learner.elapsedMs, outcomes: outcomes.map((o) => o.done) })
    onStop('Great work! Your turn is saved. Hand the tablet to the next friend.')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card tone="good">
        <h1 className="text-2xl font-bold sm:text-3xl">Great work, {learner.name}!</h1>
        <p className="mt-1 text-lg">
          Time used: <b>{clock(learner.elapsedMs)}</b> of {SESSION_MINUTES}:00. You ran {learner.trials.length} trials
          {learner.hintsUsed ? ` and used ${learner.hintsUsed} hint${learner.hintsUsed > 1 ? 's' : ''}` : ''}.
        </p>
      </Card>
      <Card>
        <h2 className="text-lg font-bold">Your ideas vs your data</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left">
            <thead className="text-sm text-slate-500">
              <tr>
                <th className="py-1 pr-3">Change</th>
                <th className="pr-3">You predicted</th>
                <th className="pr-3">Your fair test showed</th>
              </tr>
            </thead>
            <tbody>
              {PREDICTIONS.map((p) => {
                const option = p.options.find((o) => o.id === learner.predictions?.[p.id])
                return (
                  <tr key={p.id} className="border-t border-slate-200">
                    <td className="py-2 pr-3 font-semibold capitalize">{p.id}</td>
                    <td className={`pr-3 ${option && !option.correct ? 'text-amber-700' : ''}`}>{option?.label ?? 'Not answered'}</td>
                    <td className="pr-3">{fair[p.id] ? OBSERVED[p.id] : 'Not tested yet'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <Card>
        <h2 className="text-lg font-bold">What you can now do</h2>
        <ul className="mt-2 space-y-2">
          {outcomes.map((o) => (
            <li key={o.text} className="flex items-start gap-2">
              {o.done ? <CircleCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-label="achieved" /> : <Circle className="mt-0.5 size-5 shrink-0 text-slate-400" aria-label="not yet" />}
              <span>{o.text}</span>
            </li>
          ))}
        </ul>
      </Card>
      <div className="flex justify-end">
        <Button variant="success" onClick={finish}>
          Finish and save my turn
        </Button>
      </div>
    </div>
  )
}
