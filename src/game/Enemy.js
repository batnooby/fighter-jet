import { ENEMY_TYPES, VH, VW } from './constants.js'
import { rand, clamp, lerp, TAU, angleLerp } from './utils.js'

export class Enemy {
  constructor(type, x, y, opts = {}) {
    const cfg = ENEMY_TYPES[type] || ENEMY_TYPES.basic
    this.type = type
    this.cfg = cfg
    this.name = cfg.name
    this.x = x; this.y = y
    this.spawnX = x; this.spawnY = y
    this.radius = cfg.radius * (opts.scale || 1)
    this.maxHp = Math.round(cfg.hp * (opts.hpScale || 1))
    this.hp = this.maxHp
    this.speed = cfg.speed * (opts.speedScale || 1)
    this.score = Math.round(cfg.score * (opts.scoreScale || 1))
    this.color = cfg.color
    this.alive = true
    this.escaped = false
    this.isBoss = type === 'boss'
    this.t = rand(0, 6)
    this.fireTimer = rand(0.6, cfg.fireRate || 1)
    this.missileTimer = rand(1.5, 3.5)
    this.flash = 0
    this.angle = Math.PI / 2
    this.vx = opts.vx || 0
    this.vy = opts.vy || 0
    this.amp = opts.amp || rand(40, 110)
    this.freq = opts.freq || rand(0.8, 1.8)
    this.phase = 1
    this.phaseTimer = 0
    this.entry = this.isBoss ? 0 : 1
    this.delay = opts.delay || 0
    this.pattern = opts.pattern || cfg.pattern
    this.hpBarTimer = 0
  }

  takeDamage(amount, game) {
    if (!this.alive) return
    this.hp -= amount
    this.flash = 0.09
    this.hpBarTimer = 1.6
    if (this.isBoss) {
      const p = this.hp / this.maxHp
      const newPhase = p > 0.66 ? 1 : p > 0.33 ? 2 : 3
      if (newPhase !== this.phase) {
        this.phase = newPhase
        game.audio.warning()
        game.toast(`ENEMY COMMANDER – PHASE ${newPhase}`)
        game.particles.explosion(this.x, this.y, 1.4, '#ff8a5a')
        game.shake = 14
      }
    }
    if (this.hp <= 0) this.die(game)
  }

  die(game) {
    if (!this.alive) return
    this.alive = false
    game.particles.explosion(this.x, this.y, this.isBoss ? 3.2 : this.radius > 26 ? 1.5 : 0.9, '#ffb257')
    game.particles.debris(this.x, this.y, this.isBoss ? 30 : 8, this.color)
    game.audio.explosion(this.isBoss || this.radius > 26)
    if (this.isBoss) { game.shake = 34; game.toast('COMMANDER AIRCRAFT DESTROYED') }
    game.onEnemyDestroyed(this)
  }

