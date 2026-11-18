import { clamp } from './utils.js'

class TextItem {
  constructor() { this.active = false }
  init(x, y, text, color, size, life) {
    this.x = x; this.y = y; this.text = text; this.color = color
    this.size = size; this.life = life; this.maxLife = life
    this.vy = -52; this.active = true
  }
}

export class FloatingText {
  constructor(max = 60) {
    this.pool = Array.from({ length: max }, () => new TextItem())
    this.active = []
  }

  obtain() {
    for (const t of this.pool) if (!t.active) return t
    return null
  }

  add(x, y, text, color = '#8ff5e6', size = 14, life = 1.1) {
    const t = this.obtain()
    if (!t) return
    t.init(x, y, text, color, size, life)
    this.active.push(t)
  }

  update(dt) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const t = this.active[i]
      t.life -= dt
      if (t.life <= 0) {
        t.active = false
        this.active[i] = this.active[this.active.length - 1]
        this.active.pop()
        continue
      }
      t.y += t.vy * dt
      t.vy *= Math.pow(0.94, dt * 60)
    }
  }

  render(ctx) {
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const t of this.active) {
      const k = clamp(t.life / t.maxLife, 0, 1)
      ctx.globalAlpha = Math.min(1, k * 2.2)
      ctx.font = `bold ${t.size}px Consolas, monospace`
      ctx.fillStyle = 'rgba(0,0,0,0.65)'
      ctx.fillText(t.text, t.x + 1, t.y + 1)
      ctx.fillStyle = t.color
      ctx.fillText(t.text, t.x, t.y)
    }
    ctx.restore()
  }

  clear() {
    for (const t of this.active) t.active = false
    this.active.length = 0
  }
}
