import { PLAYER, VW, VH } from './constants.js'
import { clamp, lerp, TAU } from './utils.js'

export class Player {
  constructor() {
    this.reset()
  }

  reset() {
    this.x = VW / 2
    this.y = VH - 130
    this.vx = 0; this.vy = 0
    this.radius = PLAYER.radius
    this.health = PLAYER.maxHealth
    this.armor = PLAYER.maxArmor
    this.alive = true
    this.fireTimer = 0
    this.missileTimer = 0
    this.missileAmmo = 10
    this.maxMissileAmmo = 10
    this.shieldTime = 0
    this.shieldCooldown = 0
    this.specialCooldown = 0
    this.specialTimer = 0
    this.damageFlash = 0
    this.bank = 0
    this.t = 0
    this.invuln = 0
    this.trailTimer = 0
  }

  get shielded() { return this.shieldTime > 0 }
  get healthPct() { return clamp(this.health / PLAYER.maxHealth, 0, 1) }
  get armorPct() { return clamp(this.armor / PLAYER.maxArmor, 0, 1) }

  update(dt, game) {
    this.t += dt
    if (!this.alive) return
    const { input } = game
    const move = input.moveVector()
    const target = input.targetPosition()

    const accel = 2100, maxSpeed = PLAYER.speed
    if (target) {
      const dx = target.x - this.x, dy = target.y - this.y
      const d = Math.hypot(dx, dy)
      if (d > 4) {
        const s = Math.min(maxSpeed, d * 5.5)
        this.vx = lerp(this.vx, (dx / d) * s, clamp(dt * 12, 0, 1))
        this.vy = lerp(this.vy, (dy / d) * s, clamp(dt * 12, 0, 1))
      } else {
        this.vx = lerp(this.vx, 0, clamp(dt * 10, 0, 1))
        this.vy = lerp(this.vy, 0, clamp(dt * 10, 0, 1))
      }
    } else {
      this.vx += (move.x * maxSpeed - this.vx) * clamp(dt * 9, 0, 1)
      this.vy += (move.y * maxSpeed - this.vy) * clamp(dt * 9, 0, 1)
    }

    this.x += this.vx * dt
    this.y += this.vy * dt
    const pad = 16
    if (this.x < pad) { this.x = pad; this.vx = Math.max(0, this.vx) }
    if (this.x > VW - pad) { this.x = VW - pad; this.vx = Math.min(0, this.vx) }
    if (this.y < 70) { this.y = 70; this.vy = Math.max(0, this.vy) }
    if (this.y > VH - 22) { this.y = VH - 22; this.vy = Math.min(0, this.vy) }

    this.bank = lerp(this.bank, clamp(this.vx / maxSpeed, -1, 1), clamp(dt * 8, 0, 1))

    this.fireTimer -= dt
    this.missileTimer -= dt
    this.shieldCooldown = Math.max(0, this.shieldCooldown - dt)
    this.shieldTime = Math.max(0, this.shieldTime - dt)
    this.specialCooldown = Math.max(0, this.specialCooldown - dt)
    this.damageFlash = Math.max(0, this.damageFlash - dt)
    this.invuln = Math.max(0, this.invuln - dt)

    if (input.isDown('fire') && this.fireTimer <= 0) {
      this.fire(game)
      this.fireTimer = PLAYER.fireRate
    }
    if (input.consume('missile')) this.launchMissile(game)
    if (input.consume('shield')) this.activateShield(game)
    if (input.consume('special')) this.useSpecial(game)

    this.trailTimer -= dt
    if (this.trailTimer <= 0) {
      const intensity = Math.hypot(this.vx, this.vy) / maxSpeed
      game.particles.trail(this.x - 8, this.y + 12, '#6fd8ff', this.vx * 0.08, 90 + intensity * 60)
      game.particles.trail(this.x + 8, this.y + 12, '#6fd8ff', this.vx * 0.08, 90 + intensity * 60)
      this.trailTimer = 0.035
    }
    if (this.health < PLAYER.maxHealth * 0.38 && Math.random() < dt * 16) {
      game.particles.smoke(this.x + (Math.random() - 0.5) * 16, this.y + 6, this.vx * 0.2, 60)
    }
    game.audio.setEngine(true, 0.45 + Math.hypot(this.vx, this.vy) / maxSpeed * 0.55)
  }