  update(dt, game) {
    if (!this.alive) return
    this.t += dt
    this.flash = Math.max(0, this.flash - dt)
    this.hpBarTimer = Math.max(0, this.hpBarTimer - dt)
    if (this.delay > 0) { this.delay -= dt; return }
    const player = game.player

    if (this.isBoss) {
      this.updateBoss(dt, game)
    } else {
      switch (this.pattern) {
        case 'sine': {
          this.y += this.speed * dt
          this.x = this.spawnX + Math.sin(this.t * this.freq) * this.amp
          this.vx = Math.cos(this.t * this.freq) * this.amp * this.freq
          break
        }
        case 'dive': {
          if (this.t < 1.2) {
            this.y += this.speed * 1.5 * dt
            this.vx = lerp(this.vx, player ? (player.x - this.x) * 2.2 : 0, clamp(dt * 2.4, 0, 1))
          } else {
            this.vx *= Math.pow(0.4, dt)
          }
          this.x += this.vx * dt
          this.y += this.speed * 1.15 * dt
          break
        }
        case 'track': {
          if (player) {
            const desiredX = clamp(player.x + (player.vx || 0) * 0.35, 40, VW - 40)
            this.vx += (desiredX - this.x) * dt * 1.35
            this.vx = clamp(this.vx, -this.speed * 1.35, this.speed * 1.35)
          }
          this.x += this.vx * dt
          this.y += this.speed * 0.72 * dt
          break
        }
        case 'straight':
        default: {
          this.x += this.vx * dt
          this.y += this.speed * dt
          break
        }
      }
      this.angle = angleLerp(this.angle, Math.atan2(this.vy || this.speed, this.vx || 0), clamp(dt * 4, 0, 1))
      if (this.x < -70) this.x = VW + 60
      if (this.x > VW + 70) this.x = -60
    }

    this.fireTimer -= dt
    if (this.fireTimer <= 0 && this.y > 0 && this.y < VH - 40) {
      this.fire(game, player)
      this.fireTimer = (this.cfg.fireRate || 1.5) * rand(0.8, 1.25)
    }

    if (this.cfg.missile || this.isBoss) {
      this.missileTimer -= dt
      if (this.missileTimer <= 0 && player && player.alive && this.y > 10 && this.y < VH - 120) {
        const count = this.isBoss ? (this.phase >= 2 ? 2 : 1) : 1
        for (let i = 0; i < count; i++) {
          game.projectiles.spawnEnemyMissile(this.x + (i ? 26 : -26), this.y + 14, player, 190 + this.phase * 22)
        }
        game.audio.warning()
        game.missileWarning = 2.2
        this.missileTimer = this.isBoss ? rand(2.2, 3.6) : rand(4.5, 6.5)
      }
    }

    if (!this.isBoss && this.y > VH + 90) {
      this.alive = false
      this.escaped = true
      game.onEnemyEscaped(this)
    }
  }

  fire(game, player) {
    if (!player || !player.alive) return
    const aim = Math.atan2(player.y - this.y, player.x - this.x)
    const sp = this.cfg.bulletSpeed || 240
    const shoot = (ang, dmg = 9) => {
      game.projectiles.spawnEnemyBullet(this.x, this.y + 10, Math.cos(ang) * sp, Math.sin(ang) * sp, dmg, 4)
    }
    switch (this.type) {
      case 'interceptor':
        shoot(aim - 0.07); shoot(aim + 0.07)
        break
      case 'heavy':
        shoot(aim - 0.22); shoot(aim); shoot(aim + 0.22)
        break
      case 'bomber':
        for (let i = -2; i <= 2; i++) shoot(aim + i * 0.17, 11)
        break
      case 'advanced':
        shoot(aim - 0.12); shoot(aim + 0.12, 12)
        break
      default:
        shoot(aim)
    }
    game.particles.muzzle(this.x, this.y + 10, 1)
  }

