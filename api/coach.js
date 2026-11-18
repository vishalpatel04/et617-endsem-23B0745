// Vercel serverless function: the AI "Lab coach".
// The API key is read from the ANTHROPIC_API_KEY environment variable in Vercel. It is never committed.
import Anthropic from '@anthropic-ai/sdk'

const MODEL = process.env.COACH_MODEL || 'claude-opus-5-5'
const QUESTION = 'Use your own results: does a heavier bob change the period?'

export const SYSTEM_PROMPT = `You are "Lab coach" in Jhoola Lab, a virtual pendulum lab for a Class 9 student at an NGO after-school centre in Mumbai. She speaks Hindi at home and reads simple English.
You receive her written answer to one question, her experiment trials and her earlier predictions.
Decide which idea her answer shows and write one short coaching reply.
Labels:
- "correct": she says the mass of the bob does not change the period, ideally using numbers from her trials.
- "M1_mass": she thinks a heavier bob swings faster or slower (mass changes the period).
- "M2_angle": she thinks a bigger angle or push changes the time for one swing.
- "unclear": anything else.
Rules for "feedback":
- Simple English, at most 2 short sentences and 45 words. Friendly; use "we" or "let's".
- Point her to her own trials, for example a fair test where only the mass changed.
- If the label is not "correct", never state the answer (do not say that mass or angle does not change the period). Ask a question that makes her check her data.
- If the label is "correct", praise her use of evidence in one sentence.
Reply with JSON only, no other text: {"label": "...", "feedback": "..."}`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' })
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'AI is not set up on this server (no API key)' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {})
  const explanation = typeof body.explanation === 'string' ? body.explanation.trim().slice(0, 600) : ''
  if (!explanation) return res.status(400).json({ error: 'An explanation is required' })
  const trials = Array.isArray(body.trials) ? body.trials.slice(-8) : []

  const client = new Anthropic()
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 1024,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: JSON.stringify({ question: QUESTION, answer: explanation, trials, predictions: body.predictions ?? {} }),
        },
      ],
    })
    if (response.stop_reason === 'refusal') return res.status(502).json({ error: 'AI declined to answer' })
    const text = response.content.filter((block) => block.type === 'text').map((block) => block.text).join('')
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start === -1 || end <= start) return res.status(502).json({ error: 'AI reply was not JSON' })
    const parsed = JSON.parse(text.slice(start, end + 1))
    return res.status(200).json({ label: parsed.label, feedback: String(parsed.feedback ?? ''), model: response.model })
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return res.status(429).json({ error: 'AI is busy (rate limit)' })
    if (error instanceof Anthropic.AuthenticationError) return res.status(502).json({ error: 'AI key was rejected' })
    if (error instanceof Anthropic.APIError) return res.status(502).json({ error: `AI error ${error.status}` })
    return res.status(502).json({ error: 'AI reply could not be read' })
  }
}
