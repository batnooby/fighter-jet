import { VW, VH, COLORS } from './constants.js'
import { clamp, formatScore, TAU } from './utils.js'
import { PLAYER } from './constants.js'

export class HUD {
  constructor() {
    this.t = 0
    this.sweep = 0
  }

  render(ctx, game, dt = 0) {
    this.t += dt
    this.sweep = (this.sweep + dt * 1.9) % TAU
    const { player, level, save, score } = game
    if (!player || !level) return

    ctx.save()
    ctx.font = '11px Consolas, monospace'
    ctx.textBaseline = 'top'

    this.panel(ctx, 18, 18, 300, 104)
    ctx.fillStyle = COLORS.cyan
    ctx.fillText('FLIGHT SYSTEMS // STATUS', 32, 30)
    ctx.fillStyle = COLORS.white
    ctx.font = 'bold 13px Consolas, monospace'
    ctx.fillText(level.name, 32, 48)
    ctx.font = '10px Consolas, monospace'
    ctx.fillStyle = COLORS.muted
    ctx.fillText(`OP ${String(level.id).padStart(2, '0')} · ${level.subtitle.toUpperCase()}`, 32, 65)

    this.bar(ctx, 32, 84, 272, 9, player.healthPct, player.healthPct < 0.35 ? COLORS.red : COLORS.green, 'HULL')
    this.bar(ctx, 32, 102, 130, 6, player.armorPct, '#8aa7ff', 'ARMOR')
    const shieldPct = player.shielded ? player.shieldTime / PLAYER.shieldDuration : 1 - player.shieldCooldown / PLAYER.shieldCooldown
    this.bar(ctx, 172, 102, 132, 6, clamp(shieldPct, 0, 1), player.shielded ? COLORS.cyanBright : '#4c6c78', player.shielded ? 'SHIELD ACTIVE' : 'SHIELD')

    // top center objective
    const cw = 430
    const cx = VW / 2 - cw / 2
    this.panel(ctx, cx, 18, cw, 76)
    ctx.textAlign = 'center'
    ctx.fillStyle = COLORS.cyan
    ctx.fillText('CURRENT OBJECTIVE', VW / 2, 30)
    ctx.fillStyle = COLORS.white
    ctx.font = 'bold 12px Consolas, monospace'
    ctx.fillText(level.objectiveText.toUpperCase(), VW / 2, 47)
    ctx.font = '11px Consolas, monospace'
    ctx.fillStyle = COLORS.green
    ctx.fillText(game.levelManager.progressLabel, VW / 2, 64)
    const prog = clamp(game.levelManager.progress / game.levelManager.target, 0, 1)
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    ctx.fillRect(cx + 16, 84, cw - 32, 4)
    ctx.fillStyle = COLORS.cyan
    ctx.fillRect(cx + 16, 84, (cw - 32) * prog, 4)
    const hostiles = game.enemies.filter(e => e.alive).length
    ctx.textAlign = 'left'
    ctx.fillStyle = COLORS.muted
    ctx.font = '10px Consolas, monospace'
    ctx.fillText(`HOSTILES ${String(hostiles).padStart(2, '0')}`, cx + 16, 91)
    ctx.textAlign = 'right'
    ctx.fillText(`WAVE ${String(game.wave).padStart(2, '0')} · ${Math.floor(game.missionTime).toString().padStart(3, '0')}s`, cx + cw - 16, 91)
    ctx.textAlign = 'left'

    // top right score
    const rw = 240, rx = VW - rw - 18
    this.panel(ctx, rx, 18, rw, 106)
    ctx.textAlign = 'right'
    ctx.fillStyle = COLORS.muted
    ctx.fillText('SCORE', rx + rw - 16, 30)
    ctx.fillStyle = COLORS.white
    ctx.font = 'bold 22px Consolas, monospace'
    ctx.fillText(formatScore(score), rx + rw - 16, 44)
    ctx.font = '10px Consolas, monospace'
    const comboActive = game.combo > 1
    ctx.fillStyle = comboActive ? COLORS.amber : COLORS.muted
    ctx.fillText(`COMBO ×${game.combo.toFixed(1)}`, rx + rw - 16, 68)
    if (comboActive) this.bar(ctx, rx + 96, 81, 128, 4, game.comboTimer / 2.6, COLORS.amber, '')
    ctx.fillStyle = COLORS.amber
    ctx.fillText(`BEST ${formatScore(Math.max(save.bestScore, score))}`, rx + rw - 16, 94)
    ctx.fillStyle = COLORS.cyan
    ctx.fillText(`LV ${String(level.id).padStart(2, '0')} / 07`, rx + 16, 94)
    ctx.textAlign = 'left'

    this.radar(ctx, game)

    // bottom right weapons
    const ww = 250, wx = VW - ww - 18, wy = VH - 96
    this.panel(ctx, wx, wy, ww, 78)
    ctx.fillStyle = COLORS.cyan
    ctx.fillText('WEAPON SYSTEMS', wx + 14, wy + 10)
    ctx.fillStyle = COLORS.muted
    ctx.fillText('PRIMARY', wx + 14, wy + 28)
    ctx.fillStyle = COLORS.white
    ctx.textAlign = 'right'
    ctx.fillText('∞ READY', wx + ww - 14, wy + 28)
    ctx.textAlign = 'left'
    ctx.fillStyle = COLORS.muted
    ctx.fillText('MISSILES', wx + 14, wy + 44)
    ctx.fillStyle = player.missileAmmo > 0 ? COLORS.amber : COLORS.red
    ctx.textAlign = 'right'
    ctx.fillText(`× ${String(player.missileAmmo).padStart(2, '0')}`, wx + ww - 14, wy + 44)
    ctx.textAlign = 'left'
    const ready = player.specialCooldown <= 0
    ctx.fillStyle = COLORS.muted
    ctx.fillText('SPECIAL [C]', wx + 14, wy + 60)
    this.bar(ctx, wx + 108, wy + 61, 126, 6, ready ? 1 : 1 - player.specialCooldown / PLAYER.specialCooldown, ready ? COLORS.cyanBright : '#4c6c78', '')
    ctx.textAlign = 'right'
    ctx.fillStyle = ready ? COLORS.cyanBright : COLORS.muted
    ctx.fillText(ready ? 'READY' : `${Math.ceil(player.specialCooldown)}s`, wx + ww - 14, wy + 60)
    ctx.textAlign = 'left'

    // boss health
    if (game.boss?.alive && game.boss.y > 0) {
      const bw = 560, bx = VW / 2 - bw / 2, by = 116
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(bx - 6, by - 6, bw + 12, 26)
      ctx.strokeStyle = 'rgba(255,90,90,0.5)'; ctx.lineWidth = 1
      ctx.strokeRect(bx - 6, by - 6, bw + 12, 26)
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(bx, by, bw, 14)
      ctx.fillStyle = COLORS.red
      ctx.fillRect(bx, by, bw * clamp(game.boss.hp / game.boss.maxHp, 0, 1), 14)
      ctx.textAlign = 'center'
      ctx.fillStyle = COLORS.white
      ctx.font = 'bold 10px Consolas, monospace'
      ctx.fillText(`OVERLORD // PHASE ${game.boss.phase}`, VW / 2, by + 2)
      ctx.textAlign = 'left'
      ctx.font = '11px Consolas, monospace'
    }

    // missile warning
    const near = game.projectiles.nearestEnemyMissileTo(player)
    if (near && near.d < 260) {
      const pulse = 0.55 + Math.sin(this.t * 12) * 0.35
      ctx.globalAlpha = pulse
      ctx.fillStyle = 'rgba(120,10,10,0.75)'
      ctx.fillRect(VW / 2 - 150, 104, 300, 24)
      ctx.strokeStyle = COLORS.red; ctx.lineWidth = 1.5
      ctx.strokeRect(VW / 2 - 150, 104, 300, 24)
      ctx.textAlign = 'center'
      ctx.fillStyle = '#ffe0e0'
      ctx.font = 'bold 12px Consolas, monospace'
      ctx.fillText('⚠ MISSILE LOCK — EVADE', VW / 2, 110)
      ctx.textAlign = 'left'
      ctx.strokeStyle = COLORS.red
      ctx.lineWidth = 3
      ctx.strokeRect(2, 2, VW - 4, VH - 4)
      ctx.globalAlpha = 1
    }

    // critical health vignette
    if (player.healthPct < 0.3 && player.alive) {
      const a = (0.12 + Math.sin(this.t * 7) * 0.07) * (1 - player.healthPct / 0.3)
      const g = ctx.createRadialGradient(VW / 2, VH / 2, VH * 0.25, VW / 2, VH / 2, VH * 0.75)
      g.addColorStop(0, 'rgba(255,0,0,0)')
      g.addColorStop(1, `rgba(255,30,30,${a})`)
      ctx.fillStyle = g
      ctx.fillRect(0, 0, VW, VH)
      ctx.fillStyle = `rgba(255,90,90,${0.6 + Math.sin(this.t * 8) * 0.3})`
      ctx.font = 'bold 12px Consolas, monospace'
      ctx.textAlign = 'center'
      ctx.fillText('CRITICAL DAMAGE', VW / 2, VH - 30)
      ctx.textAlign = 'left'
    }

    ctx.restore()
  }