  updateBoss(dt, game) {
    const player = game.player
    if (this.entry < 1) {
      this.entry = Math.min(1, this.entry + dt * 0.45)
      this.y = lerp(-80, 150, this.entry)
      this.x = VW / 2
      return
    }
    this.y = 150 + Math.sin(this.t * 0.9) * 26
    const range = 300 + this.phase * 70
    const targetX = player ? VW / 2 + Math.sin(this.t * (0.55 + this.phase * 0.12)) * range : VW / 2
    this.x = lerp(this.x, clamp(targetX, 130, VW - 130), clamp(dt * 1.8, 0, 1))

    this.phaseTimer += dt
    const interval = this.phase === 1 ? 2.6 : this.phase === 2 ? 1.8 : 1.25
    if (this.phaseTimer > interval) {
      this.phaseTimer = 0
      const n = 8 + this.phase * 4
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + this.t * 0.5
        const sp = 180 + this.phase * 30
        game.projectiles.spawnEnemyBullet(this.x, this.y, Math.cos(a) * sp, Math.sin(a) * sp, 10, 5)
      }
      if (player && this.phase >= 2) {
        for (let i = -1; i <= 1; i++) {
          const aim = Math.atan2(player.y - this.y, player.x + i * 70 - this.x)
          game.projectiles.spawnEnemyBullet(this.x + i * 50, this.y + 10, Math.cos(aim) * 300, Math.sin(aim) * 300, 12, 5)
        }
      }
      game.audio.warning()
      game.particles.explosion(this.x, this.y, 0.5, '#ff7a5a')
    }
  }

  render(ctx) {
    if (!this.alive) return
    ctx.save()
    ctx.translate(this.x, this.y)
    if (this.flash > 0) ctx.shadowColor = '#ffffff', ctx.shadowBlur = 24
    const c = this.flash > 0 ? '#ffffff' : this.color

    switch (this.type) {
      case 'interceptor': this.drawInterceptor(ctx, c); break
      case 'heavy': this.drawHeavy(ctx, c); break
      case 'bomber': this.drawBomber(ctx, c); break
      case 'advanced': this.drawAdvanced(ctx, c); break
      case 'boss': this.drawBoss(ctx, c); break
      default: this.drawBasic(ctx, c)
    }
    ctx.restore()

    if (this.hpBarTimer > 0 && !this.isBoss) {
      const w = this.radius * 2.4
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(this.x - w / 2, this.y - this.radius - 14, w, 4)
      ctx.fillStyle = this.hp / this.maxHp > 0.5 ? '#9fd66b' : '#ff5a5a'
      ctx.fillRect(this.x - w / 2, this.y - this.radius - 14, w * (this.hp / this.maxHp), 4)
    }
  }

  drawBasic(ctx, c) {
    ctx.fillStyle = '#2a3038'
    ctx.beginPath(); ctx.moveTo(-6, 2); ctx.lineTo(-26, 16); ctx.lineTo(-24, 21); ctx.lineTo(-4, 12); ctx.lineTo(4, 12); ctx.lineTo(24, 21); ctx.lineTo(26, 16); ctx.lineTo(6, 2); ctx.closePath(); ctx.fill()
    ctx.fillStyle = c
    ctx.beginPath()
    ctx.moveTo(0, -22); ctx.lineTo(7, -12); ctx.lineTo(7, 10); ctx.lineTo(-7, 10); ctx.lineTo(-7, -12); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#ffca8a'; ctx.shadowColor = '#ff8a44'; ctx.shadowBlur = 10
    ctx.fillRect(-4, 10, 3, 6); ctx.fillRect(1, 10, 3, 6)
    ctx.shadowBlur = 0
    ctx.fillStyle = '#8fd8e0'
    ctx.beginPath(); ctx.ellipse(0, -8, 3.5, 7, 0, 0, TAU); ctx.fill()
  }

  drawInterceptor(ctx, c) {
    ctx.fillStyle = c
    ctx.beginPath()
    ctx.moveTo(0, -20); ctx.lineTo(5, -6); ctx.lineTo(24, 12); ctx.lineTo(20, 16)
    ctx.lineTo(4, 8); ctx.lineTo(3, 14); ctx.lineTo(-3, 14); ctx.lineTo(-4, 8)
    ctx.lineTo(-20, 16); ctx.lineTo(-24, 12); ctx.lineTo(-5, -6); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#fff0c0'; ctx.shadowColor = '#ffb45a'; ctx.shadowBlur = 8
    ctx.fillRect(-2, 12, 4, 7); ctx.shadowBlur = 0
    ctx.fillStyle = '#263038'; ctx.fillRect(-2.5, -10, 5, 8)
  }

  drawHeavy(ctx, c) {
    ctx.fillStyle = '#3d434c'
    ctx.beginPath(); ctx.moveTo(-8, 2); ctx.lineTo(-38, 14); ctx.lineTo(-36, 22); ctx.lineTo(-6, 13); ctx.lineTo(6, 13); ctx.lineTo(36, 22); ctx.lineTo(38, 14); ctx.lineTo(8, 2); ctx.closePath(); ctx.fill()
    ctx.fillStyle = c
    ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(13, -12); ctx.lineTo(13, 16); ctx.lineTo(-13, 16); ctx.lineTo(-13, -12); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#9fd66b'; ctx.fillRect(-30, 14, 8, 3); ctx.fillRect(22, 14, 8, 3)
    ctx.fillStyle = '#ff9966'; ctx.shadowColor = '#ff6a44'; ctx.shadowBlur = 12
    ctx.fillRect(-9, 15, 6, 8); ctx.fillRect(3, 15, 6, 8); ctx.shadowBlur = 0
    ctx.fillStyle = '#1f2a33'; ctx.beginPath(); ctx.ellipse(0, -10, 5, 9, 0, 0, TAU); ctx.fill()
  }

  drawBomber(ctx, c) {
    ctx.fillStyle = '#4a4038'
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-46, 18); ctx.lineTo(-42, 27); ctx.lineTo(-8, 16); ctx.lineTo(8, 16); ctx.lineTo(42, 27); ctx.lineTo(46, 18); ctx.lineTo(10, 0); ctx.closePath(); ctx.fill()
    ctx.fillStyle = c
    ctx.beginPath(); ctx.ellipse(0, -2, 15, 30, 0, 0, TAU); ctx.fill()
    ctx.fillStyle = '#3b302a'; ctx.fillRect(-13, -24, 26, 9)
    ctx.fillStyle = '#ffb060'; ctx.shadowColor = '#ff7733'; ctx.shadowBlur = 14
    ctx.fillRect(-11, 25, 7, 9); ctx.fillRect(4, 25, 7, 9); ctx.shadowBlur = 0
    ctx.fillStyle = '#20272d'; ctx.fillRect(-4, -18, 8, 10)
  }

  drawAdvanced(ctx, c) {
    ctx.save(); ctx.shadowColor = '#b46bd0'; ctx.shadowBlur = 14
    ctx.fillStyle = c
    ctx.beginPath()
    ctx.moveTo(0, -25); ctx.lineTo(9, -8); ctx.lineTo(30, 10); ctx.lineTo(26, 18)
    ctx.lineTo(7, 9); ctx.lineTo(5, 16); ctx.lineTo(-5, 16); ctx.lineTo(-7, 9)
    ctx.lineTo(-26, 18); ctx.lineTo(-30, 10); ctx.lineTo(-9, -8); ctx.closePath(); ctx.fill()
    ctx.restore()
    ctx.fillStyle = '#2b1c38'
    ctx.beginPath(); ctx.ellipse(0, -8, 4, 9, 0, 0, TAU); ctx.fill()
    ctx.fillStyle = '#8ff5e6'; ctx.shadowColor = '#5ed6c7'; ctx.shadowBlur = 10
    ctx.fillRect(-5, 14, 3, 7); ctx.fillRect(2, 14, 3, 7); ctx.shadowBlur = 0
  }

  drawBoss(ctx, c) {
    ctx.save()
    ctx.shadowColor = '#ff5a5a'; ctx.shadowBlur = 18
    ctx.fillStyle = '#39222c'
    ctx.beginPath()
    ctx.moveTo(-10, -6); ctx.lineTo(-96, 30); ctx.lineTo(-104, 52); ctx.lineTo(-40, 34)
    ctx.lineTo(-22, 52); ctx.lineTo(22, 52); ctx.lineTo(40, 34); ctx.lineTo(104, 52)
    ctx.lineTo(96, 30); ctx.lineTo(10, -6); ctx.closePath(); ctx.fill()
    ctx.restore()
    ctx.fillStyle = c
    ctx.beginPath()
    ctx.moveTo(0, -56); ctx.lineTo(24, -26); ctx.lineTo(30, 30); ctx.lineTo(-30, 30); ctx.lineTo(-24, -26); ctx.closePath(); ctx.fill()
    ctx.strokeStyle = '#6b2f3e'; ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(-30, 30); ctx.lineTo(30, 30); ctx.stroke()
    const pulse = 0.6 + Math.sin(this.t * 6) * 0.3
    ctx.fillStyle = `rgba(255,90,90,${pulse})`
    ctx.shadowColor = '#ff3a3a'; ctx.shadowBlur = 24
    ctx.beginPath(); ctx.ellipse(0, -14, 12, 20, 0, 0, TAU); ctx.fill()
    ctx.shadowBlur = 0
    for (const s of [-1, 1]) {
      ctx.fillStyle = '#2a1820'; ctx.fillRect(s * 52 - 6, 24, 12, 16)
      ctx.fillStyle = '#ffb257'; ctx.fillRect(s * 52 - 4, 36, 8, 5)
    }
    ctx.fillStyle = '#ff8a5a'
    for (let i = -2; i <= 2; i++) ctx.fillRect(i * 14 - 3, 48, 6, 8)
  }
}
