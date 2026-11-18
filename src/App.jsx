import { useCallback, useEffect, useState } from 'react'
import { Save, Timer } from 'lucide-react'
import { Button } from './components/ui.jsx'
import { APP_NAME, IDENTITY, SESSION_MINUTES, STEPS } from './content.js'
import { logEvent, saveLearner } from './storage.js'
import About from './screens/About.jsx'
import Check from './screens/Check.jsx'
import Intro from './screens/Intro.jsx'
import Lab from './screens/Lab.jsx'
import Predict from './screens/Predict.jsx'
import Start from './screens/Start.jsx'
import Summary from './screens/Summary.jsx'

const SESSION_MS = SESSION_MINUTES * 60 * 1000

function clock(ms) {
  const total = Math.floor((ms ?? 0) / 1000)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export default function App() {
  const [view, setView] = useState('start')
  const [previousView, setPreviousView] = useState('start')
  const [learner, setLearner] = useState(null)
  const [resumed, setResumed] = useState(false)
  const [notice, setNotice] = useState('')
  const [extraTime, setExtraTime] = useState(false)

  const update = useCallback((patch) => {
    setLearner((prev) => {
      if (!prev) return prev
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }
      saveLearner(next)
      return next
    })
  }, [])

  // Session clock for constraint C4: counts only while this learner's turn is open and visible.
  const learnerId = learner?.id
  const finished = Boolean(learner?.completedAt)
  useEffect(() => {
    if (view !== 'learn' || !learnerId || finished) return undefined
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') update((l) => ({ ...l, elapsedMs: (l.elapsedMs ?? 0) + 1000 }))
    }, 1000)
    return () => clearInterval(timer)
  }, [view, learnerId, finished, update])

  const open = (picked, isNew) => {
    setLearner(picked)
    setResumed(!isNew)
    setExtraTime(false)
    const step = STEPS.find((s) => s.id === picked.step) ?? STEPS[0]
    setNotice(
      isNew
        ? ''
        : `Welcome back, ${picked.name}! You are continuing from “${step.label}” with ${picked.trials.length} saved trial${picked.trials.length === 1 ? '' : 's'}.`,
    )
    setView('learn')
    logEvent(picked, isNew ? 'session_start' : 'session_resume', { step: picked.step, elapsedMs: picked.elapsedMs })
    window.scrollTo(0, 0)
  }

  const goTo = (step) => {
    const index = STEPS.findIndex((s) => s.id === step)
    update((l) => ({ ...l, step, maxStep: Math.max(l.maxStep ?? 0, index) }))
    logEvent(learner, 'step', { step })
    window.scrollTo(0, 0)
  }

  const stop = (message) => {
    if (learner) {
      // Every change is already saved by update(), so stopping only needs to log and leave.
      logEvent(learner, 'stop_save', { step: learner.step, elapsedMs: learner.elapsedMs })
      const step = STEPS.find((s) => s.id === learner.step) ?? STEPS[0]
      setNotice(message ?? `Saved. ${learner.name}, next time pick your name to continue from “${step.label}”.`)
    }
    setLearner(null)
    setView('start')
    window.scrollTo(0, 0)
  }

  const showAbout = () => {
    setPreviousView(view)
    setView('about')
    window.scrollTo(0, 0)
  }

  const timeUp = learner && !finished && learner.elapsedMs >= SESSION_MS && !extraTime
  const stepIndex = learner ? STEPS.findIndex((s) => s.id === learner.step) : -1

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
          <span className="text-lg font-bold text-indigo-700">{APP_NAME}</span>
          {view === 'learn' && learner && (
            <>
              <nav aria-label="Session steps" className="order-3 w-full sm:order-none sm:w-auto sm:flex-1">
                <ol className="flex gap-1 overflow-x-auto">
                  {STEPS.map((s, i) => {
                    const reachable = i <= (learner.maxStep ?? 0)
                    const current = s.id === learner.step
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          disabled={!reachable}
                          onClick={() => goTo(s.id)}
                          aria-current={current ? 'step' : undefined}
                          className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium ${
                            current ? 'bg-indigo-600 text-white' : reachable ? 'text-indigo-700 hover:bg-indigo-50' : 'text-slate-400'
                          }`}
                        >
                          {i + 1}. {s.label}
                        </button>
                      </li>
                    )
                  })}
                </ol>
              </nav>
              <div className="ml-auto flex items-center gap-3">
                <div className="text-right" aria-label={`Session time ${clock(learner.elapsedMs)} of ${SESSION_MINUTES} minutes`}>
                  <span className={`flex items-center gap-1 font-mono text-lg font-bold ${learner.elapsedMs >= SESSION_MS ? 'text-amber-600' : ''}`}>
                    <Timer className="size-5" aria-hidden="true" />
                    {clock(learner.elapsedMs)} / {SESSION_MINUTES}:00
                  </span>
                  <span className="mt-0.5 block h-1.5 w-32 overflow-hidden rounded-full bg-slate-200">
                    <span
                      className={`block h-full ${learner.elapsedMs >= SESSION_MS ? 'bg-amber-500' : 'bg-indigo-500'}`}
                      style={{ width: `${Math.min(100, (learner.elapsedMs / SESSION_MS) * 100)}%` }}
                    />
                  </span>
                </div>
                <Button variant="secondary" onClick={() => stop()}>
                  <Save className="size-5" aria-hidden="true" /> Stop &amp; save
                </Button>
              </div>
            </>
          )}
        </div>
      </header>

      {timeUp && (
        <div className="border-b border-amber-300 bg-amber-50" role="alert">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
            <p className="flex-1 font-medium">Your 10 minutes are up. Your work is saved, so you can stop now and continue next time.</p>
            <Button variant="secondary" onClick={() => stop()}>
              Stop &amp; save
            </Button>
            <Button variant="ghost" onClick={() => setExtraTime(true)}>
              Finish this step first
            </Button>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {view === 'learn' && resumed && notice && (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4" role="status">
            <p className="flex-1 font-medium">{notice}</p>
            <Button variant="ghost" onClick={() => setNotice('')}>
              OK
            </Button>
          </div>
        )}
        {view === 'about' && <About onBack={() => setView(previousView === 'about' ? 'start' : previousView)} />}
        {view === 'start' && <Start onOpen={open} notice={notice} />}
        {view === 'learn' && learner && stepIndex === 0 && <Intro learner={learner} goTo={goTo} resumed={resumed} />}
        {view === 'learn' && learner && learner.step === 'predict' && <Predict learner={learner} update={update} goTo={goTo} />}
        {view === 'learn' && learner && learner.step === 'lab' && <Lab learner={learner} update={update} goTo={goTo} />}
        {view === 'learn' && learner && learner.step === 'check' && <Check learner={learner} update={update} goTo={goTo} />}
        {view === 'learn' && learner && learner.step === 'summary' && <Summary learner={learner} update={update} onStop={stop} />}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm text-slate-600">
          <span>
            {APP_NAME} | ET 617 End-Sem | Identity token: <b className="text-slate-900">{IDENTITY}</b>
          </span>
          <button type="button" onClick={showAbout} className="font-semibold text-indigo-700 underline">
            About this app
          </button>
        </div>
      </footer>
    </div>
  )
}
