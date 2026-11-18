import { clamp } from './utils.js'

const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  Space: 'fire', KeyX: 'missile', ShiftLeft: 'shield', ShiftRight: 'shield',
  KeyC: 'special', KeyE: 'special',
  Escape: 'pause', KeyP: 'pause'
}

export class Input {
  constructor() {
    this.down = new Set()
    this.pressed = new Set()
    this.pointer = { x: 0, y: 0, active: false }
    this.mouseFire = false
    this.joystick = { x: 0, y: 0 }
    this.mouseMode = false
    this.toVirtual = null
    this.touchDetected = ('ontouchstart' in window) || navigator.maxTouchPoints > 0
    this.bind()
  }

  bind() {
    window.addEventListener('keydown', (e) => {
      const a = KEYMAP[e.code]
      if (a) {
        if (a === 'pause' || e.code === 'Space') e.preventDefault()
        if (!this.down.has(a)) this.pressed.add(a)
        this.down.add(a)
      }
    })
    window.addEventListener('keyup', (e) => {
      const a = KEYMAP[e.code]
      if (a) this.down.delete(a)
    })
    window.addEventListener('blur', () => { this.down.clear(); this.mouseFire = false; this.joystick.x = 0; this.joystick.y = 0 })

    window.addEventListener('mousemove', (e) => this.updatePointer(e.clientX, e.clientY))
    window.addEventListener('mousedown', (e) => {
      if (e.target.closest('button, input, .panel, .mission-card')) return
      if (e.button === 0) {
        this.mouseFire = true
        this.pressed.add('fire')
        this.updatePointer(e.clientX, e.clientY)
      }
      if (e.button === 2) this.pressed.add('missile')
    })
    window.addEventListener('mouseup', (e) => { if (e.button === 0) this.mouseFire = false })
    window.addEventListener('contextmenu', (e) => { if (e.target.id === 'game-canvas') e.preventDefault() })

    const base = document.getElementById('joy-base')
    const knob = document.getElementById('joy-knob')
    if (base && knob) {
      let active = false
      const rect = () => base.getBoundingClientRect()
      const move = (cx, cy) => {
        const r = rect()
        let dx = cx - (r.left + r.width / 2)
        let dy = cy - (r.top + r.height / 2)
        const max = r.width * 0.42
        const len = Math.hypot(dx, dy)
        if (len > max) { dx = dx / len * max; dy = dy / len * max }
        this.joystick.x = clamp(dx / max, -1, 1)
        this.joystick.y = clamp(dy / max, -1, 1)
        knob.style.transform = `translate(${dx}px, ${dy}px)`
      }
      const end = () => { active = false; this.joystick.x = 0; this.joystick.y = 0; knob.style.transform = '' }
      base.addEventListener('pointerdown', (e) => { active = true; base.setPointerCapture(e.pointerId); move(e.clientX, e.clientY); e.preventDefault() })
      base.addEventListener('pointermove', (e) => { if (active) move(e.clientX, e.clientY) })
      base.addEventListener('pointerup', end)
      base.addEventListener('pointercancel', end)
    }

    this.bindHoldButton('touch-fire', 'fire')
    this.bindHoldButton('touch-missile', 'missile')
    this.bindHoldButton('touch-shield', 'shield')
    this.bindHoldButton('touch-special', 'special')
  }

  bindHoldButton(id, action) {
    const el = document.getElementById(id)
    if (!el) return
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      if (!this.down.has(action)) this.pressed.add(action)
      this.down.add(action)
      el.setPointerCapture?.(e.pointerId)
    })
    const end = () => this.down.delete(action)
    el.addEventListener('pointerup', end)
    el.addEventListener('pointercancel', end)
    el.addEventListener('pointerleave', end)
  }

  updatePointer(cx, cy) {
    this.pointer.active = true
    if (this.toVirtual) {
      const p = this.toVirtual(cx, cy)
      this.pointer.x = p.x
      this.pointer.y = p.y
    }
  }

  isDown(action) { return this.down.has(action) || (action === 'fire' && this.mouseFire) }
  consume(action) {
    if (this.pressed.has(action)) { this.pressed.delete(action); return true }
    return false
  }
  clearPressed() { this.pressed.clear() }
  setMouseMode(v) { this.mouseMode = v }

  moveVector() {
    let x = 0, y = 0
    if (this.isDown('left')) x -= 1
    if (this.isDown('right')) x += 1
    if (this.isDown('up')) y -= 1
    if (this.isDown('down')) y += 1
    if (x === 0 && y === 0 && (this.joystick.x || this.joystick.y)) {
      x = this.joystick.x; y = this.joystick.y
    }
    const len = Math.hypot(x, y)
    if (len > 1) { x /= len; y /= len }
    return { x, y }
  }

  targetPosition() {
    if (this.mouseMode && this.pointer.active) return { x: this.pointer.x, y: this.pointer.y }
    return null
  }
}
