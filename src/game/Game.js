import { VW, VH } from './constants.js'
import { clamp, circlesHit, rand } from './utils.js'
import { Player } from './Player.js'
import { Enemy } from './Enemy.js'
import { ProjectileManager } from './Projectile.js'
import { ParticleSystem } from './Particle.js'
import { FloatingText } from './FloatingText.js'
import { Background } from './Background.js'
import { LevelManager, LEVELS } from './LevelManager.js'
import { HUD } from './HUD.js'
import { resolveCollisions } from './Collision.js'

export class Game {
  constructor({ canvas, save, audio, input, ui }) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d', { alpha: false })
    this.save = save
    this.audio = audio
    this.input = input
    this.ui = ui
    this.state = 'menu'
    this.levelId = 1
    this.level = LEVELS[0]
    this.player = new Player()
    this.enemies = []
    this.installations = []
    this.pickups = []
    this.projectiles = new ProjectileManager()
    this.particles = new ParticleSystem()
    this.floating = new FloatingText()
    this.comboCount = 0
    this.combo = 1
    this.comboTimer = 0
    this.hitStop = 0
    this.wave = 0
    this.background = new Background()
    this.levelManager = new LevelManager()
    this.hud = new HUD()
    this.score = 0
    this.kills = 0
    this.campaignScore = 0
    this.campaignKills = 0
    this.missionTime = 0
    this.shake = 0
    this.missileWarning = 0
    this.pendingResult = null
    this.last = performance.now()
    this.menuT = 0
    this.demoJets = Array.from({ length: 4 }, (_, i) => ({ x: rand(0, VW), y: rand(80, VH - 80), vx: rand(30, 70), i }))

