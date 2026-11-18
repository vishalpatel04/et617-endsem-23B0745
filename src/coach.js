import { COACH_FALLBACK } from './content.js'

const LABELS = ['correct', 'M1_mass', 'M2_angle', 'unclear']
// A reply that is not "correct" must not hand over the answer (English or Hindi).
const GIVES_AWAY_ANSWER =
  /(mass|weight|heav\w*|angle|amplitude)[^.]{0,40}(does not|doesn't|do not|don't|has no|no effect|not change|not affect)|(वज़न|वजन|भार|द्रव्यमान|कोण)[^.\u0964]{0,40}(नहीं बदल|कोई असर नहीं|कोई फ़र्क नहीं|कोई फर्क नहीं|असर नहीं)/i

// Rule-based classifier: used to cross-check the AI and as the offline fallback. Reads English and Hindi (Devanagari).
export function ruleBasedLabel(text) {
  const t = text.toLowerCase()
  const saysSame =
    /(same|no change|not change|didn'?t change|did not change|doesn'?t change|does not change|no effect|not affect|doesn'?t affect|does not affect|equal|constant|stayed)|(वही|उतना ही|समान|बराबर|नहीं बदल|नहीं बदला|नहीं बदलता|नहीं बदलती|कोई असर नहीं|असर नहीं|कोई फ़र्क नहीं|कोई फर्क नहीं|फ़र्क नहीं|फर्क नहीं)/.test(t)
  const m1 =
    /(heav\w*|more mass|more weight|weight\w*|mass)[^.]{0,40}(fast|quick|less time|shorter|slow|more time|longer)|(भारी|वज़न|वजन|भार|द्रव्यमान)[^.\u0964]{0,40}(तेज़|तेज|जल्दी|कम समय|धीरे|ज़्यादा समय|ज्यादा समय|अधिक समय)/.test(t)
  const m2 =
    /(angle|push|pull\w*|further|farther|amplitude)[^.]{0,40}(long|slow|more time|fast|less time|short)|(कोण|धक्का|खींच\S*|आयाम)[^.\u0964]{0,40}(लंब|धीरे|ज़्यादा समय|ज्यादा समय|अधिक समय|तेज़|तेज|कम समय)/.test(t)
  const mentionsMass = /(mass|heav|weight|light|stone|bob|gram|\d\s?g\b)|(वज़न|वजन|भार|द्रव्यमान|पत्थर|गोलक|ग्राम)/.test(t)
  // The question is a yes/no question: "yes" means a heavier bob changes the period (M1).
  const startsYes = /^\s*(yes|yeah|yep|haan|han|ha|हाँ|हां|हा|जी हाँ|जी हां)(?![a-z])(?![\u0900-\u097F])/.test(t)
  const startsNo = /^\s*(no|nope|nahi|nahin|nai|नहीं|नही|ना)(?![a-z])(?![\u0900-\u097F])/.test(t)
  if (m1 && !saysSame) return 'M1_mass'
  if (m2 && !saysSame) return 'M2_angle'
  if (startsYes && !saysSame) return 'M1_mass'
  if ((mentionsMass || startsNo) && saysSame) return 'correct'
  if (startsNo) return 'correct'
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

export async function getCoachFeedback({ explanation, trials, predictions, lang = 'en' }) {
  const ruleLabel = ruleBasedLabel(explanation)
  const hasNumbers = /\d/.test(explanation)
  const key = ruleLabel === 'correct' && hasNumbers ? 'correct_evidence' : ruleLabel
  const fallback = (reason) => ({
    source: 'fallback',
    reason,
    label: ruleLabel,
    key,
    // Shown through the translation table, so it follows the language toggle.
    feedback: COACH_FALLBACK[key],
  })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)
  try {
    const response = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        explanation,
        lang,
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
