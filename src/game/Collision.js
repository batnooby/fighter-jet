import { circlesHit } from './utils.js'

export function resolveCollisions(game) {
  const { projectiles, particles, audio, player } = game
  const enemies = game.enemies
  const installations = game.installations
  const activeProjectiles = projectiles.active

  // Player projectiles -> enemies & installations
  for (let i = activeProjectiles.length - 1; i >= 0; i--) {
    const p = activeProjectiles[i]
    if (!p.active || p.owner !== 'player') continue
    let hit = false

    for (const e of enemies) {
      if (!e.alive) continue
      if (circlesHit(p.x, p.y, p.radius, e.x, e.y, e.radius)) {
        e.takeDamage(p.damage, game)
        particles.explosion(p.x, p.y, p.type === 'special' ? 0.7 : 0.35, p.color)
        if (p.pierce > 0) { p.pierce--; p.damage *= 0.7 } else { hit = true }
        break
      }
    }
    if (hit) { projectiles.deactivate(i); continue }

    if (installations) {
      for (const inst of installations) {
        if (!inst.alive) continue
        if (circlesHit(p.x, p.y, p.radius, inst.x, inst.y, inst.radius)) {
          inst.takeDamage(p.damage, game)
          particles.explosion(p.x, p.y, 0.4, '#c9a06a')
          if (p.pierce > 0) { p.pierce--; p.damage *= 0.7 } else { hit = true }
          break
        }
      }
    }
    if (hit) projectiles.deactivate(i)
  }

  if (!player || !player.alive) return

  // Enemy projectiles -> player
  for (let i = projectiles.active.length - 1; i >= 0; i--) {
    const p = projectiles.active[i]
    if (!p.active || p.owner !== 'enemy') continue
    if (circlesHit(p.x, p.y, p.radius, player.x, player.y, player.radius)) {
      player.takeDamage(p.damage, game, p.type === 'enemyMissile')
      projectiles.deactivate(i)
      if (p.type === 'enemyMissile') {
        particles.explosion(p.x, p.y, 0.9, '#ff6a4a')
        audio.explosion(false)
      } else {
        particles.explosion(p.x, p.y, 0.3, '#ff9966')
        audio.hit()
      }
    }
  }

  // Enemy bodies -> player
  for (const e of enemies) {
    if (!e.alive) continue
    if (circlesHit(e.x, e.y, e.radius, player.x, player.y, player.radius)) {
      if (e.isBoss) {
        e.takeDamage(40, game)
        player.takeDamage(26, game)
      } else {
        e.takeDamage(999, game)
        player.takeDamage(22, game)
      }
      particles.explosion((e.x + player.x) / 2, (e.y + player.y) / 2, 0.8, '#ff8844')
      audio.explosion(false)
    }
  }

  // Installations collision (if player flies into one, rare but possible)
  if (installations) {
    for (const inst of installations) {
      if (!inst.alive) continue
      if (circlesHit(inst.x, inst.y, inst.radius, player.x, player.y, player.radius)) {
        player.takeDamage(18, game)
        inst.takeDamage(30, game)
        particles.explosion(player.x, player.y - 10, 0.6, '#ff9966')
      }
    }
  }
}