  fire(game) {
    game.projectiles.spawnPlayerBullet(this.x - 10, this.y - 16)
    game.projectiles.spawnPlayerBullet(this.x + 10, this.y - 16)
    game.particles.muzzle(this.x - 10, this.y - 18)
    game.particles.muzzle(this.x + 10, this.y - 18)
    game.audio.gun()
  }

  launchMissile(game) {
    if (this.missileTimer > 0 || this.missileAmmo <= 0) return
    const target = this.findTarget(game)
    game.projectiles.spawnPlayerMissile(this.x - 24, this.y, target)
    game.projectiles.spawnPlayerMissile(this.x + 24, this.y, target)
    this.missileTimer = PLAYER.missileCooldown
    this.missileAmmo -= 2
    game.audio.missile()
    game.toast('MISSILES AWAY')
  }

  findTarget(game) {
    let best = null, bestScore = -Infinity
    const candidates = [...game.enemies, ...(game.installations || [])]
    for (const c of candidates) {
      if (!c.alive) continue
      const dy = this.y - c.y
      if (dy < -40) continue
      const score = -Math.abs(c.x - this.x) - Math.abs(dy) * 0.2 + (c.type === 'boss' ? 400 : 0) + (c.radius > 25 ? 80 : 0)
      if (score > bestScore) { bestScore = score; best = c }
    }
    return best
  }

  activateShield(game) {
    if (this.shieldCooldown > 0 || this.shieldTime > 0) return
    this.shieldTime = PLAYER.shieldDuration
    this.shieldCooldown = PLAYER.shieldCooldown
    game.audio.shield()
    game.toast('DEFLECTOR ONLINE')
  }

  useSpecial(game) {
    if (this.specialCooldown > 0) return
    this.specialCooldown = PLAYER.specialCooldown
    game.projectiles.spawnSpecial(this.x, this.y - 10)
    game.audio.special()
    game.shake = 16
    game.particles.explosion(this.x, this.y - 20, 1.3, '#8ff5e6')
    game.toast('SPECIAL WEAPON DEPLOYED')
  }

  takeDamage(amount, game, heavy = false) {
    if (!this.alive || this.invuln > 0) return
    if (this.shielded) {
      game.audio.hit()
      game.particles.explosion(this.x, this.y, 0.25, '#8ff5e6')
      return
    }
    let dmg = amount
    if (this.armor > 0) {
      const absorbed = Math.min(this.armor, dmg * 0.65)
      this.armor -= absorbed
      dmg -= absorbed
      if (heavy) this.armor = Math.max(0, this.armor - amount * 0.3)
    }
    this.health -= dmg
    game.onPlayerDamage?.()
    this.damageFlash = 0.25
    this.invuln = heavy ? 0.25 : 0.12
    game.audio.hit()
    game.shake = Math.max(game.shake, heavy ? 12 : 5)
    if (this.health <= 0) this.die(game)
  }

  die(game) {
    if (!this.alive) return
    this.alive = false
    this.health = 0
    game.audio.setEngine(false)
    game.audio.explosion(true)
    game.particles.explosion(this.x, this.y, 2.4, '#ff8a3d')
    game.particles.debris(this.x, this.y, 20)
    game.shake = 28
    game.onPlayerDeath()
  }

  heal(v) { this.health = Math.min(PLAYER.maxHealth, this.health + v) }
  repair(v) { this.armor = Math.min(PLAYER.maxArmor, this.armor + v) }
  addAmmo(v) { this.missileAmmo = Math.min(this.maxMissileAmmo, this.missileAmmo + v) }

  render(ctx) {
    if (!this.alive) return
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.bank * 0.42)

