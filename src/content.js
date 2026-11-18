// All learner-facing content lives in this file, so it can be changed quickly.

export const IDENTITY = '23B0745'
export const APP_NAME = 'Jhoola Lab'
export const SESSION_MINUTES = 10

export const CARD = [
  ['Problem (P)', 'P5 Inquiry-based virtual laboratory'],
  ['Topic (T)', 'P5-T1 Simple pendulum: length, mass, amplitude vs period (Class 9–11)'],
  ['Learner (L)', 'L2 First-generation learner, NGO after-school centre, shared tablets'],
  ['Constraint (C)', 'C4 10-minute sessions: stop and resume where you left off'],
  ['Identity token', IDENTITY],
]

// One complete learning sequence = 10 minutes (constraint C4).
export const STEPS = [
  { id: 'intro', label: 'Start', minutes: 1 },
  { id: 'predict', label: 'Predict', minutes: 1.5 },
  { id: 'lab', label: 'Experiment', minutes: 5 },
  { id: 'check', label: 'Check', minutes: 2 },
  { id: 'summary', label: 'Wrap-up', minutes: 0.5 },
]

export const VARIABLES = [
  { id: 'length', name: 'String length', short: 'length', hindi: 'डोरी की लंबाई', unit: 'cm', min: 20, max: 100, step: 5 },
  { id: 'mass', name: 'Mass of the bob', short: 'mass', hindi: 'वज़न', unit: 'g', min: 50, max: 500, step: 50 },
  { id: 'angle', name: 'Starting angle', short: 'angle', hindi: 'कितना खींचा', unit: '°', min: 5, max: 20, step: 5 },
]

export function variableById(id) {
  return VARIABLES.find((v) => v.id === id)
}

export const GLOSSARY = [
  { term: 'Period', hindi: 'एक पूरे झूले का समय', meaning: 'time for one full swing, there and back' },
  { term: 'Bob', hindi: 'लटकता हुआ वज़न', meaning: 'the weight at the end of the string' },
  { term: 'Angle (amplitude)', hindi: 'कितना खींचा', meaning: 'how far you pull the bob back' },
  { term: 'Fair test', hindi: 'सही परीक्षण', meaning: 'change only one thing, keep the rest the same' },
]

// Step 2: predictions double as a diagnostic. Wrong ideas decide the order of experiments.
export const PREDICTIONS = [
  {
    id: 'mass',
    prompt: 'Sana ties a heavier stone to the same string and pulls it back the same amount. One full swing will take…',
    options: [
      { id: 'less', label: 'Less time (heavier swings faster)', misconception: 'M1' },
      { id: 'more', label: 'More time (heavier swings slower)', misconception: 'M1' },
      { id: 'same', label: 'The same time', correct: true },
    ],
  },
  {
    id: 'angle',
    prompt: 'Now she keeps the same stone and string, but pulls it further back before letting go. One full swing will take…',
    options: [
      { id: 'more', label: 'More time (it has further to go)', misconception: 'M2' },
      { id: 'less', label: 'Less time (it moves faster)', misconception: 'M2' },
      { id: 'same', label: 'The same time', correct: true },
    ],
  },
  {
    id: 'length',
    prompt: 'Then she uses a longer string with the same stone. One full swing will take…',
    options: [
      { id: 'more', label: 'More time', correct: true },
      { id: 'less', label: 'Less time' },
      { id: 'same', label: 'The same time' },
    ],
  },
]

export const MISCONCEPTION_FEEDBACK = {
  M1: 'Many of us think a heavier stone swings faster, so this surprises a lot of people! Your fair test shows the period hardly changed when only the mass changed.',
  M2: 'A bigger pull makes the stone move faster, but it also has further to travel. The two balance out, so the time for one swing stays about the same.',
}

// Step 4 tasks
export const NUMERIC_TASK = {
  prompt: 'A 100 cm pendulum has a period of about 2.0 s. What is the period of a 25 cm pendulum?',
  model: 'About 1.0 s. The string is 4 times shorter, so the period is 2 times shorter (the period depends on the square root of the length: √4 = 2).',
}

export function judgeNumeric(value) {
  if (!Number.isFinite(value)) return 'invalid'
  if (value >= 0.9 && value <= 1.1) return 'correct'
  if (value >= 0.4 && value <= 0.6) return 'linear'
  if (value >= 1.9 && value <= 2.1) return 'same'
  return 'other'
}

