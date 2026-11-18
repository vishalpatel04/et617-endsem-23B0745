import { useState } from 'react'
import { UserRound } from 'lucide-react'
import { Button, Card } from '../components/ui.jsx'
import { APP_NAME, SESSION_MINUTES, STEPS } from '../content.js'
import { listLearners, newLearner, saveLearner } from '../storage.js'

function minutes(ms) {
  const total = Math.floor((ms ?? 0) / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

// Shared tablet: each child picks their own name and continues where they stopped.
export default function Start({ onOpen, notice }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const learners = listLearners().sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))

  const create = (event) => {
    event.preventDefault()
    const clean = name.trim()
    if (clean.length < 2) {
      setError('Type your name (at least 2 letters).')
      return
    }
    const learner = newLearner(clean)
    saveLearner(learner)
    onOpen(learner, true)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-3xl font-bold sm:text-4xl">{APP_NAME}</h1>
        <p className="mt-2 text-lg text-slate-700">
          A virtual swing lab. In one {SESSION_MINUTES}-minute turn you predict, experiment with a pendulum, and check what you found.
        </p>
      </div>
      {notice && (
        <Card tone="good" role="status">
          <p className="font-medium">{notice}</p>
        </Card>
      )}
      <Card>
        <h2 className="text-xl font-bold">Who is using the tablet now?</h2>
        <p className="mt-1 text-slate-600">This tablet is shared. Your work is saved under your name, so you can stop and continue next time.</p>
        {learners.length > 0 && (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {learners.map((l) => {
              const step = STEPS.find((s) => s.id === l.step) ?? STEPS[0]
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(l, false)}
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:border-indigo-400 hover:bg-indigo-50"
                  >
                    <span className="grid size-10 place-items-center rounded-full bg-indigo-100 font-bold text-indigo-700">
                      {l.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{l.name}</span>
                      <span className="block text-sm text-slate-600">
                        {l.completedAt ? 'Finished' : `Continue: ${step.label}`} · {minutes(l.elapsedMs)} used
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        <form onSubmit={create} className="mt-5 border-t border-slate-200 pt-4">
          <label htmlFor="new-name" className="flex items-center gap-2 font-semibold">
            <UserRound className="size-5" aria-hidden="true" /> New here? Type your name
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              id="new-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              placeholder="Your name"
              className="min-h-11 flex-1 rounded-xl border border-slate-300 px-3 text-lg"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'name-error' : undefined}
            />
            <Button type="submit">Start my turn</Button>
          </div>
          {error && (
            <p id="name-error" className="mt-2 text-sm text-rose-700">
              {error}
            </p>
          )}
        </form>
      </Card>
    </div>
  )
}
