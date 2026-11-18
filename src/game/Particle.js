import { rand, TAU, clamp } from './utils.js'

class Particle {
  constructor() { this.active = false }
  init(x, y, vx, vy, life, size, color, kind, drag = 0.96, spin = 0) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy
    this.life = life; this.maxLife = life; this.size = size
    this.color = color; this.kind = kind; this.drag = drag
    this.rot = rand(0, TAU); this.spin = spin
    this.active = true
  }
}

class Ring {
  constructor() { this.active = false }
  init(x, y, color, scale, life) {
    this.x = x; this.y = y; this.color = color
    this.r = 6 * scale; this.target = 70 * scale
    this.life = life; this.maxLife = life; this.active = true
  }
}

export class ParticleSystem {
  constructor(max = 900) {
    this.pool = Array.from({ length: max }, () => new Particle())
    this.active = []
    this.rings = Array.from({ length: 24 }, () => new Ring())
  }

  obtain() {
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].active) return this.pool[i]
    }
    return null
  }

  spawn(x, y, vx, vy, life, size, color, kind, drag, spin) {
    const p = this.obtain()
    if (!p) return null
    p.init(x, y, vx, vy, life, size, color, kind, drag, spin)
    this.active.push(p)
    return p
  }

  explosion(x, y, scale = 1, color = '#ffb257') {
    const n = Math.floor(18 * scale)
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), s = rand(40, 260) * scale
      this.spawn(x, y, Math.cos(a) * s, Math.sin(a) * s,
        rand(0.3, 0.85), rand(2, 6) * scale, i % 3 === 0 ? '#fff3c8' : color, 'spark', 0.93, rand(-8, 8))
    }
    for (let i = 0; i < Math.floor(10 * scale); i++) {
      const a = rand(0, TAU), s = rand(10, 90) * scale
      this.spawn(x, y, Math.cos(a) * s, Math.sin(a) * s,
        rand(0.5, 1.3), rand(8, 18) * scale, i % 2 ? '#3d4650' : '#6b6258', 'smoke', 0.96, rand(-2, 2))
    }
    if (scale > 1) {
      this.shockwave(x, y, scale > 2 ? '#ffd9a0' : '#ffb257', scale)
      this.spawn(x, y, 0, 0, 0.35, 18 * scale, '#fff6d8', 'flash', 1, 0)
      for (let i = 0; i < 12 * scale; i++) {
        const a = rand(0, TAU), s = rand(60, 320) * scale
        this.spawn(x, y, Math.cos(a) * s, Math.sin(a) * s, rand(0.4, 1.0), rand(2, 5), '#ff6b3d', 'spark', 0.95, 0)
      }
    }
  }

  shockwave(x, y, color = '#ffb257', scale = 1, life = 0.42) {
    const ring = this.rings.find(r => !r.active)
    if (!ring) return
    ring.init(x, y, color, scale, life)
  }

  debris(x, y, count = 8, color = '#8895a0') {
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU), s = rand(30, 180)
      this.spawn(x, y, Math.cos(a) * s, Math.sin(a) * s + 30, rand(0.6, 1.4), rand(2, 5), color, 'debris', 0.98, rand(-12, 12))
    }
  }

  trail(x, y, color = '#6fd8ff', vx = 0, vy = 60) {
    this.spawn(x + rand(-2, 2), y, vx + rand(-12, 12), vy + rand(0, 30), rand(0.25, 0.55), rand(2, 4.5), color, 'trail', 0.97)
  }

  smoke(x, y, vx = 0, vy = 30) {
    this.spawn(x + rand(-3, 3), y, vx + rand(-14, 14), vy + rand(0, 25), rand(0.5, 1.1), rand(4, 9), '#4c535c', 'smoke', 0.97, rand(-1, 1))
  }

  muzzle(x, y, dir = -1) {
    for (let i = 0; i < 3; i++) {
      this.spawn(x + rand(-2, 2), y, rand(-30, 30), dir * rand(60, 180), 0.1, rand(1.5, 3), '#ffe9a8', 'spark', 0.9)
    }
  }

  update(dt) {
    this.updateRings(dt)
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i]
      p.life -= dt
      if (p.life <= 0) {
        p.active = false
        this.active[i] = this.active[this.active.length - 1]
        this.active.pop()
        continue
      }
      const d = Math.pow(p.drag, dt * 60)
      p.vx *= d; p.vy *= d
      if (p.kind === 'smoke') p.vy -= 12 * dt
      if (p.kind === 'debris') p.vy += 90 * dt
      p.x += p.vx * dt; p.y += p.vy * dt
      p.rot += p.spin * dt
    }
  }

  updateRings(dt) {
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i]
      if (!r.active) continue
      r.life -= dt
      if (r.life <= 0) { r.active = false; continue }
      const k = 1 - r.life / r.maxLife
      r.r = 6 + (r.target - 6) * (1 - Math.pow(1 - k, 2))
    }
  }

  render(ctx) {
    for (const r of this.rings) {
      if (!r.active) continue
      const k = clamp(r.life / r.maxLife, 0, 1)
      ctx.save()
      ctx.globalAlpha = k * 0.6
      ctx.strokeStyle = r.color
      ctx.shadowColor = r.color
      ctx.shadowBlur = 14
      ctx.lineWidth = 2 + k * 4
      ctx.beginPath()
      ctx.arc(r.x, r.y, r.r, 0, TAU)
      ctx.stroke()
      ctx.restore()
    }
    for (const p of this.active) {
      const t = clamp(p.life / p.maxLife, 0, 1)
      ctx.globalAlpha = p.kind === 'smoke' ? t * 0.42 : t
      if (p.kind === 'flash') {
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * (1.6 - t * 0.6), 0, TAU)
        ctx.fill()
      } else if (p.kind === 'smoke') {
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * (1.6 - t * 0.6), 0, TAU)
        ctx.fill()
      } else if (p.kind === 'debris') {
        ctx.save()
        ctx.translate(p.x, p.y); ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.55)
        ctx.restore()
      } else {
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * (0.4 + t * 0.6), 0, TAU)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
  }

  clear() {
    for (const p of this.active) p.active = false
    this.active.length = 0
    for (const r of this.rings) r.active = false
  }
}
