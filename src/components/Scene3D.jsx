// 3D view of the pendulum: every point of the scene is rotated by the "turn the view" angle
// and drawn with perspective, so the learner can walk around the stand.
const FOCAL = 700
const PITCH = (16 * Math.PI) / 180
const OX = 160
const OY = 46
const PX_PER_CM = 2.3
const FLOOR_Y = 100 * PX_PER_CM + 46

function project(x, y, z, yaw) {
  const x1 = x * Math.cos(yaw) + z * Math.sin(yaw)
  const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw)
  const y2 = y * Math.cos(PITCH) - z1 * Math.sin(PITCH)
  const z2 = y * Math.sin(PITCH) + z1 * Math.cos(PITCH)
  const s = FOCAL / (FOCAL + z2)
  return { x: OX + x1 * s, y: OY + y2 * s, s }
}

const pt = (p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`

export default function Scene3D({ length, mass, angle, theta, turn }) {
  const yaw = (turn * Math.PI) / 180
  const L = length * PX_PER_CM
  const rad = (theta * Math.PI) / 180
  const bobX = L * Math.sin(rad)
  const bobY = L * Math.cos(rad)
  const pivot = project(0, 0, 0, yaw)
  const bob = project(bobX, bobY, 0, yaw)
  const radius = (8 + mass / 40) * bob.s
  const shadow = project(bobX, FLOOR_Y, 0, yaw)
  const corners = [
    [-150, -110],
    [150, -110],
    [150, 110],
    [-150, 110],
  ].map(([x, z]) => project(x, FLOOR_Y, z, yaw))
  const grid = []
  for (let x = -150; x <= 150; x += 50) grid.push([project(x, FLOOR_Y, -110, yaw), project(x, FLOOR_Y, 110, yaw)])
  for (let z = -110; z <= 110; z += 55) grid.push([project(-150, FLOOR_Y, z, yaw), project(150, FLOOR_Y, z, yaw)])
  const posts = [-120, 120].map((x) => [project(x, -6, 0, yaw), project(x, FLOOR_Y, 0, yaw)])
  const beam = [project(-128, -6, 0, yaw), project(128, -6, 0, yaw)]
  const path = Array.from({ length: 25 }, (_, i) => {
    const a = ((-angle + (2 * angle * i) / 24) * Math.PI) / 180
    return project(L * Math.sin(a), L * Math.cos(a), 0, yaw)
  })

  return (
    <svg viewBox="0 0 320 330" className="w-full max-w-[22rem]" role="img" aria-label={`3D view of the pendulum, turned ${turn} degrees`}>
      <defs>
        <radialGradient id="bob-shade" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="45%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#92400e" />
        </radialGradient>
        <linearGradient id="floor-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
      </defs>
      <polygon points={corners.map(pt).join(' ')} fill="url(#floor-shade)" stroke="#94a3b8" />
      {grid.map(([a, b], i) => (
        <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#94a3b8" strokeWidth="0.6" opacity="0.7" />
      ))}
      <ellipse cx={shadow.x} cy={shadow.y} rx={radius * 1.3} ry={radius * 0.45} fill="#0f172a" opacity="0.25" />
      {posts.map(([a, b], i) => (
        <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#475569" strokeWidth={5 * a.s} strokeLinecap="round" />
      ))}
      <line x1={beam[0].x} y1={beam[0].y} x2={beam[1].x} y2={beam[1].y} stroke="#334155" strokeWidth={7 * pivot.s} strokeLinecap="round" />
      <polyline points={path.map(pt).join(' ')} fill="none" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="4 4" />
      <line x1={pivot.x} y1={pivot.y} x2={bob.x} y2={bob.y} stroke="#0f172a" strokeWidth="1.8" />
      <circle cx={bob.x} cy={bob.y} r={radius} fill="url(#bob-shade)" />
      <circle cx={pivot.x} cy={pivot.y} r={3.5 * pivot.s} fill="#0f172a" />
    </svg>
  )
}
