import { LEVELS } from '../game/LevelManager.js'
import { SettingsPanel } from './Settings.js'
import { MissionSelectPanel } from './MissionSelect.js'
import { formatScore } from '../game/utils.js'

const SCREENS = ['loading', 'menu', 'missions', 'settings', 'credits', 'briefing', 'pause', 'gameover', 'levelcomplete', 'victory']

export class UI {
  constructor(save, audio) {
    this.save = save
    this.audio = audio
    this.listeners = {}
    this.current = 'loading'
    this.settingsContext = 'menu'
    this.toastTimer = null

    this.settingsPanel = new SettingsPanel(save, audio)
    this.missionPanel = new MissionSelectPanel(save, audio)
    this.settingsPanel.onBack = () => this.show(this.settingsContext)
    this.settingsPanel.onMouseModeChange = (v) => this.emit('mouseMode', v)
    this.missionPanel.onSelect = (id) => this.emit('selectLevel', id)
    this.missionPanel.onBack = () => this.show('menu')

    this.bindButtons()
    this.show('loading')
  }

  on(event, cb) { (this.listeners[event] ||= []).push(cb) }
  emit(event, ...args) { (this.listeners[event] || []).forEach(cb => cb(...args)) }

  bindButtons() {
    const bind = (id, fn) => document.getElementById(id)?.addEventListener('click', () => { this.audio.uiClick(); fn() })
    bind('btn-start', () => this.emit('start'))
    bind('btn-continue', () => this.emit('continue'))
    bind('btn-missions', () => { this.missionPanel.render(); this.show('missions') })
    bind('btn-settings', () => { this.settingsContext = 'menu'; this.settingsPanel.sync(); this.show('settings') })
    bind('btn-credits', () => this.show('credits'))
    bind('btn-brief-back', () => this.emit('briefBack'))
    bind('btn-brief-start', () => this.emit('briefStart'))
    bind('btn-resume', () => this.emit('resume'))
    bind('btn-restart', () => this.emit('restart'))
    bind('btn-pause-settings', () => { this.settingsContext = 'pause'; this.settingsPanel.sync(); this.show('settings') })
    bind('btn-pause-menu', () => this.emit('mainMenu'))
    bind('btn-retry', () => this.emit('retry'))
    bind('btn-go-menu', () => this.emit('mainMenu'))
    bind('btn-next', () => this.emit('next'))
    bind('btn-lc-menu', () => this.emit('mainMenu'))
    bind('btn-playagain', () => this.emit('playAgain'))
    bind('btn-vic-menu', () => this.emit('mainMenu'))
  }

  show(name) {
    for (const s of SCREENS) {
      const el = document.getElementById(`screen-${s}`)
      if (el) el.classList.toggle('active', s === name)
    }
    this.current = name
    if (name === 'menu') {
      const best = document.getElementById('menu-best')
      if (best) best.textContent = `BEST SCORE ${formatScore(this.save.bestScore)}`
      const cont = document.getElementById('btn-continue')
      if (cont) cont.disabled = this.save.completed.length === 0 && this.save.lastLevel <= 1
    }
  }

  showBriefing(levelId) {
    const lvl = LEVELS.find(l => l.id === levelId) || LEVELS[0]
    const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text }
    set('brief-title', lvl.name)
    set('brief-num', `${lvl.subtitle} · Operation ${String(lvl.id).padStart(2, '0')} of 07 · Difficulty ${lvl.difficulty}/5`)
    set('brief-desc', lvl.desc)
    set('brief-stamp', `OP ${String(lvl.id).padStart(2, '0')}`)
    const obj = document.getElementById('brief-objectives')
    const tips = document.getElementById('brief-tips')
    if (obj) obj.innerHTML = lvl.objectives.map(o => `<li>${o}</li>`).join('')
    if (tips) tips.innerHTML = lvl.tips.map(o => `<li>${o}</li>`).join('')
    this.show('briefing')
  }

  showGameOver(data) {
    const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text }
    set('go-score', formatScore(data.score))
    set('go-kills', String(data.kills))
    set('go-mission', `Operation ${String(data.level).padStart(2, '0')} — ${data.name}`)
    this.show('gameover')
  }

  showLevelComplete(data) {
    const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text }
    set('lc-title', data.level === 7 ? 'FINAL OBJECTIVE SECURED' : 'OBJECTIVES COMPLETE')
    set('lc-mission', `Operation ${String(data.level).padStart(2, '0')} — ${data.name}`)
    set('lc-score', formatScore(data.score))
    set('lc-kills', String(data.kills))
    set('lc-bonus', `+${formatScore(data.bonus)}`)
    const unlock = document.getElementById('lc-unlock')
    if (unlock) unlock.textContent = data.unlockedNew ? `NEW MISSION UNLOCKED: OP ${String(data.unlockedNew).padStart(2, '0')}` : ''
    const next = document.getElementById('btn-next')
    if (next) next.style.display = data.level >= 7 ? 'none' : ''
    this.show('levelcomplete')
  }

  showVictory(data) {
    const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text }
    set('vic-score', formatScore(data.score))
    set('vic-kills', String(data.kills))
    this.show('victory')
  }

  toast(message, warn = false) {
    const el = document.getElementById('toast')
    if (!el) return
    el.textContent = message
    el.classList.toggle('warn', warn)
    el.classList.add('show')
    clearTimeout(this.toastTimer)
    this.toastTimer = setTimeout(() => el.classList.remove('show'), 1700)
  }

  setLoading(pct, text) {
    const fill = document.getElementById('loading-fill')
    const status = document.getElementById('loading-status')
    if (fill) fill.style.width = `${pct}%`
    if (status && text) status.textContent = text
  }
}
