const BUTTON = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-100',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  ghost: 'text-indigo-700 hover:bg-indigo-50',
}

export function Button({ variant = 'primary', className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON[variant]} ${className}`}
      {...props}
    />
  )
}

const CARD = {
  plain: 'border-slate-200 bg-white',
  good: 'border-emerald-300 bg-emerald-50',
  warn: 'border-amber-300 bg-amber-50',
  info: 'border-indigo-200 bg-indigo-50',
  bad: 'border-rose-300 bg-rose-50',
}

export function Card({ tone = 'plain', className = '', children, ...props }) {
  return (
    <section className={`rounded-2xl border p-4 sm:p-5 ${CARD[tone]} ${className}`} {...props}>
      {children}
    </section>
  )
}

export function Key({ children }) {
  return <mark className="rounded bg-amber-200 px-1 font-semibold text-slate-900">{children}</mark>
}
