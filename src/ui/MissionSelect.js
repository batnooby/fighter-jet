import { LEVELS } from '../game/LevelManager.js'

export class MissionSelectPanel {
  constructor(save, audio) {
    this.save = save
    this.audio = audio
    this.onSelect = null
    document.getElementById('btn-missions-back')?.addEventListener('click', () => {
      this.audio.uiClick()
      this.onBack?.()
    })
  }

  render() {
    const grid = document.getElementById('missions-grid')
    if (!grid) return
    grid.innerHTML = ''
    for (const lvl of LEVELS) {
      const unlocked = this.save.isUnlocked(lvl.id)
      const complete = this.save.isCompleted(lvl.id)
      const best = this.save.state.bestByLevel[lvl.id] || 0
      const card = document.createElement('div')
      card.className = `mission-card${unlocked ? '' : ' locked'}${complete ? ' complete' : ''}`
      const pips = Array.from({ length: 5 }, (_, i) => `<i class="${i < lvl.difficulty ? 'on' : ''}"></i>`).join('')
      card.innerHTML = `
        <div class="m-num">OP ${String(lvl.id).padStart(2, '0')} // ${lvl.subtitle.toUpperCase()}</div>
        <div class="m-name">${lvl.name}</div>
        <div class="m-desc">${lvl.desc}</div>
        <div class="m-meta">
          <span class="difficulty">${pips}</span>
          <span class="m-badge ${complete ? 'done' : unlocked ? 'open' : 'lock'}">${complete ? 'CLEARED' : unlocked ? 'AVAILABLE' : 'LOCKED'}</span>
        </div>
        ${best ? `<div class="m-meta"><span class="m-best">BEST ${String(best).padStart(7, '0')}</span></div>` : ''}
      `
      if (unlocked) {
        card.addEventListener('click', () => { this.audio.uiClick(); this.onSelect?.(lvl.id) })
        card.tabIndex = 0
        card.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.onSelect?.(lvl.id) })
      }
      grid.appendChild(card)
    }
    const done = this.save.completed.length
    const el = document.getElementById('missions-progress')
    if (el) el.textContent = `${done} / 7 MISSIONS COMPLETE`
  }
}
