import { VW } from './constants.js'
import { rand } from './utils.js'
import { Enemy } from './Enemy.js'
import { Installation } from './Installation.js'

export const LEVELS = [
  {
    id: 1,
    name: 'FIRST STRIKE',
    subtitle: 'Operation Falcon Dawn',
    desc: 'Hostile patrols have entered the training corridor. Show them what the SKYFALL wing can do. Destroy the incoming force and establish air superiority over the sector.',
    objectives: ['Destroy 8 enemy aircraft', 'Return to base with the jet intact'],
    tips: ['Hold SPACE to fire the primary cannon', 'WASD or arrow keys steer your jet', 'Collect supply crates dropped by destroyed fighters'],
    difficulty: 1,
    theme: 'coast',
    objectiveText: 'Enemy aircraft destroyed',
    objective: { type: 'kills', target: 8 },
    waves: [
      { type: 'basic', count: 3, formation: 'line', gap: 3.2 },
      { type: 'basic', count: 4, formation: 'wedge', gap: 3.4 },
      { type: 'basic', count: 3, formation: 'sides', gap: 3.2 }
    ]
  },
  {
    id: 2,
    name: 'BORDER DEFENSE',
    subtitle: 'Operation Iron Veil',
    desc: 'The frontier is under pressure. Enemy formations are crossing the border in successive waves. Hold the line and protect friendly territory from intrusion.',
    objectives: ['Destroy 14 enemy aircraft', 'Intercept fast movers before they break through'],
    tips: ['Interceptors are fast — lead your shots', 'SHIFT activates a temporary deflector shield', 'X launches homing missiles'],
    difficulty: 2,
    theme: 'border',
    objectiveText: 'Hostiles neutralized',
    objective: { type: 'kills', target: 14 },
    waves: [
      { type: 'basic', count: 4, formation: 'line', gap: 3.0 },
      { type: 'interceptor', count: 3, formation: 'sides', gap: 2.8 },
      { type: 'basic', count: 4, formation: 'wedge', gap: 3.0 },
      { type: 'interceptor', count: 4, formation: 'line', gap: 3.0 }
    ]
  },
  {
    id: 3,
    name: 'ENEMY SQUADRON',
    subtitle: 'Operation Steel Talon',
    desc: 'A full hostile squadron is moving into the sector, escorted by armored gunships. Their pilots are aggressive and will track your every move.',
    objectives: ['Destroy 18 enemy aircraft', 'Break the squadron formation'],
    tips: ['Heavy aircraft take more hits — use missiles', 'Keep moving to avoid tracking fire', 'C unleashes a powerful special strike'],
    difficulty: 3,
    theme: 'desert',
    objectiveText: 'Squadron losses inflicted',
    objective: { type: 'kills', target: 18 },
    waves: [
      { type: 'basic', count: 4, formation: 'wedge', gap: 2.8 },
      { type: 'interceptor', count: 3, formation: 'sides', gap: 2.6 },
      { type: 'heavy', count: 1, formation: 'line', gap: 3.2 },
      { type: 'basic', count: 5, formation: 'line', gap: 2.6 },
      { type: 'heavy', count: 2, formation: 'sides', gap: 3.4 }
    ]
  },
  {
    id: 4,
    name: 'MISSILE STORM',
    subtitle: 'Operation Fire Rain',
    desc: 'Advanced hostile fighters equipped with guided missiles have entered the airspace. Their barrage is relentless. Dodge, disrupt, and destroy them before they overwhelm the defense grid.',
    objectives: ['Destroy 12 advanced missile fighters', 'Survive the missile barrage'],
    tips: ['Homing missiles can be outrun with sharp turns', 'The red radar warning shows incoming missiles', 'Use the shield when missiles get close'],
    difficulty: 3,
    theme: 'night',
    objectiveText: 'Missile platforms destroyed',
    objective: { type: 'typeKills', target: 12, enemyType: 'advanced' },
    waves: [
      { type: 'advanced', count: 2, formation: 'sides', gap: 3.0 },
      { type: 'interceptor', count: 4, formation: 'line', gap: 2.6 },
      { type: 'advanced', count: 3, formation: 'wedge', gap: 3.0 },
      { type: 'advanced', count: 2, formation: 'sides', gap: 2.8 },
      { type: 'interceptor', count: 5, formation: 'line', gap: 2.8 }
    ]
  },
  {
    id: 5,
    name: 'STRIKE THE BASE',
    subtitle: 'Operation Broken Lens',
    desc: 'Enemy radar coverage is guiding attacks into friendly airspace. Penetrate the base perimeter and demolish the radar array, air defenses, and support structures.',
    objectives: ['Destroy 6 enemy installations', 'Neutralize the radar and AA network'],
    tips: ['Installations have heavy armor — missiles help', 'Radar dishes and AA guns fire back', 'Destroyed structures leave wreckage on the ground'],
    difficulty: 4,
    theme: 'base',
    objectiveText: 'Installations destroyed',
    objective: { type: 'installations', target: 6 },
    installations: [
      { type: 'radar', x: 220, restY: 260, delay: 1.0 },
      { type: 'aa', x: 560, restY: 340, delay: 2.2 },
      { type: 'radar', x: 1000, restY: 230, delay: 1.6 },
      { type: 'hangar', x: 380, restY: 470, delay: 3.0 },
      { type: 'depot', x: 840, restY: 500, delay: 3.6 },
      { type: 'aa', x: 1120, restY: 430, delay: 2.8 }
    ],
    waves: [
      { type: 'basic', count: 3, formation: 'line', gap: 4.2 },
      { type: 'interceptor', count: 3, formation: 'sides', gap: 4.0 }
    ]
  },
  {
    id: 6,
    name: 'AIR SUPERIORITY',
    subtitle: 'Operation Iron Storm',
    desc: 'The enemy has committed its best pilots and most advanced machines. Expect coordinated attacks, heavy armor, and missile support. Only the strongest will dominate this sky.',
    objectives: ['Destroy 22 enemy aircraft', 'Defeat advanced and heavy units'],
    tips: ['Mix cannon fire with missiles for heavy targets', 'Special weapon clears dense formations', 'Watch your armor — repair crates drop often'],
    difficulty: 5,
    theme: 'night',
    objectiveText: 'Enemy aircraft destroyed',
    objective: { type: 'kills', target: 22 },
    waves: [
      { type: 'advanced', count: 2, formation: 'sides', gap: 2.6 },
      { type: 'heavy', count: 2, formation: 'line', gap: 3.0 },
      { type: 'interceptor', count: 5, formation: 'wedge', gap: 2.4 },
      { type: 'advanced', count: 3, formation: 'line', gap: 2.6 },
      { type: 'bomber', count: 1, formation: 'line', gap: 3.6 },
      { type: 'basic', count: 6, formation: 'sides', gap: 2.4 }
    ]
  },
  {
    id: 7,
    name: 'FINAL ASSAULT',
    subtitle: 'Operation Skyfall',
    desc: 'This is it. The enemy commander has established a fortified headquarters protected by layers of air defense. Destroy the command installations, then take down the OVERLORD itself to secure the skies.',
    objectives: ['Destroy 4 command installations', 'Defeat the OVERLORD commander aircraft'],
    tips: ['The commander has three combat phases', 'Radial attacks leave gaps — fly through them', 'Save missiles and special for the final phase'],
    difficulty: 5,
    theme: 'base',
    objectiveText: 'Assault progress',
    objective: { type: 'final', target: 5 },
    installations: [
      { type: 'aa', x: 180, restY: 260, delay: 0.8 },
      { type: 'radar', x: 480, restY: 300, delay: 1.6 },
      { type: 'hq', x: 780, restY: 380, delay: 2.4 },
      { type: 'aa', x: 1090, restY: 280, delay: 1.2 }
    ],
    bossAt: 16,
    waves: [
      { type: 'advanced', count: 2, formation: 'sides', gap: 3.2 },
      { type: 'interceptor', count: 4, formation: 'line', gap: 3.0 },
      { type: 'heavy', count: 1, formation: 'line', gap: 3.6 }
    ]
  }
]