  panel(ctx, x, y, w, h) {
    ctx.fillStyle = 'rgba(4,14,24,0.68)'
    ctx.fillRect(x, y, w, h)
    ctx.strokeStyle = 'rgba(94,214,199,0.22)'
    ctx.lineWidth = 1
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)
    ctx.strokeStyle = COLORS.cyan
    ctx.lineWidth = 2
    const s = 12
    ctx.beginPath()
    ctx.moveTo(x, y + s); ctx.lineTo(x, y); ctx.lineTo(x + s, y)
    ctx.moveTo(x + w - s, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - s)
    ctx.stroke()
  }

  bar(ctx, x, y, w, h, pct, color, label) {
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    ctx.fillRect(x, y, w, h)
    ctx.fillStyle = color
    ctx.fillRect(x, y, w * clamp(pct, 0, 1), h)
    if (label) {
      ctx.fillStyle = 'rgba(220,240,240,0.8)'
      ctx.font = '8px Consolas, monospace'
      ctx.fillText(label, x + 2, y - 10)
    }
  }

  radar(ctx, game) {
    const cx = 92, cy = VH - 96, r = 66
    ctx.save()
    ctx.fillStyle = 'rgba(4,14,24,0.7)'
    ctx.beginPath(); ctx.arc(cx, cy, r + 6, 0, TAU); ctx.fill()
    ctx.strokeStyle = 'rgba(94,214,199,0.35)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke()
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.6, 0, TAU); ctx.stroke()
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.3, 0, TAU); ctx.stroke()
    ctx.strokeStyle = 'rgba(94,214,199,0.12)'
    ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke()

    ctx.save()
    ctx.translate(cx, cy); ctx.rotate(this.sweep)
    const sweepGrad = ctx.createLinearGradient(0, 0, r, 0)
    sweepGrad.addColorStop(0, 'rgba(94,214,199,0.24)')
    sweepGrad.addColorStop(1, 'rgba(94,214,199,0)')
    ctx.fillStyle = sweepGrad
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, -0.45, 0); ctx.closePath(); ctx.fill()
    ctx.restore()

    const p = game.player
    const scale = r / 480
    for (const e of game.enemies) {
      if (!e.alive) continue
      const dx = (e.x - p.x) * scale, dy = (e.y - p.y) * scale
      if (dx * dx + dy * dy > r * r) continue
      ctx.fillStyle = e.isBoss ? '#ff5a5a' : '#ff8a6a'
      ctx.beginPath(); ctx.arc(cx + dx, cy + dy, e.isBoss ? 5 : 2.5, 0, TAU); ctx.fill()
    }
    for (const i of game.installations) {
      if (!i.alive) continue
      const dx = (i.x - p.x) * scale, dy = (i.y - p.y) * scale
      if (dx * dx + dy * dy > r * r) continue
      ctx.fillStyle = '#ffc45a'
      ctx.fillRect(cx + dx - 2, cy + dy - 2, 4, 4)
    }
    for (const pr of game.projectiles.active) {
      if (pr.owner !== 'enemy' || pr.type !== 'enemyMissile') continue
      const dx = (pr.x - p.x) * scale, dy = (pr.y - p.y) * scale
      if (dx * dx + dy * dy > r * r) continue
      ctx.fillStyle = '#ff2a2a'
      ctx.beginPath(); ctx.arc(cx + dx, cy + dy, 2, 0, TAU); ctx.fill()
    }

    ctx.fillStyle = COLORS.cyanBright
    ctx.beginPath()
    ctx.moveTo(cx, cy - 6); ctx.lineTo(cx + 4, cy + 5); ctx.lineTo(cx, cy + 2); ctx.lineTo(cx - 4, cy + 5)
    ctx.closePath(); ctx.fill()
    ctx.fillStyle = COLORS.muted
    ctx.font = '9px Consolas, monospace'
    ctx.textAlign = 'center'
    ctx.fillText('RADAR', cx, cy + r + 10)
    ctx.textAlign = 'left'
    ctx.restore()
  }
}
