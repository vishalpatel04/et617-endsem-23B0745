import { COACH_FALLBACK } from './content.js'

const LABELS = ['correct', 'M1_mass', 'M2_angle', 'unclear']
// A reply that is not "correct" must not hand over the answer.
const GIVES_AWAY_ANSWER = /(mass|weight|heav\w*|angle|amplitude)[^.]{0,40}(does not|doesn't|do not|don't|has no|no effect|not change|not affect)/i

// Rule-based classifier: used to cross-check the AI and as the offline fallback.
export function ruleBasedLabel(text) {
  const t = text.toLowerCase()
  const saysSame = /(same|no change|not change|didn'?t change|did not change|doesn'?t change|does not change|no effect|not affect|doesn'?t affect|does not affect|equal|constant|stayed)/.test(t)
  const m1 = /(heav\w*|more mass|more weight|weight\w*|mass)[^.]{0,40}(fast|quick|less time|shorter|slow|more time|longer)/.test(t)
  const m2 = /(angle|push|pull\w*|further|farther|amplitude)[^.]{0,40}(long|slow|more time|fast|less time|short)/.test(t)
  const mentionsMass = /(mass|heav|weight|light|stone|bob|gram|\d\s?g\b)/.test(t)
  if (m1 && !saysSame) return 'M1_mass'
  if (m2 && !saysSame) return 'M2_angle'
  if (mentionsMass && saysSame) return 'correct'
  return 'unclear'
}

export function checkAiReply(data, ruleLabel) {
  if (!data || typeof data !== 'object') return 'reply was not JSON'
  if (!LABELS.includes(data.label)) return 'unknown label'
  if (typeof data.feedback !== 'string' || data.feedback.trim().length < 10) return 'empty feedback'
  if (data.feedback.length > 320) return 'feedback too long for this learner'
  if (data.label !== 'correct' && GIVES_AWAY_ANSWER.test(data.feedback)) return 'feedback gave away the answer'
  if (data.label === 'correct' && ruleLabel.startsWith('M')) return 'AI marked a misconception answer as correct'
  return null
}

export async function getCoachFeedback({ explanation, trials, predictions }) {
  const ruleLabel = ruleBasedLabel(explanation)
  const hasNumbers = /\d/.test(explanation)
  const fallback = (reason) => ({
    source: 'fallback',
    reason,
    label: ruleLabel,
    feedback: ruleLabel === 'correct' && hasNumbers ? COACH_FALLBACK.correct_evidence : COACH_FALLBACK[ruleLabel],
  })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)
  try {
    const response = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        explanation,
        predictions,
        trials: trials.slice(-8).map(({ n, length, mass, angle, period }) => ({ n, length, mass, angle, period })),
      }),
      signal: controller.signal,
    })
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      return fallback(body.error ?? `AI service error ${response.status}`)
    }
    const data = await response.json()
    const problem = checkAiReply(data, ruleLabel)
    if (problem) return fallback(`AI reply rejected: ${problem}`)
    return { source: 'ai', model: data.model, label: data.label, feedback: data.feedback.trim(), ruleLabel }
  } catch (error) {
    return fallback(error.name === 'AbortError' ? 'AI took longer than 12 s' : 'network problem')
  } finally {
    clearTimeout(timer)
  }
}
