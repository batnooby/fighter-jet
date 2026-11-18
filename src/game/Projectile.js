import { VW, VH } from './constants.js'
import { dist, clamp } from './utils.js'

export class Projectile {
  constructor() {
    this.active = false
  }

  init(opts) {
    Object.assign(this, {
      active: true,
      x: 0, y: 0, vx: 0, vy: 0,
      radius: 4,
      damage: 10,
      life: 2.5,
      owner: 'player', // player | enemy
      type: 'bullet',  // bullet | missile | enemyMissile | special
      color: '#fff',
      homing: false,
      target: null,
      turnRate: 0,
      speed: 0,
      trailCd: 0,
      pierce: 0
    }, opts)
    if (this.homing && !this.speed) this.speed = Math.hypot(this.vx, this.vy) || 300
  }
}

export class ProjectileManager {
  constructor(max = 400) {
    this.pool = Array.from({ length: max }, () => new Projectile())
    this.active = []
  }

  obtain() {
    for (const p of this.pool) if (!p.active) return p
    return null
  }

  spawn(opts) {
    const p = this.obtain()
    if (!p) return null
    p.init(opts)
    this.active.push(p)
    return p
  }

  spawnPlayerBullet(x, y) {
    this.spawn({
      x, y, vx: 0, vy: -820, radius: 3.5, damage: 8, life: 1.2,
      owner: 'player', type: 'bullet', color: '#9fffd8'
    })
  }

  spawnPlayerMissile(x, y, target) {
    this.spawn({
      x, y, vx: 0, vy: -260, radius: 5, damage: 40, life: 3.5,
      owner: 'player', type: 'missile', color: '#ffc45a',
      homing: true, target, turnRate: 4.5, speed: 520, trailCd: 0
    })
  }

  spawnEnemyBullet(x, y, vx, vy, damage = 10, radius = 4) {
    this.spawn({
      x, y, vx, vy, radius, damage, life: 4,
      owner: 'enemy', type: 'bullet', color: '#ff8a6a'
    })
  }

  spawnEnemyMissile(x, y, target, speed = 210, damage = 22) {
    const angle = Math.atan2(target.y - y, target.x - x)
    this.spawn({
      x, y, vx: Math.cos(angle) * speed * 0.5, vy: Math.sin(angle) * speed * 0.5,
      radius: 5.5, damage, life: 6,
      owner: 'enemy', type: 'enemyMissile', color: '#ff5a5a',
      homing: true, target, turnRate: 1.6, speed, trailCd: 0
    })
  }

  spawnSpecial(x, y) {
    for (let i = -2; i <= 2; i++) {
      this.spawn({
        x: x + i * 10, y, vx: i * 40, vy: -520, radius: 9, damage: 55, life: 1.8,
        owner: 'player', type: 'special', color: '#8ff5e6', pierce: 2
      })
    }
  }

  update(dt, particles, player, enemies) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i]
      p.life -= dt
      if (p.life <= 0) { this.deactivate(i); continue }

      if (p.homing) {
        let target = p.target
        if (p.owner === 'player') {
          if (!target || !target.alive) target = this.findNearestEnemy(p, enemies)
          p.target = target
        } else {
          target = player && player.alive ? player : null
          p.target = target
        }
        if (target) {
          const tx = target.x, ty = target.y
          const desired = Math.atan2(ty - p.y, tx - p.x)
          const current = Math.atan2(p.vy, p.vx)
          let diff = desired - current
          while (diff > Math.PI) diff -= Math.PI * 2
          while (diff < -Math.PI) diff += Math.PI * 2
          const maxTurn = p.turnRate * dt
          const turn = clamp(diff, -maxTurn, maxTurn)
          const ang = current + turn
          const sp = p.speed
          p.vx = Math.cos(ang) * sp
          p.vy = Math.sin(ang) * sp
        } else if (p.speed) {
          const ang = Math.atan2(p.vy, p.vx)
          p.vx = Math.cos(ang) * p.speed
          p.vy = Math.sin(ang) * p.speed
        }
        p.trailCd -= dt
        if (p.trailCd <= 0 && particles) {
          particles.trail(p.x, p.y, p.owner === 'player' ? '#ffd47a' : '#ff7a6a', -p.vx * 0.05, -p.vy * 0.05)
          p.trailCd = 0.03
        }
      }

      p.x += p.vx * dt
      p.y += p.vy * dt

      if (p.x < -60 || p.x > VW + 60 || p.y < -80 || p.y > VH + 80) {
        this.deactivate(i)
      }
    }
  }

  findNearestEnemy(p, enemies) {
    let best = null, bestD = Infinity
    for (const e of enemies) {
      if (!e.alive) continue
      const d = (e.x - p.x) ** 2 + (e.y - p.y) ** 2
      if (d < bestD) { bestD = d; best = e }
    }
    return best
  }

  deactivate(index) {
    const p = this.active[index]
    p.active = false
    this.active[index] = this.active[this.active.length - 1]
    this.active.pop()
  }

  render(ctx) {
    for (const p of this.active) {
      ctx.save()
      if (p.type === 'bullet' && p.owner === 'player') {
        ctx.fillStyle = p.color
        ctx.shadowColor = p.color; ctx.shadowBlur = 8
        ctx.fillRect(p.x - 2, p.y - 9, 4, 18)
      } else if (p.type === 'bullet' && p.owner === 'enemy') {
        ctx.fillStyle = p.color
        ctx.shadowColor = p.color; ctx.shadowBlur = 6
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill()
      } else if (p.type === 'missile' || p.type === 'enemyMissile') {
        const ang = Math.atan2(p.vy, p.vx) + Math.PI / 2
        ctx.translate(p.x, p.y); ctx.rotate(ang)
        ctx.fillStyle = p.type === 'missile' ? '#f4c75a' : '#e05555'
        ctx.beginPath()
        ctx.moveTo(0, -10); ctx.lineTo(4, 6); ctx.lineTo(0, 3); ctx.lineTo(-4, 6)
        ctx.closePath(); ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.fillRect(-1.5, 3, 3, 5)
      } else if (p.type === 'special') {
        ctx.fillStyle = p.color
        ctx.shadowColor = p.color; ctx.shadowBlur = 14
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * 0.45, 0, Math.PI * 2); ctx.fill()
      } else {
        ctx.fillStyle = p.color
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill()
      }
      ctx.restore()
    }
  }

  clear() {
    for (const p of this.active) p.active = false
    this.active.length = 0
  }

  nearestEnemyMissileTo(player) {
    let best = null, bestD = Infinity
    if (!player) return null
    for (const p of this.active) {
      if (p.owner !== 'enemy' || p.type !== 'enemyMissile') continue
      const d = dist(p.x, p.y, player.x, player.y)
      if (d < bestD) { bestD = d; best = { p, d } }
    }
    return best
  }
}
