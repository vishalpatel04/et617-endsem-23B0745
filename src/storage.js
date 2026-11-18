import { IDENTITY } from './content.js'

// Everything is saved on the shared tablet under each learner's name (constraint C4: stop and resume).
const KEY = `jhoola-lab:${IDENTITY}:v1`

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (data && Array.isArray(data.learners) && Array.isArray(data.events)) return data
  } catch {
    // Corrupt or blocked storage: start fresh.
  }
  return { learners: [], events: [] }
}

function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    // Storage full or blocked: the session still works, it just will not resume.
  }
}

export function newLearner(name) {
  return {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name,
    createdAt: Date.now(),
    step: 'intro',
    maxStep: 0,
    elapsedMs: 0,
    predictions: {},
    revised: {},
    trials: [],
    fairTests: {},
    unfairCount: 0,
    hintsUsed: 0,
    answers: {},
    completedAt: null,
  }
}

export function listLearners() {
  return load().learners
}

export function saveLearner(learner) {
  const data = load()
  const next = { ...learner, updatedAt: Date.now() }
  const index = data.learners.findIndex((l) => l.id === learner.id)
  if (index === -1) data.learners.push(next)
  else data.learners[index] = next
  save(data)
}

export function logEvent(learner, type, details = {}) {
  const data = load()
  data.events.push({ ts: Date.now(), learnerId: learner?.id ?? null, learner: learner?.name ?? null, type, details })
  if (data.events.length > 3000) data.events.splice(0, data.events.length - 3000)
  save(data)
}

export function getEvents() {
  return load().events
}

export function clearAll() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nothing to clear.
  }
}
