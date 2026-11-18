import Rich from '../components/Rich.jsx'
import { Button, Card } from '../components/ui.jsx'
import { GLOSSARY, SESSION_MINUTES, STEPS } from '../content.js'
import { useLang } from '../lang.js'

export default function Intro({ learner, goTo, resumed }) {
  const { t, lang } = useLang()
  const step = STEPS.find((s) => s.id === learner.step) ?? STEPS[0]
  const n = learner.trials.length
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {resumed && learner.step !== 'intro' && (
        <Card tone="good">
          <h2 className="text-xl font-bold">{t('Welcome back, {name}!', { name: learner.name })}</h2>
          <p className="mt-1">
            <Rich text={n === 1 ? t('You stopped at <b>{step}</b> with 1 trial saved.', { step: t(step.label) }) : t('You stopped at <b>{step}</b> with {n} trials saved.', { step: t(step.label), n })} />
          </p>
          <Button className="mt-3" onClick={() => goTo(learner.step)}>
            {t('Continue from {step}', { step: t(step.label) })}
          </Button>
        </Card>
      )}
      <Card>
        <h1 className="text-2xl font-bold sm:text-3xl">{t('Hi {name}! Let’s find out what decides how long one swing takes.', { name: learner.name })}</h1>
        <ol className="mt-4 space-y-3 text-lg">
          <li>
            <Rich text={t('<b>First,</b> the <k>period</k> is the time for one full swing, there and back (<i>एक पूरे झूले का समय</i>).')} />
          </li>
          <li>
            <Rich text={t('<b>Second,</b> timing one swing is hard because our hand reacts late. So we <k>time 10 swings and divide by 10</k>.')} />
          </li>
          <li>
            <Rich text={t('<b>Third,</b> a <k>fair test</k> changes only one thing at a time: the length, the mass or the angle. We keep the other two the same.')} />
          </li>
        </ol>
      </Card>
      <Card tone="info">
        <h2 className="text-lg font-bold">{t('Today’s plan: {m} minutes', { m: SESSION_MINUTES })}</h2>
        <ol className="mt-2 grid gap-2 sm:grid-cols-5">
          {STEPS.map((s, i) => (
            <li key={s.id} className="rounded-xl bg-white p-2 text-center">
              <span className="block text-sm text-slate-500">{t('Step {n}', { n: i + 1 })}</span>
              <span className="block font-semibold">{t(s.label)}</span>
              <span className="block text-sm text-slate-600">{t('{m} min', { m: s.minutes })}</span>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-sm text-slate-700">{t('You can press “Stop & save” at any time. Next time, pick your name to continue.')}</p>
      </Card>
      <Card>
        <h2 className="text-lg font-bold">{t('Words we will use')}</h2>
        <dl className="mt-2 grid gap-2 sm:grid-cols-2">
          {GLOSSARY.map((g) => (
            <div key={g.term} className="rounded-xl bg-slate-50 p-3">
              <dt className="font-semibold">
                {t(g.term)} {lang === 'en' && <span className="font-normal text-slate-500">({g.hindi})</span>}
              </dt>
              <dd className="text-slate-700">{t(g.meaning)}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <div className="flex justify-end">
        <Button onClick={() => goTo('predict')}>{t('Start: make my predictions')}</Button>
      </div>
    </div>
  )
}
