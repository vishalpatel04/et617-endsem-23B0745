// Ideal simple pendulum (small angles, up to 20°): T = 2π √(L / g)
export const GRAVITY = 9.81
// Two periods closer than this are "about the same": smaller than stopwatch error.
export const SAME_THRESHOLD = 0.03

export function idealPeriod(lengthCm) {
  return 2 * Math.PI * Math.sqrt(lengthCm / 100 / GRAVITY)
}

export function round2(value) {
  return Math.round(value * 100) / 100
}

// A hand-held stopwatch starts and stops a little late, so the 10-swing time has up to ±0.08 s error.
export function measureTenSwings(lengthCm, random = Math.random) {
  return round2(10 * idealPeriod(lengthCm) + (random() - 0.5) * 0.16)
}

export function changedVariables(a, b) {
  return ['length', 'mass', 'angle'].filter((key) => a[key] !== b[key])
}

export function compareTrials(previous, current) {
  const diff = round2(current.period - previous.period)
  return { changed: changedVariables(previous, current), diff, same: Math.abs(diff) < SAME_THRESHOLD }
}
