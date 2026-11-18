import './style.css'
import { SaveManager } from './game/SaveManager.js'
import { AudioManager } from './game/AudioManager.js'
import { Input } from './game/Input.js'
import { UI } from './ui/Menu.js'
import { Game } from './game/Game.js'

const save = new SaveManager()
const audio = new AudioManager(save.settings)
const input = new Input()
const ui = new UI(save, audio)
const canvas = document.getElementById('game-canvas')
const game = new Game({ canvas, save, audio, input, ui })

let pending = { id: 1, campaign: true }
let briefReturn = 'menu'
let audioBooted = false

function bootAudio() {
  if (audioBooted) return
  audioBooted = true
  audio.init()
  audio.resume()
  if (game.state === 'menu') {
    audio.setMusicMode('menu')
    audio.startMusic('menu')
  }
}
window.addEventListener('pointerdown', bootAudio, { once: true })
window.addEventListener('keydown', bootAudio, { once: true })

function openBriefing(id, campaign, back) {
  pending = { id, campaign }
  briefReturn = back
  ui.showBriefing(id)
}

ui.on('start', () => openBriefing(1, true, 'menu'))
ui.on('continue', () => openBriefing(save.lastLevel, false, 'menu'))
ui.on('selectLevel', (id) => openBriefing(id, false, 'missions'))
ui.on('briefBack', () => ui.show(briefReturn))
ui.on('briefStart', () => {
  if (!pending.campaign) {
    game.campaignScore = Object.values(save.state.bestByLevel).reduce((a, b) => a + b, 0)
    game.campaignKills = save.totalKills
  }
  game.startLevel(pending.id, pending.campaign)
})
ui.on('resume', () => game.resume())
ui.on('restart', () => game.startLevel(game.levelId, false))
ui.on('retry', () => game.startLevel(game.levelId, false))
ui.on('next', () => game.nextLevel())
ui.on('playAgain', () => game.startLevel(1, true))
ui.on('mainMenu', () => game.toMenu())
ui.on('mouseMode', (v) => input.setMouseMode(v))

const stages = [
  [12, 'Initializing flight systems…'],
  [34, 'Calibrating avionics and radar…'],
  [58, 'Loading terrain and mission data…'],
  [78, 'Spooling engine audio…'],
  [94, 'Finalizing combat systems…'],
  [100, 'Ready for deployment.']
]
let stage = 0
const loadTimer = setInterval(() => {
  const [pct, text] = stages[stage++]
  ui.setLoading(pct, text)
  if (stage >= stages.length) {
    clearInterval(loadTimer)
    setTimeout(() => {
      ui.show('menu')
      audio.setMusicMode('menu')
      audio.startMusic('menu')
    }, 260)
  }
}, 170)

window.addEventListener('error', (e) => {
  console.error('[SKYFALL] Runtime error:', e.error || e.message)
})
