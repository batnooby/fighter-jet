export const clamp = (v, a, b) => v < a ? a : v > b ? b : v
export const lerp = (a, b, t) => a + (b - a) * t
export const rand = (a, b) => a + Math.random() * (b - a)
export const randInt = (a, b) => Math.floor(rand(a, b + 1))
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
export const dist2 = (ax, ay, bx, by) => (ax - bx) ** 2 + (ay - by) ** 2
export const dist = (ax, ay, bx, by) => Math.sqrt(dist2(ax, ay, bx, by))
export const TAU = Math.PI * 2

export function angleLerp(a, b, t) {
  let d = (b - a + Math.PI) % TAU - Math.PI
  if (d < -Math.PI) d += TAU
  return a + d * t
}

export function circlesHit(ax, ay, ar, bx, by, br) {
  const dx = ax - bx, dy = ay - by
  const r = ar + br
  return dx * dx + dy * dy <= r * r
}

export function formatScore(n) {
  return Math.max(0, Math.floor(n)).toString().padStart(7, '0')
}
