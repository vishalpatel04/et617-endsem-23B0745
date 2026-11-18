import { useState } from 'react'
import { Bot, CircleCheck, CircleX, Info } from 'lucide-react'
import { Button, Card } from '../components/ui.jsx'
import { COACH_FALLBACK, EXPLAIN_TASK, FAIR_PAIR_TASK, NUMERIC_FEEDBACK, NUMERIC_TASK, judgeNumeric } from '../content.js'
import { getCoachFeedback } from '../coach.js'
import { useLang } from '../lang.js'
import { logEvent } from '../storage.js'

export default function Check({ learner, update, goTo }) {
  const { t, lang } = useLang()
  const answers = learner.answers ?? {}
  const [num, setNum] = useState(answers.numeric?.value ?? '')
  const [text, setText] = useState(answers.explanation?.text ?? '')
  const [busy, setBusy] = useState(false)

  const trialText = (trial) => `${trial.length} ${t('cm')}, ${trial.mass} ${t('g')}, ${trial.angle}°`
  const save = (key, value) => update((l) => ({ ...l, answers: { ...l.answers, [key]: value } }))

  const submitNumeric = (event) => {
    event.preventDefault()
    const value = Number.parseFloat(String(num).replace(',', '.'))
    const verdict = judgeNumeric(value)
    save('numeric', { value: num, verdict, attempts: (answers.numeric?.attempts ?? 0) + 1 })
    logEvent(learner, 'task_numeric', { value, verdict })
  }

  const choosePair = (option) => {
    save('fairPair', { choice: option.id, correct: Boolean(option.correct), attempts: (answers.fairPair?.attempts ?? 0) + 1 })
    logEvent(learner, 'task_fair_pair', { choice: option.id, correct: Boolean(option.correct) })
  }

  const submitExplanation = async (event) => {
    event.preventDefault()
    if (text.trim().length < 5) return
    setBusy(true)
    const result = await getCoachFeedback({ explanation: text.trim(), trials: learner.trials, predictions: learner.predictions, lang })
    setBusy(false)
    save('explanation', { text: text.trim(), ...result, attempts: (answers.explanation?.attempts ?? 0) + 1 })
    logEvent(learner, 'coach_feedback', { label: result.label, source: result.source, reason: result.reason ?? null, lang })
  }

  const numeric = answers.numeric
  const pair = answers.fairPair
  const coach = answers.explanation
  const allAnswered = numeric && numeric.verdict !== 'invalid' && pair && coach
  // Recorded fallback replies are looked up by key, so they follow the language toggle.
  const coachText = coach ? (coach.source === 'fallback' && coach.key ? t(COACH_FALLBACK[coach.key]) : coach.feedback) : ''

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{t('Check what you found')}</h1>
        <p className="mt-1 text-slate-700">{t('Three short tasks. Use your data table if you need it.')}</p>
      </div>

      <Card>
        <h2 className="text-lg font-semibold">
          {t('Task 1 (number).')} {t(NUMERIC_TASK.prompt)}
        </h2>
        <form onSubmit={submitNumeric} className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor="numeric" className="sr-only">
            {t('Period in seconds')}
          </label>
          <input
            id="numeric"
            inputMode="decimal"
            value={num}
            onChange={(e) => setNum(e.target.value)}
            placeholder={t('e.g. 1.5')}
            className="min-h-11 w-32 rounded-xl border border-slate-300 px-3 text-lg"
          />
          <span className="text-lg">{t('seconds')}</span>
          <Button type="submit" disabled={!String(num).trim()}>
            {t('Check|button')}
          </Button>
        </form>
        {numeric && (
          <Feedback ok={numeric.verdict === 'correct'} text={t(NUMERIC_FEEDBACK[numeric.verdict])}>
            {numeric.verdict === 'linear' && (
              <Button variant="secondary" className="mt-2" onClick={() => goTo('lab')}>
                {t('Open the lab: try 100 cm and 25 cm')}
              </Button>
            )}
          </Feedback>
        )}
        {numeric && numeric.verdict !== 'invalid' && <ModelAnswer text={t(NUMERIC_TASK.model)} label={t('See a model answer')} />}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">
          {t('Task 2 (choose one).')} {t(FAIR_PAIR_TASK.prompt)}
        </h2>
        <div className="mt-3 grid gap-2">
          {FAIR_PAIR_TASK.options.map((o, i) => (
            <button
              key={o.id}
              type="button"
              onClick={() => choosePair(o)}
              aria-pressed={pair?.choice === o.id}
              className={`rounded-xl border p-3 text-left ${pair?.choice === o.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400'}`}
            >
              <b>{String.fromCharCode(65 + i)}.</b> {t('Trial 1: {a} → Trial 2: {b}', { a: trialText(o.first), b: trialText(o.second) })}
            </button>
          ))}
        </div>
        {pair && <Feedback ok={pair.correct} text={t(FAIR_PAIR_TASK.options.find((o) => o.id === pair.choice).feedback)} />}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">
          {t('Task 3 (explain).')} {t(EXPLAIN_TASK.prompt)}
        </h2>
        <form onSubmit={submitExplanation} className="mt-3">
          <label htmlFor="explain" className="sr-only">
            {t('Your explanation')}
          </label>
          <textarea
            id="explain"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={600}
            placeholder={t(EXPLAIN_TASK.placeholder)}
            className="w-full rounded-xl border border-slate-300 p-3 text-lg"
          />
          <Button type="submit" className="mt-2" disabled={busy || text.trim().length < 5}>
            <Bot className="size-5" aria-hidden="true" /> {busy ? t('Lab coach is reading…') : coach ? t('Ask the lab coach again') : t('Ask the lab coach')}
          </Button>
        </form>
        {coach && !busy && (
          <div className={`mt-3 rounded-xl border p-3 ${coach.label === 'correct' ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50'}`} aria-live="polite">
            <p className="flex items-start gap-2">
              <Bot className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <span>{coachText}</span>
            </p>
            <p className="mt-2 flex items-start gap-1 text-xs text-slate-600">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {coach.source === 'ai'
                ? t('AI lab coach ({model}). Checked before showing: allowed label, length, no answer give-away.', { model: coach.model })
                : t('Offline coach: rule-based fallback with recorded replies, because {reason}.', { reason: t(coach.reason) })}
            </p>
            {coach.label !== 'correct' && (
              <Button variant="secondary" className="mt-2" onClick={() => goTo('lab')}>
                {t('Go back to the lab and look at the mass trials')}
              </Button>
            )}
          </div>
        )}
        {coach && <ModelAnswer text={t(EXPLAIN_TASK.model)} label={t('See a model answer')} />}
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {!allAnswered && <p className="text-sm text-slate-600">{t('Try all three tasks to finish.')}</p>}
        <Button onClick={() => goTo('summary')} disabled={!allAnswered}>
          {t('Finish: see my summary')}
        </Button>
      </div>
    </div>
  )
}

function Feedback({ ok, text, children }) {
  return (
    <div className={`mt-3 rounded-xl border p-3 ${ok ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50'}`} aria-live="polite">
      <p className="flex items-start gap-2">
        {ok ? <CircleCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden="true" /> : <CircleX className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />}
        <span>{text}</span>
      </p>
      {children}
    </div>
  )
}

function ModelAnswer({ text, label }) {
  return (
    <details className="mt-2 text-sm">
      <summary className="cursor-pointer font-medium text-indigo-700">{label}</summary>
      <p className="mt-1 rounded-lg bg-slate-50 p-2">{text}</p>
    </details>
  )
}
