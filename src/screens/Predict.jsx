import { useState } from 'react'
import { Button, Card } from '../components/ui.jsx'
import { PREDICTIONS } from '../content.js'
import { logEvent } from '../storage.js'

// Predictions are hypotheses, not a test: no right/wrong is shown here. The lab checks them.
export default function Predict({ learner, update, goTo }) {
  const [answers, setAnswers] = useState(learner.predictions ?? {})
  const complete = PREDICTIONS.every((p) => answers[p.id])

  const save = () => {
    update((l) => ({ ...l, predictions: answers }))
    logEvent(learner, 'predictions', answers)
    goTo('lab')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">What do you think will happen?</h1>
        <p className="mt-1 text-slate-700">There is no wrong answer here. These are your ideas, and we will test them in the lab.</p>
      </div>
      {PREDICTIONS.map((p, i) => (
        <Card key={p.id}>
          <fieldset>
            <legend className="text-lg font-semibold">
              {i + 1}. {p.prompt}
            </legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {p.options.map((o) => (
                <label
                  key={o.id}
                  className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border p-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-indigo-600 ${
                    answers[p.id] === o.id ? 'border-indigo-600 bg-indigo-50 font-semibold' : 'border-slate-300 hover:border-indigo-400'
                  }`}
                >
                  <input
                    type="radio"
                    name={p.id}
                    value={o.id}
                    checked={answers[p.id] === o.id}
                    onChange={() => setAnswers((a) => ({ ...a, [p.id]: o.id }))}
                    className="size-5 accent-indigo-600"
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>
        </Card>
      ))}
      <div className="flex flex-wrap items-center justify-end gap-3">
        {!complete && <p className="text-sm text-slate-600">Answer all three to continue.</p>}
        <Button onClick={save} disabled={!complete}>
          Save my ideas and go to the lab
        </Button>
      </div>
    </div>
  )
}
