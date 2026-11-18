import { VW, VH } from './constants.js'
import { rand, TAU } from './utils.js'

const THEMES = {
  coast: { base: '#0b2434', deep: '#071a28', land: '#25463e', accent: '#3e6b5c', grid: 'rgba(94,214,199,0.05)', cloud: 'rgba(180,210,220,0.05)' },
  border: { base: '#16251f', deep: '#0c1715', land: '#26402f', accent: '#3b5a3d', grid: 'rgba(159,214,107,0.05)', cloud: 'rgba(200,220,200,0.04)' },
  desert: { base: '#3a3023', deep: '#2a231a', land: '#59452d', accent: '#7a5c38', grid: 'rgba(255,196,90,0.05)', cloud: 'rgba(230,210,170,0.04)' },
  night: { base: '#080f22', deep: '#050a17', land: '#152039', accent: '#22345a', grid: 'rgba(120,160,255,0.05)', cloud: 'rgba(140,170,230,0.05)' },
  base: { base: '#1a2823', deep: '#0e1918', land: '#2d4234', accent: '#405a43', grid: 'rgba(94,214,199,0.06)', cloud: 'rgba(200,220,200,0.04)' }
}

export class Background {
  constructor() {
    this.theme = 'coast'
    this.scroll = 0
    this.cloudScroll = 0
    this.tile = document.createElement('canvas')
    this.tile.width = VW
    this.tile.height = VH
    this.build('coast')
  }

  setTheme(theme) {
    if (!THEMES[theme]) theme = 'coast'
    this.theme = theme
    this.scroll = 0
    this.cloudScroll = 0
    this.build(theme)
  }

