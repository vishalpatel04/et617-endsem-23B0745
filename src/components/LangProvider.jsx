import { useCallback, useEffect, useMemo, useState } from 'react'
import { LangContext, translate } from '../lang.js'
import { logEvent } from '../storage.js'

const KEY = 'jhoola-lab:23B0745:lang'

function readLang() {
  try {
    return localStorage.getItem(KEY) === 'hi' ? 'hi' : 'en'
  } catch {
    return 'en'
  }
}

// Holds the chosen language (English or Hindi) and remembers it on this tablet.
export default function LangProvider({ children }) {
  const [lang, setLangState] = useState(readLang)

  useEffect(() => {
    document.documentElement.lang = lang === 'hi' ? 'hi' : 'en'
  }, [lang])

  const setLang = useCallback((next) => {
    setLangState(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // Storage blocked: the choice still works until the page is closed.
    }
    logEvent(null, 'language', { lang: next })
  }, [])

  const value = useMemo(() => ({ lang, setLang, t: (key, vars) => translate(lang, key, vars) }), [lang, setLang])
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}
