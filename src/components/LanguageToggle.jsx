import { useLang } from '../lang.js'

const OPTIONS = [
  ['en', 'English'],
  ['hi', 'हिन्दी'],
]

// Two separate buttons: English and Hindi (in Devanagari script).
export default function LanguageToggle() {
  const { lang, setLang } = useLang()
  return (
    <div className="flex rounded-xl border border-slate-300 p-0.5 text-sm" role="group" aria-label="Language / भाषा">
      {OPTIONS.map(([id, label]) => (
        <button
          key={id}
          type="button"
          lang={id}
          onClick={() => setLang(id)}
          aria-pressed={lang === id}
          className={`min-h-9 rounded-lg px-3 font-semibold ${lang === id ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-indigo-50'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