  build(theme) {
    const t = THEMES[theme]
    const c = this.tile.getContext('2d')
    c.clearRect(0, 0, VW, VH)
    const g = c.createLinearGradient(0, 0, 0, VH)
    g.addColorStop(0, t.deep)
    g.addColorStop(0.5, t.base)
    g.addColorStop(1, t.deep)
    c.fillStyle = g
    c.fillRect(0, 0, VW, VH)

    const m = 90
    const randPos = () => ({ x: rand(m, VW - m), y: rand(m, VH - m) })

    if (theme === 'coast') {
      for (let i = 0; i < 12; i++) {
        const p = randPos(), r = rand(35, 105)
        c.fillStyle = 'rgba(30,70,80,0.5)'
        c.beginPath(); c.ellipse(p.x, p.y, r * 1.5, r, rand(0, TAU), 0, TAU); c.fill()
        c.fillStyle = t.land
        c.beginPath(); c.ellipse(p.x, p.y, r, r * 0.62, rand(0, TAU), 0, TAU); c.fill()
        c.strokeStyle = 'rgba(110,170,140,0.25)'; c.lineWidth = 2
        c.beginPath(); c.ellipse(p.x, p.y, r * 1.25, r * 0.8, 0, 0, TAU); c.stroke()
      }
      c.strokeStyle = 'rgba(140,220,230,0.08)'; c.lineWidth = 1
      for (let i = 0; i < 45; i++) {
        const p = randPos()
        c.beginPath(); c.moveTo(p.x - 18, p.y); c.quadraticCurveTo(p.x, p.y - 5, p.x + 18, p.y); c.stroke()
      }
    } else if (theme === 'border') {
      for (let i = 0; i < 18; i++) {
        const p = randPos(), r = rand(25, 70)
        c.fillStyle = t.land
        c.beginPath(); c.ellipse(p.x, p.y, r, r * 0.7, rand(0, TAU), 0, TAU); c.fill()
      }
      c.strokeStyle = 'rgba(180,190,140,0.16)'; c.lineWidth = 8
      c.beginPath(); c.moveTo(0, VH * 0.62); c.bezierCurveTo(300, VH * 0.5, 800, VH * 0.75, VW, VH * 0.55); c.stroke()
      c.strokeStyle = 'rgba(230,220,160,0.12)'; c.lineWidth = 2
      c.beginPath(); c.moveTo(0, VH * 0.62); c.bezierCurveTo(300, VH * 0.5, 800, VH * 0.75, VW, VH * 0.55); c.stroke()
      for (let i = 0; i < 26; i++) {
        const p = randPos()
        c.fillStyle = 'rgba(10,25,15,0.4)'
        c.beginPath(); c.arc(p.x, p.y, rand(8, 22), 0, TAU); c.fill()
      }
    } else if (theme === 'desert') {
      for (let i = 0; i < 16; i++) {
        const p = randPos(), r = rand(45, 140)
        c.fillStyle = i % 2 ? t.land : t.accent
        c.globalAlpha = 0.55
        c.beginPath(); c.ellipse(p.x, p.y, r, r * 0.4, rand(-0.5, 0.5), 0, TAU); c.fill()
        c.globalAlpha = 1
      }
      c.strokeStyle = 'rgba(230,190,120,0.14)'; c.lineWidth = 3
      for (let i = 0; i < 12; i++) {
        const p = randPos()
        c.beginPath(); c.moveTo(p.x - 60, p.y); c.quadraticCurveTo(p.x, p.y - 20, p.x + 70, p.y + 5); c.stroke()
      }
      for (let i = 0; i < 22; i++) {
        const p = randPos(), s = rand(4, 11)
        c.fillStyle = 'rgba(60,45,30,0.6)'
        c.fillRect(p.x - s / 2, p.y - s / 3, s, s * 0.6)
      }
    } else if (theme === 'night') {
      c.fillStyle = 'rgba(255,255,255,0.5)'
      for (let i = 0; i < 130; i++) {
        const p = { x: rand(0, VW), y: rand(0, VH) }
        const s = rand(0.5, 1.5)
        c.globalAlpha = rand(0.2, 0.8)
        c.fillRect(p.x, p.y, s, s)
      }
      c.globalAlpha = 1
      for (let i = 0; i < 22; i++) {
        const p = randPos(), r = rand(30, 90)
        c.fillStyle = t.land
        c.beginPath(); c.ellipse(p.x, p.y, r, r * 0.7, 0, 0, TAU); c.fill()
        c.fillStyle = 'rgba(255,200,110,0.5)'
        for (let j = 0; j < 9; j++) {
          c.fillRect(p.x + rand(-r * 0.7, r * 0.7), p.y + rand(-r * 0.4, r * 0.4), rand(1.5, 3), rand(1.5, 3))
        }
      }
    } else if (theme === 'base') {
      c.fillStyle = t.land
      for (let i = 0; i < 8; i++) {
        const p = randPos(), w = rand(80, 220), h = rand(60, 150)
        c.fillRect(p.x - w / 2, p.y - h / 2, w, h)
      }
      c.fillStyle = '#1d2b2a'
      c.fillRect(180, 150, 900, 52)
      c.strokeStyle = 'rgba(230,240,220,0.28)'; c.lineWidth = 3
      c.setLineDash([26, 22])
      c.beginPath(); c.moveTo(200, 176); c.lineTo(1060, 176); c.stroke()
      c.setLineDash([])
      c.strokeStyle = 'rgba(190,210,180,0.18)'; c.lineWidth = 6
      c.beginPath(); c.moveTo(0, 420); c.lineTo(VW, 420); c.stroke()
      c.beginPath(); c.moveTo(320, 0); c.lineTo(320, VH); c.stroke()
      c.fillStyle = 'rgba(60,90,60,0.6)'
      for (let i = 0; i < 14; i++) {
        const p = randPos()
        c.fillRect(p.x - 16, p.y - 10, 32, 20)
      }
    }

    c.strokeStyle = t.grid
    c.lineWidth = 1
    for (let x = 0; x <= VW; x += 80) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, VH); c.stroke() }
    for (let y = 0; y <= VH; y += 80) { c.beginPath(); c.moveTo(0, y); c.lineTo(VW, y); c.stroke() }
  }

  update(dt, speed = 90) {
    this.scroll = (this.scroll + speed * dt) % VH
    this.cloudScroll = (this.cloudScroll + speed * 0.35 * dt) % VH
  }

  render(ctx) {
    const t = THEMES[this.theme]
    ctx.drawImage(this.tile, 0, this.scroll - VH)
    ctx.drawImage(this.tile, 0, this.scroll)

    // cloud haze parallax
    ctx.save()
    ctx.globalAlpha = 0.55
    ctx.fillStyle = t.cloud
    for (let i = 0; i < 7; i++) {
      const x = (i * 211 + this.cloudScroll * 0.3) % (VW + 300) - 150
      const y = ((i * 173 + this.cloudScroll) % (VH + 240)) - 120
      ctx.beginPath(); ctx.ellipse(x, y, 120, 34, 0, 0, TAU); ctx.fill()
    }
    ctx.restore()

    // speed streaks
    ctx.strokeStyle = 'rgba(180,230,235,0.035)'
    ctx.lineWidth = 1
    for (let i = 0; i < 18; i++) {
      const x = (i * 137.5) % VW
      const y = ((i * 97 + this.scroll * 1.6) % (VH + 120)) - 60
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 42); ctx.stroke()
    }
  }
}