export class LevelManager {
  constructor() {
    this.level = null
    this.active = false
  }

  start(levelId, game) {
    this.level = LEVELS.find(l => l.id === levelId) || LEVELS[0]
    this.active = true
    this.elapsed = 0
    this.kills = 0
    this.typeKills = 0
    this.installationsDestroyed = 0
    this.bossSpawned = false
    this.bossDefeated = false
    this.completed = false
    this.waveIndex = 0
    this.nextWave = 1.2
    this.cycle = 0
    this.game = game

    for (const s of (this.level.installations || [])) {
      const inst = new Installation(s.type, s.x, -80, {
        restY: s.restY,
        delay: s.delay,
        hpScale: 1 + Math.max(0, this.level.id - 5) * 0.05,
        scrollSpeed: 60
      })
      game.installations.push(inst)
    }
  }

  update(dt, game) {
    if (!this.active || this.completed) return
    this.elapsed += dt

    if (this.level.bossAt && !this.bossSpawned && this.elapsed >= this.level.bossAt) {
      this.bossSpawned = true
      const boss = new Enemy('boss', VW / 2, -100, { hpScale: 1 })
      game.enemies.push(boss)
      game.boss = boss
      game.audio.warning()
      game.toast('WARNING: OVERLORD INBOUND')
      game.shake = 12
    }

    if (game.enemies.filter(e => e.alive && !e.isBoss).length < 12 && this.elapsed >= this.nextWave) {
      this.spawnWave(game)
      const w = this.level.waves[this.waveIndex % this.level.waves.length]
      this.nextWave = this.elapsed + (w.gap || 3) * Math.max(0.7, 1 - this.cycle * 0.07)
      this.waveIndex++
      if (this.waveIndex % this.level.waves.length === 0) this.cycle++
    }

    if (this.isObjectiveMet()) {
      this.completed = true
      game.onLevelComplete()
    }
  }

