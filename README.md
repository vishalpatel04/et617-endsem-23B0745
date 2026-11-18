# Jhoola Lab (ET 617 End-Sem, 23B0745)

An inquiry-based virtual pendulum lab for Class 9 learners at NGO after-school centres who share tablets. In one 10-minute turn a learner predicts, runs fair tests by changing length, mass and angle, revises her idea from her own data, and checks her understanding. She can stop and resume at any step.

- **Live app:** https://et617-23b0745.vercel.app
- **Exam card:** P5 Inquiry-based virtual laboratory · P5-T1 Simple pendulum · L2 First-generation learner, NGO centre, shared tablets · C4 10-minute sessions
- **Design:** [DESIGN.md](DESIGN.md) · **Report:** [report/ET617-EndSem-23B0745-Report.pdf](report/ET617-EndSem-23B0745-Report.pdf)

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run check    # lint + build
```

## Where things are

| File | What it holds |
|---|---|
| `src/content.js` | All learner-facing text: predictions, tasks, model answers, feedback, coach fallback replies |
| `src/physics.js` | Pendulum model T = 2π√(L/g), stopwatch error, fair-test comparison |
| `src/screens/Lab.jsx` | Virtual lab: sliders, trials, fair/unfair detection, hint ladder, fair-test helper, table, graph |
| `src/components/Pendulum.jsx` | Animated pendulum with ruler, protractor and stopwatch |
| `src/coach.js` | AI coach client: calls `/api/coach`, checks the reply, rule-based fallback |
| `api/coach.js` | Vercel function calling the Claude API (key in the `ANTHROPIC_API_KEY` environment variable, never committed) |
| `src/storage.js` | Per-learner save/resume and the learning log on the shared tablet |

## AI feature

The Lab coach is off unless `ANTHROPIC_API_KEY` is set in Vercel. Without it, a clearly labelled rule-based coach with recorded replies answers.

## Credits

Vite React template, Tailwind CSS, Recharts, Lucide icons, Anthropic TypeScript SDK. Built with help from Claude (Claude Code), disclosed in the report's AI-use log.
