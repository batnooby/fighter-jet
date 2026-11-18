import { INSTALLATION_TYPES, VH } from './constants.js'
import { rand, clamp, TAU } from './utils.js'

export class Installation {
  constructor(type, x, y, opts = {}) {
    const cfg = INSTALLATION_TYPES[type] || INSTALLATION_TYPES.aa
    this.type = type
    this.cfg = cfg
    this.name = cfg.name
    this.x = x; this.y = y
    this.restY = opts.restY ?? rand(200, VH - 180)
    this.scrollSpeed = opts.scrollSpeed ?? 55
    this.radius = cfg.radius
    this.maxHp = Math.round(cfg.hp * (opts.hpScale || 1))
    this.hp = this.maxHp
    this.alive = true
    this.t = rand(0, 10)
    this.flash = 0
    this.fireTimer = rand(0.5, cfg.fireRate || 2)
    this.score = Math.round(cfg.score * (opts.scoreScale || 1))
    this.color = cfg.color
    this.delay = opts.delay || 0
    this.damaged = false
  }

  takeDamage(amount, game) {
    if (!this.alive) return
    this.hp -= amount
    this.flash = 0.1
    if (this.hp < this.maxHp * 0.5) this.damaged = true
    if (this.hp <= 0) this.die(game)
  }

  die(game) {
    if (!this.alive) return
    this.alive = false
    game.particles.explosion(this.x, this.y, this.radius > 30 ? 2.1 : 1.4, '#ffb257')
    game.particles.debris(this.x, this.y, 14, this.color)
    game.audio.explosion(this.radius > 30)
    game.shake = Math.max(game.shake, this.radius > 30 ? 14 : 8)
    game.onInstallationDestroyed(this)
  }

  update(dt, game) {
    if (!this.alive) return
    this.t += dt
    this.flash = Math.max(0, this.flash - dt)
    if (this.delay > 0) { this.delay -= dt; return }
    if (this.y < this.restY) this.y = Math.min(this.restY, this.y + this.scrollSpeed * dt)

    if (this.cfg.fireRate > 0 && this.y > 20 && this.y < VH - 30 && game.player?.alive) {
      this.fireTimer -= dt
      if (this.fireTimer <= 0) {
        const p = game.player
        const aim = Math.atan2(p.y - this.y, p.x - this.x)
        const sp = 210
        if (this.type === 'hq') {
          for (let i = -1; i <= 1; i++) {
            game.projectiles.spawnEnemyBullet(this.x, this.y - 10, Math.cos(aim + i * 0.18) * sp, Math.sin(aim + i * 0.18) * sp, 11, 5)
          }
        } else {
          game.projectiles.spawnEnemyBullet(this.x, this.y - 10, Math.cos(aim) * sp, Math.sin(aim) * sp, 10, 4)
        }
        game.particles.muzzle(this.x, this.y - 12, -1)
        this.fireTimer = this.cfg.fireRate * rand(0.85, 1.2)
      }
    }

    if (this.damaged && Math.random() < dt * 9) {
      game.particles.smoke(this.x + rand(-12, 12), this.y + rand(-8, 8), rand(-8, 8), -30)
    }
  }

  render(ctx) {
    if (!this.alive || this.y < -80) return
    ctx.save()
    ctx.translate(this.x, this.y)
    const c = this.flash > 0 ? '#ffffff' : this.color

    // concrete pad
    ctx.fillStyle = 'rgba(40,52,54,0.85)'
    ctx.fillRect(-this.radius - 10, -this.radius * 0.7, (this.radius + 10) * 2, this.radius * 1.6)
    ctx.strokeStyle = 'rgba(120,150,140,0.3)'; ctx.lineWidth = 1
    ctx.strokeRect(-this.radius - 10, -this.radius * 0.7, (this.radius + 10) * 2, this.radius * 1.6)

    switch (this.type) {
      case 'radar': this.drawRadar(ctx, c); break
      case 'hangar': this.drawHangar(ctx, c); break
      case 'depot': this.drawDepot(ctx, c); break
      case 'hq': this.drawHQ(ctx, c); break
      default: this.drawAA(ctx, c)
    }

    if (this.damaged) {
      ctx.strokeStyle = 'rgba(20,20,20,0.7)'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(-12, -8); ctx.lineTo(-4, 0); ctx.lineTo(-10, 8); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(10, -6); ctx.lineTo(4, 2); ctx.lineTo(12, 6); ctx.stroke()
      if (Math.floor(this.t * 6) % 2 === 0) {
        ctx.fillStyle = '#ff8a3d'; ctx.shadowColor = '#ff5a2a'; ctx.shadowBlur = 12
        ctx.beginPath(); ctx.arc(4, 2, 3, 0, TAU); ctx.fill(); ctx.shadowBlur = 0
      }
    }
    ctx.restore()

    const w = this.radius * 2.2
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(this.x - w / 2, this.y - this.radius - 16, w, 4)
    ctx.fillStyle = this.hp / this.maxHp > 0.5 ? '#9fd66b' : '#ff5a5a'
    ctx.fillRect(this.x - w / 2, this.y - this.radius - 16, w * (this.hp / this.maxHp), 4)
  }