    const flame = 12 + Math.sin(this.t * 32) * 4 + Math.hypot(this.vx, this.vy) / PLAYER.speed * 12
    const grad = ctx.createLinearGradient(0, 8, 0, 8 + flame)
    grad.addColorStop(0, '#bffcff')
    grad.addColorStop(0.45, '#4fc9ff')
    grad.addColorStop(1, 'rgba(40,90,255,0)')
    ctx.fillStyle = grad
    ctx.beginPath(); ctx.moveTo(-7, 8); ctx.lineTo(0, 8 + flame); ctx.lineTo(7, 8); ctx.closePath(); ctx.fill()
    ctx.beginPath(); ctx.moveTo(-12, 6); ctx.lineTo(-10, 6 + flame * 0.6); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill()
    ctx.beginPath(); ctx.moveTo(12, 6); ctx.lineTo(10, 6 + flame * 0.6); ctx.lineTo(6, 6); ctx.closePath(); ctx.fill()

    // wings
    ctx.fillStyle = '#4c6459'
    ctx.beginPath()
    ctx.moveTo(-4, -4); ctx.lineTo(-34, 12); ctx.lineTo(-32, 18); ctx.lineTo(-4, 10)
    ctx.lineTo(4, 10); ctx.lineTo(32, 18); ctx.lineTo(34, 12); ctx.lineTo(4, -4)
    ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#354b45'
    ctx.fillRect(-34, 10, 12, 3); ctx.fillRect(22, 10, 12, 3)

    // tailplanes
    ctx.fillStyle = '#3c534c'
    ctx.beginPath(); ctx.moveTo(-5, 4); ctx.lineTo(-18, 17); ctx.lineTo(-16, 20); ctx.lineTo(-4, 13); ctx.closePath(); ctx.fill()
    ctx.beginPath(); ctx.moveTo(5, 4); ctx.lineTo(18, 17); ctx.lineTo(16, 20); ctx.lineTo(4, 13); ctx.closePath(); ctx.fill()

    // fuselage
    ctx.fillStyle = '#6d8478'
    ctx.beginPath()
    ctx.moveTo(0, -26)
    ctx.quadraticCurveTo(8, -18, 8, -2)
    ctx.lineTo(7, 12)
    ctx.quadraticCurveTo(0, 17, -7, 12)
    ctx.lineTo(-8, -2)
    ctx.quadraticCurveTo(-8, -18, 0, -26)
    ctx.closePath(); ctx.fill()
    ctx.strokeStyle = '#243a35'; ctx.lineWidth = 1.4; ctx.stroke()

    // canopy
    ctx.fillStyle = this.damageFlash > 0 ? '#ff7777' : '#8ff5e6'
    ctx.shadowColor = '#5ed6c7'; ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.moveTo(0, -20); ctx.quadraticCurveTo(5, -13, 4, -5)
    ctx.quadraticCurveTo(0, -2, -4, -5)
    ctx.quadraticCurveTo(-5, -13, 0, -20)
    ctx.closePath(); ctx.fill()
    ctx.shadowBlur = 0

    // wing stripes
    ctx.strokeStyle = '#9fd66b'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(-28, 13); ctx.lineTo(-18, 9); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(28, 13); ctx.lineTo(18, 9); ctx.stroke()

    ctx.restore()

    // shield bubble
    if (this.shielded) {
      const pulse = 0.7 + Math.sin(this.t * 12) * 0.12
      ctx.save()
      ctx.strokeStyle = `rgba(143,245,230,${pulse})`
      ctx.shadowColor = '#5ed6c7'; ctx.shadowBlur = 16
      ctx.lineWidth = 2.4
      ctx.beginPath(); ctx.arc(this.x, this.y - 2, 30 + Math.sin(this.t * 8) * 2, 0, TAU); ctx.stroke()
      ctx.globalAlpha = 0.12
      ctx.fillStyle = '#5ed6c7'
      ctx.beginPath(); ctx.arc(this.x, this.y - 2, 30, 0, TAU); ctx.fill()
      ctx.restore()
    }

    if (this.invuln > 0 && Math.floor(this.t * 22) % 2 === 0) {
      ctx.save()
      ctx.globalAlpha = 0.3
      ctx.strokeStyle = '#fff'
      ctx.beginPath(); ctx.arc(this.x, this.y, this.radius + 4, 0, TAU); ctx.stroke()
      ctx.restore()
    }
  }
}