export const NUMERIC_FEEDBACK = {
  correct: 'Yes! The string is 4 times shorter, and the period is 2 times shorter: 2.0 s becomes 1.0 s.',
  linear: 'You divided 2.0 by 4. Many of us expect the period to shrink as much as the length, but it shrinks less: 4 times shorter gives only 2 times shorter. Try 100 cm and 25 cm in the lab.',
  same: 'The length does change the period. Look at your length trials: what happened when the string got shorter?',
  other: 'Not quite. Run 100 cm and then 25 cm in the lab and compare the two periods.',
  invalid: 'Type a number of seconds, for example 1.5.',
}

export const FAIR_PAIR_TASK = {
  prompt: 'Raju wants to test whether mass changes the period. Which pair of trials is a fair test?',
  options: [
    { id: 'a', first: { length: 50, mass: 100, angle: 10 }, second: { length: 80, mass: 300, angle: 10 }, feedback: 'Not fair: the length and the mass both change, so we cannot tell which one changed the period.' },
    { id: 'b', first: { length: 50, mass: 100, angle: 10 }, second: { length: 80, mass: 100, angle: 10 }, feedback: 'This is a fair test, but of length, not mass: only the length changes.' },
    { id: 'c', first: { length: 50, mass: 100, angle: 10 }, second: { length: 50, mass: 300, angle: 10 }, correct: true, feedback: 'Correct. Only the mass changes. Length and angle stay the same, so any change in the period must come from the mass.' },
    { id: 'd', first: { length: 50, mass: 100, angle: 10 }, second: { length: 50, mass: 300, angle: 20 }, feedback: 'Not fair: the mass and the angle both change. Keep the angle the same.' },
  ],
}

export const EXPLAIN_TASK = {
  prompt: 'Use your own results: does a heavier bob change the period? Explain in 1–2 sentences.',
  placeholder: 'Start like this: "When I changed only the mass…"',
  model: 'No. When I kept the length (50 cm) and the angle (10°) the same and changed only the mass from 100 g to 300 g, the period stayed about 1.42 s both times.',
}

// Recorded replies used by the rule-based coach when the AI is unavailable or its reply fails a check.
export const COACH_FALLBACK = {
  correct: 'Well done. You kept the test fair and the period stayed about the same. Can you add the numbers from your table to back it up?',
  correct_evidence: 'Well done! You changed only the mass and used your own numbers to show the period stayed about the same. That is how scientists argue from evidence.',
  M1_mass: 'Many of us feel a heavier stone should swing faster. Let’s check your table: find two trials where ONLY the mass is different. What happened to the period?',
  M2_angle: 'Your answer is about the angle, but this question is about mass. Let’s find two trials where ONLY the mass is different. What happened to the period?',
  unclear: 'Let’s use your data. Find two trials in your table where only the mass is different, and write what happened to the period.',
}

// "Race two pendulums": side-by-side contrasting cases. Each race changes only one thing.
export const RACES = [
  {
    id: 'mass',
    label: 'Light vs heavy bob',
    a: { length: 50, mass: 50, angle: 10 },
    b: { length: 50, mass: 400, angle: 10 },
    explain: 'Same string, same angle; only the mass is different. They stay side by side the whole race, so the mass does not change the period.',
    misconception: 'M1',
  },
  {
    id: 'angle',
    label: 'Small vs big push',
    a: { length: 50, mass: 100, angle: 5 },
    b: { length: 50, mass: 100, angle: 20 },
    explain: 'B travels a longer path, but it also moves faster (watch the speed). So both finish together: the starting angle does not change the period.',
    misconception: 'M2',
  },
  {
    id: 'length',
    label: 'Short vs long string',
    a: { length: 25, mass: 100, angle: 10 },
    b: { length: 100, mass: 100, angle: 10 },
    explain: 'B’s string is 4 times longer and its period is 2 times longer: A swings twice for every one swing of B.',
    misconception: null,
  },
]

export const RACE_GUESSES = [
  { id: 'a', label: 'A finishes first' },
  { id: 'b', label: 'B finishes first' },
  { id: 'together', label: 'They finish together' },
]

export const REAL_LIFE = [
  { title: 'Playground jhoola', text: 'A swing with longer chains swings more slowly. A heavier child and a lighter child on the same swing keep the same pace.' },
  { title: 'Pendulum clock', text: 'Old wall clocks keep good time because the period hardly changes as the swings get smaller.' },
  { title: 'Try it at home', text: 'Tie a small stone to a 25 cm thread and time 10 swings. You should get about 10 seconds.' },
]