  drawAA(ctx, c) {
    ctx.fillStyle = c
    ctx.fillRect(-15, -6, 30, 18)
    ctx.fillStyle = '#384443'
    ctx.beginPath(); ctx.arc(0, -8, 9, 0, TAU); ctx.fill()
    ctx.save(); ctx.translate(0, -8); ctx.rotate(Math.sin(this.t * 0.7) * 0.5)
    ctx.fillStyle = c
    ctx.fillRect(-3, -3, 6, -22)
    ctx.restore()
    ctx.fillStyle = '#ffb257'; ctx.fillRect(-18, 8, 8, 4); ctx.fillRect(10, 8, 8, 4)
  }

  drawRadar(ctx, c) {
    ctx.fillStyle = '#3d4f49'
    ctx.fillRect(-8, -4, 16, 18)
    ctx.save(); ctx.translate(0, -8)
    ctx.rotate(this.t * 0.9)
    ctx.strokeStyle = c; ctx.lineWidth = 2.5
    ctx.beginPath(); ctx.ellipse(0, 0, 17, 7, 0, 0, TAU); ctx.stroke()
    ctx.beginPath(); ctx.ellipse(0, 0, 7, 17, 0, 0, TAU); ctx.stroke()
    ctx.restore()
    ctx.fillStyle = '#8ff5e6'; ctx.shadowColor = '#5ed6c7'; ctx.shadowBlur = 8
    ctx.beginPath(); ctx.arc(0, -8, 3, 0, TAU); ctx.fill(); ctx.shadowBlur = 0
    ctx.fillStyle = c; ctx.fillRect(-14, 12, 28, 4)
  }

  drawHangar(ctx, c) {
    ctx.fillStyle = c
    ctx.fillRect(-30, -14, 60, 32)
    ctx.fillStyle = '#2c3937'
    ctx.beginPath(); ctx.moveTo(-34, -14); ctx.lineTo(0, -28); ctx.lineTo(34, -14); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#1a2326'
    ctx.fillRect(-18, -10, 36, 26)
    ctx.strokeStyle = '#5ed6c7'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(-18, -10); ctx.lineTo(18, 16); ctx.moveTo(18, -10); ctx.lineTo(-18, 16); ctx.stroke()
    ctx.fillStyle = '#ffc45a'; ctx.fillRect(-24, -6, 4, 4); ctx.fillRect(20, -6, 4, 4)
  }

  drawDepot(ctx, c) {
    ctx.fillStyle = '#4a4a3f'
    for (let i = -2; i <= 2; i++) {
      ctx.fillRect(i * 11 - 5, -12 + Math.abs(i) * 2, 10, 24 - Math.abs(i) * 2)
      ctx.fillStyle = c
      ctx.fillRect(i * 11 - 5, -14 + Math.abs(i) * 2, 10, 4)
      ctx.fillStyle = '#4a4a3f'
    }
    ctx.fillStyle = '#ff8a3d'
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(i * 12, 8, 2.5, 0, TAU); ctx.fill() }
  }

  drawHQ(ctx, c) {
    ctx.fillStyle = c
    ctx.fillRect(-30, -18, 60, 38)
    ctx.fillStyle = '#39454f'
    ctx.fillRect(-36, 20, 72, 6)
    ctx.fillStyle = '#202b33'
    for (let r = 0; r < 3; r++) for (let i = -2; i <= 2; i++) {
      ctx.fillRect(i * 11 - 3, -12 + r * 11, 6, 6)
    }
    ctx.fillStyle = '#5ed6c7'; ctx.shadowColor = '#5ed6c7'; ctx.shadowBlur = 10
    ctx.fillRect(-3, -34, 6, 14)
    ctx.beginPath(); ctx.arc(0, -36, 4, 0, TAU); ctx.fill()
    ctx.shadowBlur = 0
    ctx.fillStyle = '#ff5a5a'
    ctx.beginPath(); ctx.arc(-22, -24, 3, 0, TAU); ctx.fill()
    ctx.beginPath(); ctx.arc(22, -24, 3, 0, TAU); ctx.fill()
  }
}