    this.input.toVirtual = (cx, cy) => this.screenToVirtual(cx, cy)
    this.input.setMouseMode(!!save.settings.mouseMode)
    this.bindLifecycle()
    requestAnimationFrame((t) => this.loop(t))
  }

  screenToVirtual(cx, cy) {
    const r = this.canvas.getBoundingClientRect()
    const scale = Math.min(r.width / VW, r.height / VH)
    const ox = (r.width - VW * scale) / 2
    const oy = (r.height - VH * scale) / 2
    return {
      x: clamp((cx - r.left - ox) / scale, 0, VW),
      y: clamp((cy - r.top - oy) / scale, 0, VH)
    }
  }

  bindLifecycle() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'playing') this.pause()
    })
    window.addEventListener('blur', () => { if (this.state === 'playing') this.pause() })
  }

  loop(now) {
    const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000))
    this.last = now
    if (this.state === 'playing') this.update(dt)
    else if (this.state === 'menu') this.updateMenu(dt)
    this.render(dt)
    requestAnimationFrame((t) => this.loop(t))
  }

  updateMenu(dt) {
    this.menuT += dt
    this.background.update(dt, 26)
    for (const j of this.demoJets) {
      j.x += j.vx * dt
      j.y += Math.sin(this.menuT * 0.5 + j.i) * 8 * dt
      if (j.x > VW + 60) { j.x = -60; j.y = rand(80, VH - 80) }
    }
  }

  update(dt) {
    if (this.hitStop > 0) {
      this.hitStop -= dt
      dt *= 0.18
    }
    this.missionTime += dt
    if (this.comboTimer > 0) {
      this.comboTimer -= dt
      if (this.comboTimer <= 0) { this.comboCount = 0; this.combo = 1 }
    }
    this.floating.update(dt)
    this.background.update(dt, 95 + (this.level?.theme === 'night' ? 10 : 0))
    this.shake = Math.max(0, this.shake - dt * 42)
    this.missileWarning = Math.max(0, this.missileWarning - dt)

    if (this.input.consume('pause')) { this.pause(); return }

    this.player.update(dt, this)
    for (const e of this.enemies) e.update(dt, this)
    for (const i of this.installations) i.update(dt, this)
    this.levelManager.update(dt, this)
    this.projectiles.update(dt, this.particles, this.player, this.enemies)
    resolveCollisions(this)
    this.particles.update(dt)
    this.updatePickups(dt)

    this.enemies = this.enemies.filter(e => e.alive)
    this.installations = this.installations.filter(i => i.alive)
    if (this.boss && !this.boss.alive) this.boss = null

    if (this.pendingResult) {
      this.pendingResult.timer -= dt
      if (this.pendingResult.timer <= 0) {
        const r = this.pendingResult
        this.pendingResult = null
        if (r.type === 'gameover') this.finishGameOver()
        else this.finishLevelComplete()
      }
    }
    this.updateTouchUI()
  }

  updatePickups(dt) {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i]
      p.t += dt
      p.y += p.vy * dt
      if (p.y > VH + 30) { this.pickups.splice(i, 1); continue }
      if (this.player.alive && circlesHit(p.x, p.y, 14, this.player.x, this.player.y, this.player.radius)) {
        if (p.type === 'repair') { this.player.heal(28); this.ui.toast('HULL REPAIRED +28') }
        else if (p.type === 'armor') { this.player.repair(34); this.ui.toast('ARMOR RESTORED +34') }
        else { this.player.addAmmo(4); this.ui.toast('MISSILE SUPPLY +4') }
        this.audio.shield()
        this.particles.explosion(p.x, p.y, 0.4, '#9fd66b')
        this.pickups.splice(i, 1)
      }
    }
  }

  maybeDrop(x, y) {
    if (Math.random() > 0.11) return
    const r = Math.random()
    const type = r < 0.42 ? 'repair' : r < 0.72 ? 'ammo' : 'armor'
    this.pickups.push({ x, y, type, vy: 55, t: 0 })
  }

  render(dt) {
    const ctx = this.ctx
    ctx.save()
    ctx.fillStyle = '#030a12'
    ctx.fillRect(0, 0, VW, VH)

    if (this.state === 'menu') {
      this.background.render(ctx)
      this.renderDemoJets(ctx)
      ctx.fillStyle = 'rgba(2,8,14,0.28)'
      ctx.fillRect(0, 0, VW, VH)
      ctx.restore()
      return
    }

    const sx = this.shake > 0 ? rand(-this.shake, this.shake) : 0
    const sy = this.shake > 0 ? rand(-this.shake, this.shake) : 0
    ctx.translate(sx, sy)
    this.background.render(ctx)
    for (const i of this.installations) i.render(ctx)
    this.renderPickups(ctx)
    for (const e of this.enemies) e.render(ctx)
    this.projectiles.render(ctx)
    this.particles.render(ctx)
    this.player.render(ctx)
    this.floating.render(ctx)
    ctx.restore()

    if (this.state === 'playing' || this.state === 'paused') {
      this.hud.render(ctx, this, this.state === 'playing' ? dt : 0)
    }
  }

  renderDemoJets(ctx) {
    for (const j of this.demoJets) {
      ctx.save()
      ctx.translate(j.x, j.y)
      ctx.globalAlpha = 0.35
      ctx.fillStyle = '#7fd4c7'
      ctx.beginPath()
      ctx.moveTo(0, -18); ctx.lineTo(6, -4); ctx.lineTo(24, 10); ctx.lineTo(20, 14)
      ctx.lineTo(3, 7); ctx.lineTo(-3, 7); ctx.lineTo(-20, 14); ctx.lineTo(-24, 10); ctx.lineTo(-6, -4)
      ctx.closePath(); ctx.fill()
      ctx.restore()
    }
  }

  renderPickups(ctx) {
    for (const p of this.pickups) {
      ctx.save()
      ctx.translate(p.x, p.y + Math.sin(p.t * 5) * 3)
      ctx.shadowColor = '#9fd66b'; ctx.shadowBlur = 12
      ctx.fillStyle = '#2e4a3a'
      ctx.fillRect(-10, -10, 20, 20)
      ctx.strokeStyle = '#9fd66b'; ctx.lineWidth = 1.5
      ctx.strokeRect(-10, -10, 20, 20)
      ctx.shadowBlur = 0
      ctx.fillStyle = '#dff5c9'
      ctx.font = 'bold 11px Consolas, monospace'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(p.type === 'repair' ? '+' : p.type === 'armor' ? 'A' : 'M', 0, 0)
      ctx.restore()
    }
  }

  toast(message, warn = false) { this.ui.toast(message, warn) }

  // ---- flow ----
  startLevel(id, campaign = false) {
    if (!this.save.isUnlocked(id)) id = 1
    if (campaign && id === 1) { this.campaignScore = 0; this.campaignKills = 0 }
    this.levelId = id
    this.level = LEVELS.find(l => l.id === id) || LEVELS[0]
    this.enemies.length = 0
    this.installations.length = 0
    this.pickups.length = 0
    this.projectiles.clear()
    this.particles.clear()
    this.floating.clear()
    this.boss = null
    this.comboCount = 0
    this.combo = 1
    this.comboTimer = 0
    this.hitStop = 0
    this.wave = 0
    this.player.reset()
    this.score = 0
    this.kills = 0
    this.missionTime = 0
    this.shake = 0
    this.missileWarning = 0
    this.pendingResult = null
    this.background.setTheme(this.level.theme)
    this.levelManager.start(id, this)
    this.state = 'playing'
    this.ui.show('none')
    this.audio.resume()
    this.audio.startMusic('game')
    this.audio.setEngine(true, 0.5)
    this.input.clearPressed()
    this.updateTouchUI()
    this.ui.toast(`OPERATION ${String(id).padStart(2, '0')} — ${this.level.name}`)
  }

  pause() {
    if (this.state !== 'playing') return
    this.state = 'paused'
    this.audio.setEngine(false)
    this.audio.stopMusic()
    this.ui.show('pause')
    this.updateTouchUI()
  }

  resume() {
    if (this.state !== 'paused') return
    this.state = 'playing'
    this.ui.show('none')
    this.audio.resume()
    this.audio.startMusic('game')
    this.input.clearPressed()
    this.updateTouchUI()
  }

  toMenu() {
    this.state = 'menu'
    this.pendingResult = null
    this.enemies.length = 0
    this.installations.length = 0
    this.pickups.length = 0
    this.projectiles.clear()
    this.particles.clear()
    this.floating.clear()
    this.audio.setEngine(false)
    this.audio.stopMusic()
    this.audio.setMusicMode('menu')
    this.audio.startMusic('menu')
    this.background.setTheme('night')
    this.ui.show('menu')
    this.updateTouchUI()
  }

  onEnemyDestroyed(enemy) {
    this.comboCount = Math.min(20, this.comboCount + 1)
    this.combo = 1 + this.comboCount * 0.1
    this.comboTimer = 2.6
    const gained = Math.round(enemy.score * this.combo)
    this.score += gained
    this.kills++
    this.campaignKills++
    this.floating.add(enemy.x, enemy.y - enemy.radius, `+${gained}`, enemy.isBoss ? '#ff5a5a' : this.combo > 1.4 ? '#ffc45a' : '#8ff5e6', enemy.isBoss ? 22 : 14)
    if (enemy.isBoss) { this.hitStop = 0.14; this.particles.shockwave(enemy.x, enemy.y, '#ffd9a0', 4, 0.9) }
    this.levelManager.onEnemyDestroyed(enemy)
    this.maybeDrop(enemy.x, enemy.y)
  }

  onInstallationDestroyed(inst) {
    this.score += inst.score
    this.floating.add(inst.x, inst.y - inst.radius, `+${inst.score}`, '#ffc45a', 15)
    this.levelManager.onInstallationDestroyed(inst)
    this.maybeDrop(inst.x, inst.y)
  }

  onPlayerDamage() {
    if (this.comboCount > 2) this.floating.add(this.player.x, this.player.y - 30, 'COMBO LOST', '#ff5a5a', 13)
    this.comboCount = 0
    this.combo = 1
    this.comboTimer = 0
  }

  announceWave() {
    this.wave++
    if (this.wave === 1 || this.wave % 3 === 0) this.toast(`WAVE ${String(this.wave).padStart(2, '0')} INBOUND`)
  }

  onEnemyEscaped() {
    // Escaped hostiles do not count toward objectives; waves repeat as needed.
  }

  onPlayerDeath() {
    if (this.pendingResult) return
    this.audio.stopMusic()
    this.pendingResult = { type: 'gameover', timer: 1.5 }
  }

  onLevelComplete() {
    if (this.pendingResult) return
    this.audio.stopMusic()
    this.audio.missionComplete()
    this.ui.toast('MISSION OBJECTIVES COMPLETE')
    this.pendingResult = { type: 'complete', timer: 1.3 }
  }

  finishGameOver() {
    this.state = 'gameover'
    this.save.recordMission(this.levelId, this.score, this.kills, false)
    this.audio.gameOver()
    this.ui.showGameOver({ score: this.score, kills: this.kills, level: this.levelId, name: this.level.name })
    this.updateTouchUI()
  }

  finishLevelComplete() {
    const timeBonus = Math.max(0, 2200 - Math.floor(this.missionTime) * 8)
    const healthBonus = Math.round(this.player.health * 6 + this.player.armor * 2)
    const bonus = timeBonus + healthBonus
    this.score += bonus
    const { unlockedNew } = this.save.recordMission(this.levelId, this.score, this.kills, true)
    this.campaignScore += this.score
    this.state = 'levelcomplete'
    const data = {
      level: this.levelId, name: this.level.name, score: this.score,
      kills: this.kills, bonus, unlockedNew
    }
    if (this.levelId === 7) {
      this.state = 'victory'
      this.ui.showVictory({ score: this.campaignScore, kills: this.campaignKills })
    } else {
      this.ui.showLevelComplete(data)
    }
    this.updateTouchUI()
  }

  nextLevel() {
    const next = Math.min(7, this.levelId + 1)
    this.startLevel(next, true)
  }

  updateTouchUI() {
    const el = document.getElementById('touch-controls')
    if (!el) return
    const show = this.input.touchDetected && this.state === 'playing'
    el.classList.toggle('active', show)
  }
}
