import { Button, Card, Key } from '../components/ui.jsx'
import { GLOSSARY, SESSION_MINUTES, STEPS } from '../content.js'

export default function Intro({ learner, goTo, resumed }) {
  const step = STEPS.find((s) => s.id === learner.step) ?? STEPS[0]
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {resumed && learner.step !== 'intro' && (
        <Card tone="good">
          <h2 className="text-xl font-bold">Welcome back, {learner.name}!</h2>
          <p className="mt-1">
            You stopped at <b>{step.label}</b> with {learner.trials.length} trial{learner.trials.length === 1 ? '' : 's'} saved.
          </p>
          <Button className="mt-3" onClick={() => goTo(learner.step)}>
            Continue from {step.label}
          </Button>
        </Card>
      )}
      <Card>
        <h1 className="text-2xl font-bold sm:text-3xl">Hi {learner.name}! Let’s find out what decides how long one swing takes.</h1>
        <ol className="mt-4 space-y-3 text-lg">
          <li>
            <b>First,</b> the <Key>period</Key> is the time for one full swing, there and back (
            <i>ek poore jhoole ka samay</i>).
          </li>
          <li>
            <b>Second,</b> timing one swing is hard because our hand reacts late. So we <Key>time 10 swings and divide by 10</Key>.
          </li>
          <li>
            <b>Third,</b> a <Key>fair test</Key> changes only one thing at a time: the length, the mass or the angle. We keep the other two the same.
          </li>
        </ol>
      </Card>
      <Card tone="info">
        <h2 className="text-lg font-bold">Today’s plan: {SESSION_MINUTES} minutes</h2>
        <ol className="mt-2 grid gap-2 sm:grid-cols-5">
          {STEPS.map((s, i) => (
            <li key={s.id} className="rounded-xl bg-white p-2 text-center">
              <span className="block text-sm text-slate-500">Step {i + 1}</span>
              <span className="block font-semibold">{s.label}</span>
              <span className="block text-sm text-slate-600">{s.minutes} min</span>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-sm text-slate-700">You can press “Stop &amp; save” at any time. Next time, pick your name to continue.</p>
      </Card>
      <Card>
        <h2 className="text-lg font-bold">Words we will use</h2>
        <dl className="mt-2 grid gap-2 sm:grid-cols-2">
          {GLOSSARY.map((g) => (
            <div key={g.term} className="rounded-xl bg-slate-50 p-3">
              <dt className="font-semibold">
                {g.term} <span className="font-normal text-slate-500">({g.hindi})</span>
              </dt>
              <dd className="text-slate-700">{g.meaning}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <div className="flex justify-end">
        <Button onClick={() => goTo('predict')}>Start: make my predictions</Button>
      </div>
    </div>
  )
}
