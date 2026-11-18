import { createContext, useContext } from 'react'
import { HI } from './hi.js'

// Translation: English text is the key. A "|context" suffix lets two different UI strings share the same
// English words (for example the step "Check" and the button "Check|button"); it is never shown.
export function translate(lang, key, vars) {
  const english = key.split('|')[0]
  let text = lang === 'hi' ? (HI[key] ?? english) : english
  if (vars) text = text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match))
  return text
}

export const LangContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (key, vars) => translate('en', key, vars),
})

export const useLang = () => useContext(LangContext)