  spawnWave(game) {
    game.announceWave?.()
    const lvl = this.level
    const w = lvl.waves[this.waveIndex % lvl.waves.length]
    const hpScale = 1 + (lvl.id - 1) * 0.075 + this.cycle * 0.06
    const speedScale = 1 + (lvl.id - 1) * 0.035 + this.cycle * 0.02
    for (let i = 0; i < w.count; i++) {
      let x
      const y = -50 - i * 34
      const delay = i * 0.16
      switch (w.formation) {
        case 'wedge':
          x = VW / 2 + (i - (w.count - 1) / 2) * 110
          break
        case 'sides':
          x = i % 2 === 0 ? rand(60, 260) : rand(VW - 260, VW - 60)
          break
        case 'random':
          x = rand(70, VW - 70)
          break
        case 'line':
        default:
          x = (VW / (w.count + 1)) * (i + 1)
          break
      }
      const e = new Enemy(w.type, x, y, {
        hpScale, speedScale, delay, pattern: w.pattern,
        amp: rand(30, 95), freq: rand(0.7, 1.6)
      })
      game.enemies.push(e)
    }
  }

  onEnemyDestroyed(enemy) {
    this.kills++
    if (enemy.type === this.level.objective.enemyType) this.typeKills++
    if (enemy.isBoss) this.bossDefeated = true
  }

  onInstallationDestroyed() { this.installationsDestroyed++ }

  get progress() {
    const o = this.level?.objective
    if (!o) return 0
    switch (o.type) {
      case 'kills': return Math.min(this.kills, o.target)
      case 'typeKills': return Math.min(this.typeKills, o.target)
      case 'installations': return Math.min(this.installationsDestroyed, o.target)
      case 'final': return Math.min(this.installationsDestroyed, 4) + (this.bossDefeated ? 1 : 0)
      case 'survive': return Math.min(Math.floor(this.elapsed), o.target)
      default: return 0
    }
  }

  get target() { return this.level?.objective ? this.level.objective.target : 1 }

  get progressLabel() {
    const o = this.level?.objective
    if (!o) return ''
    if (o.type === 'final') {
      return `${this.installationsDestroyed}/4 SITES · ${this.bossDefeated ? 'COMMANDER DOWN' : 'COMMANDER ACTIVE'}`
    }
    return `${this.progress} / ${o.target}`
  }

  isObjectiveMet() {
    const o = this.level.objective
    switch (o.type) {
      case 'kills': return this.kills >= o.target
      case 'typeKills': return this.typeKills >= o.target
      case 'installations': return this.installationsDestroyed >= o.target
      case 'survive': return this.elapsed >= o.target
      case 'final': return this.installationsDestroyed >= 4 && this.bossDefeated
      default: return false
    }
  }
}
