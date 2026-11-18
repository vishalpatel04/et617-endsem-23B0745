import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { HI } from '../src/hi.js'
import * as content from '../src/content.js'
import { translate } from '../src/lang.js'
import { ruleBasedLabel } from '../src/coach.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const keys = new Set()

function scan(file) {
  const source = fs.readFileSync(file, 'utf8')
  const pattern = /\bt\(\s*(['"])((?:\\.|(?!\1)[^\\])*)\1/g
  let match
  while ((match = pattern.exec(source))) keys.add(match[2])
}
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.jsx?$/.test(entry.name) && entry.name !== 'hi.js') scan(full)
  }
}
walk(path.join(root, 'src'))

// Strings that come from data files (content.js) are translated at display time.
const skip = new Set(['id', 'unit', 'misconception', 'hindi', 'minutes', 'min', 'max', 'step', 'a', 'b'])
function collect(value, key) {
  if (typeof value === 'string') {
    if (!skip.has(key) && /[A-Za-z]/.test(value)) keys.add(value)
  } else if (Array.isArray(value)) value.forEach((item) => collect(item, key))
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) collect(v, k)
}
for (const name of ['PREDICTIONS', 'MISCONCEPTION_FEEDBACK', 'NUMERIC_TASK', 'NUMERIC_FEEDBACK', 'FAIR_PAIR_TASK', 'EXPLAIN_TASK', 'COACH_FALLBACK', 'GLOSSARY', 'RACES', 'RACE_GUESSES', 'REAL_LIFE', 'STEPS', 'VARIABLES']) collect(content[name], name)
keys.add(content.APP_NAME)
// Strings shown through variables or returned by the server.
for (const extra of ['About the same time', 'Longer string, longer swing', 'AI is not set up on this server (no API key)', 'AI took longer than 12 s', 'network problem', 'AI is busy (rate limit)', 'AI key was rejected', 'AI declined to answer', 'AI reply was not JSON', 'AI reply could not be read', 'AI reply rejected: reply was not JSON', 'AI reply rejected: unknown label', 'AI reply rejected: empty feedback', 'AI reply rejected: feedback too long for this learner', 'AI reply rejected: feedback gave away the answer', 'AI reply rejected: AI marked a misconception answer as correct']) keys.add(extra)

const placeholders = (text) => (text.match(/\{\w+\}/g) ?? []).sort().join(',')
const tags = (text) => (text.match(/<\/?[bk]>/g) ?? []).join('')

test('every English string has a Hindi translation', () => {
  const missing = [...keys].filter((key) => !(key in HI))
  assert.deepEqual(missing, [], `Missing Hindi for:\n${missing.join('\n')}`)
})

test('Hindi keeps placeholders and tags and uses Devanagari script', () => {
  for (const [key, hindi] of Object.entries(HI)) {
    const english = key.split('|')[0]
    assert.equal(placeholders(hindi), placeholders(english), `placeholders differ: ${english}`)
    assert.equal(tags(hindi), tags(english), `tags differ: ${english}`)
    assert.match(hindi, /[ऀ-ॿ]/, `no Devanagari in: ${english}`)
  }
})

test('no unused Hindi entries (dictionary matches the app)', () => {
  const unused = Object.keys(HI).filter((key) => !keys.has(key))
  assert.deepEqual(unused, [], `Unused:\n${unused.join('\n')}`)
})

test('translate fills placeholders in both languages and strips the |context suffix', () => {
  assert.equal(translate('en', 'Hi {name}! Let’s find out what decides how long one swing takes.', { name: 'Asha' }), 'Hi Asha! Let’s find out what decides how long one swing takes.')
  assert.equal(translate('hi', '{time} left', { time: '06:48' }), '06:48 बचे')
  assert.equal(translate('en', 'Check|button'), 'Check')
  assert.equal(translate('hi', 'Check|button'), 'जाँचें')
  assert.equal(translate('hi', 'no such text'), 'no such text')
})

test('coach understands Hindi answers', () => {
  assert.equal(ruleBasedLabel('हाँ, भारी गोलक का आवर्तकाल बदलता है'), 'M1_mass')
  assert.equal(ruleBasedLabel('हाँ'), 'M1_mass')
  assert.equal(ruleBasedLabel('भारी पत्थर तेज़ झूलता है'), 'M1_mass')
  assert.equal(ruleBasedLabel('नहीं, वज़न बदलने पर आवर्तकाल नहीं बदलता'), 'correct')
  assert.equal(ruleBasedLabel('नहीं'), 'correct')
  assert.equal(ruleBasedLabel('जब मैंने सिर्फ़ वज़न बदला तो समय वही रहा'), 'correct')
  assert.equal(ruleBasedLabel('yes it is'), 'M1_mass')
  assert.equal(ruleBasedLabel('No. mass does not change the period'), 'correct')
})
