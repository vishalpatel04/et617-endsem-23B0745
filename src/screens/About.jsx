import { Download } from 'lucide-react'
import { Button, Card } from '../components/ui.jsx'
import { APP_NAME, CARD, IDENTITY } from '../content.js'
import { getEvents } from '../storage.js'

function downloadLog() {
  const rows = getEvents().map((e) => [new Date(e.ts).toISOString(), e.learner ?? '', e.type, JSON.stringify(e.details).replaceAll('"', '""')])
  const csv = ['time,learner,event,details', ...rows.map((r) => `${r[0]},"${r[1]}",${r[2]},"${r[3]}"`)].join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `jhoola-lab-log-${IDENTITY}.csv`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function About({ onBack }) {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-3xl font-bold">About {APP_NAME}</h1>
      <Card tone="info">
        <h2 className="text-lg font-bold">Identity token: {IDENTITY}</h2>
        <table className="mt-2 w-full text-left">
          <tbody>
            {CARD.map(([field, value]) => (
              <tr key={field} className="border-t border-indigo-100">
                <th className="py-1.5 pr-3 align-top text-sm font-semibold">{field}</th>
                <td className="py-1.5">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card>
        <h2 className="text-lg font-bold">What this app does</h2>
        <p className="mt-1">
          An inquiry-based virtual pendulum lab for Class 9 learners at NGO after-school centres who share tablets. In one 10-minute turn a
          learner predicts, runs fair tests by changing length, mass and angle, revises her idea from her own data, and checks her
          understanding. Work is saved per learner so she can stop and resume.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Model: ideal simple pendulum, T = 2π√(L/g), small angles (5° to 20°). Each 10-swing timing has up to ±0.08 s stopwatch error.
        </p>
      </Card>
      <Card>
        <h2 className="text-lg font-bold">How AI is used</h2>
        <p className="mt-1">
          The <b>Lab coach</b> (Check, Task 3) sends the learner’s explanation and trial data to Claude (model claude-opus-5-5) through a
          server function. The reply is checked before it is shown: allowed label, length limit, no answer give-away, and agreement with a
          rule-based check. If the AI is not set up, too slow (12 s) or fails a check, a clearly labelled rule-based coach replies with
          recorded feedback.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Built with the Vite React template, Tailwind CSS, Recharts and Lucide icons. The app was built with help from Claude (Claude Code);
          see the AI-use log in the report.
        </p>
      </Card>
      <Card>
        <h2 className="text-lg font-bold">Learning log (for the facilitator)</h2>
        <p className="mt-1">Every prediction, trial, hint, answer and coach reply is logged on this tablet for evaluation.</p>
        <Button variant="secondary" className="mt-2" onClick={downloadLog}>
          <Download className="size-5" aria-hidden="true" /> Download learning log (CSV)
        </Button>
      </Card>
      <Button variant="ghost" onClick={onBack}>
        Back
      </Button>
    </div>
  )
}
