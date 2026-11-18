export class AudioManager {
  constructor(settings) {
    this.settings = settings
    this.ctx = null
    this.ready = false
    this.muted = !!settings.mute
    this.engineOn = false
    this.musicOn = false
    this.noiseBuffer = null
    this.musicTimer = null
    this.step = 0
    this.nextNoteTime = 0
    this.mode = 'menu'
  }

  init() {
    if (this.ready) return
    try {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return
      this.ctx = new AC()
      const len = Math.floor(this.ctx.sampleRate * 1.5)
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
      this.noiseBuffer = buf
      this.ready = true
      this.buildEngine()
    } catch { this.ready = false }
  }

  resume() { if (this.ctx?.state === 'suspended') this.ctx.resume().catch(() => {}) }
  get t() { return this.ctx ? this.ctx.currentTime : 0 }
  get masterGain() { return (this.settings.master / 100) * (this.muted ? 0 : 1) }
  get sfxGain() { return this.masterGain * (this.settings.sfx / 100) }
  get musicGain() { return this.masterGain * (this.settings.music / 100) }

  applySettings(s) {
    this.settings = s
    this.muted = !!s.mute
    if (this.musicGainNode && this.ctx) this.musicGainNode.gain.setTargetAtTime(this.musicGain * 0.5, this.t, 0.05)
    if (this.engineGain && this.ctx && !this.engineOn) this.engineGain.gain.setTargetAtTime(0, this.t, 0.05)
  }

  env(node, peak, attack, decay, gain = this.sfxGain) {
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, this.t)
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * gain), this.t + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, this.t + attack + decay)
    node.connect(g)
    return g
  }

  tone(type, f0, f1, duration, peak = 0.25, destination = null) {
    if (!this.ready) return
    const o = this.ctx.createOscillator()
    o.type = type
    o.frequency.setValueAtTime(f0, this.t)
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), this.t + duration)
    const g = this.ctx.createGain()
    const target = destination || this.ctx.destination
    const vol = destination ? peak : peak * this.sfxGain
    g.gain.setValueAtTime(0.0001, this.t)
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), this.t + Math.min(0.02, duration * 0.2))
    g.gain.exponentialRampToValueAtTime(0.0001, this.t + duration)
    o.connect(g); g.connect(target)
    o.start(); o.stop(this.t + duration + 0.02)
  }

  noise(duration, filterType, f0, f1, peak = 0.3, destination = null) {
    if (!this.ready) return
    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    const flt = this.ctx.createBiquadFilter()
    flt.type = filterType
    flt.frequency.setValueAtTime(f0, this.t)
    flt.frequency.exponentialRampToValueAtTime(Math.max(40, f1), this.t + duration)
    const g = this.ctx.createGain()
    const target = destination || this.ctx.destination
    const vol = destination ? peak : peak * this.sfxGain
    g.gain.setValueAtTime(0.0001, this.t)
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), this.t + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, this.t + duration)
    src.connect(flt); flt.connect(g); g.connect(target)
    src.start(); src.stop(this.t + duration + 0.02)
  }

  gun() {
    if (!this.ready) return
    this.tone('square', 680, 190, 0.075, 0.12)
    this.noise(0.06, 'highpass', 1400, 700, 0.13)
  }
  missile() {
    this.tone('sawtooth', 180, 900, 0.42, 0.18)
    this.noise(0.5, 'bandpass', 400, 2200, 0.22)
  }
  explosion(big = false) {
    const d = big ? 0.85 : 0.42
    this.noise(d, 'lowpass', big ? 1800 : 1200, 70, big ? 0.65 : 0.38)
    this.tone('sine', big ? 110 : 160, 35, d * 0.8, big ? 0.35 : 0.2)
  }
  hit() { this.noise(0.09, 'bandpass', 900, 400, 0.16) }
  shield() { this.tone('sine', 420, 1100, 0.3, 0.2); this.tone('triangle', 260, 700, 0.35, 0.12) }
  shieldBreak() { this.tone('square', 900, 120, 0.35, 0.16); this.noise(0.3, 'highpass', 2000, 500, 0.2) }
  warning() {
    this.tone('square', 880, 880, 0.12, 0.15)
    setTimeout(() => this.tone('square', 880, 880, 0.12, 0.15), 170)
  }
  special() {
    this.noise(1.1, 'lowpass', 900, 60, 0.7)
    this.tone('sawtooth', 220, 40, 0.9, 0.3)
  }
  uiClick() { this.tone('square', 520, 720, 0.06, 0.08) }
  missionComplete() {
    if (!this.ready) return
    const notes = [523, 659, 784, 1047]
    notes.forEach((f, i) => setTimeout(() => this.tone('triangle', f, f, 0.3, 0.22), i * 130))
  }
  gameOver() {
    if (!this.ready) return
    const notes = [392, 330, 262, 196]
    notes.forEach((f, i) => setTimeout(() => this.tone('sawtooth', f, f * 0.98, 0.4, 0.16), i * 200))
  }

  buildEngine() {
    if (!this.ctx || this.engineGain) return
    const g = this.ctx.createGain()
    g.gain.value = 0
    const flt = this.ctx.createBiquadFilter()
    flt.type = 'lowpass'
    flt.frequency.value = 420
    flt.Q.value = 3
    const o1 = this.ctx.createOscillator()
    o1.type = 'sawtooth'; o1.frequency.value = 58
    const o2 = this.ctx.createOscillator()
    o2.type = 'sawtooth'; o2.frequency.value = 61
    const n = this.ctx.createBufferSource()
    n.buffer = this.noiseBuffer; n.loop = true
    const ng = this.ctx.createGain(); ng.gain.value = 0.12
    o1.connect(flt); o2.connect(flt); n.connect(ng); ng.connect(flt)
    flt.connect(g); g.connect(this.ctx.destination)
    o1.start(); o2.start(); n.start()
    this.engineGain = g
    this.engineFilter = flt
    this.engineOsc1 = o1
    this.engineOsc2 = o2
  }

  setEngine(on, intensity = 0.5) {
    this.engineOn = on
    if (!this.ready || !this.engineGain) return
    const vol = on ? this.sfxGain * (0.035 + intensity * 0.04) : 0
    this.engineGain.gain.setTargetAtTime(vol, this.t, 0.12)
    this.engineFilter.frequency.setTargetAtTime(320 + intensity * 620, this.t, 0.15)
    this.engineOsc1.frequency.setTargetAtTime(50 + intensity * 40, this.t, 0.2)
    this.engineOsc2.frequency.setTargetAtTime(54 + intensity * 42, this.t, 0.2)
  }

  buildMusicBus() {
    if (this.musicGainNode) return
    const g = this.ctx.createGain()
    g.gain.value = this.musicGain * 0.5
    g.connect(this.ctx.destination)
    this.musicGainNode = g
  }

  startMusic(mode = 'game') {
    this.mode = mode
    if (!this.ready || this.musicTimer) return
    this.buildMusicBus()
    this.musicGainNode.gain.setTargetAtTime(this.musicGain * 0.5, this.t, 0.2)
    this.step = 0
    this.nextNoteTime = this.t + 0.08
    this.musicTimer = setInterval(() => this.scheduleMusic(), 60)
  }

  setMusicMode(mode) { this.mode = mode }
  stopMusic() {
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null }
    if (this.musicGainNode) this.musicGainNode.gain.setTargetAtTime(0, this.t, 0.2)
  }

  scheduleMusic() {
    if (!this.ctx) return
    const spb = 60 / (this.mode === 'menu' ? 96 : 128) / 4
    const bassGame = [55, 55, 65.4, 55, 73.4, 55, 65.4, 49, 55, 55, 65.4, 55, 82.4, 73.4, 65.4, 49]
    const bassMenu = [65.4, 0, 73.4, 0, 55, 0, 49, 0, 65.4, 0, 73.4, 0, 58.3, 0, 49, 0]
    const arpGame = [220, 261.6, 329.6, 261.6, 220, 293.7, 349.2, 293.7, 196, 246.9, 293.7, 246.9, 220, 261.6, 329.6, 392]
    const arpMenu = [261.6, 0, 329.6, 0, 392, 0, 329.6, 0, 220, 0, 261.6, 0, 329.6, 0, 293.7, 0]
    const bass = this.mode === 'menu' ? bassMenu : bassGame
    const arp = this.mode === 'menu' ? arpMenu : arpGame

    while (this.nextNoteTime < this.t + 0.15) {
      const i = this.step % 16
      const time = this.nextNoteTime
      const bus = this.musicGainNode
      if (bass[i]) this.schedTone('triangle', bass[i], spb * 3.2, 0.22, time, bus)
      if (arp[i]) this.schedTone('square', arp[i], spb * 1.3, this.mode === 'menu' ? 0.055 : 0.075, time, bus)
      if (i % 4 === 0 && this.mode !== 'menu') this.schedNoise(0.07, 0.05, time, bus)
      this.nextNoteTime += spb
      this.step++
    }
  }

  schedTone(type, freq, dur, peak, time, bus) {
    const o = this.ctx.createOscillator()
    o.type = type; o.frequency.setValueAtTime(freq, time)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, time)
    g.gain.exponentialRampToValueAtTime(peak, time + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur)
    o.connect(g); g.connect(bus)
    o.start(time); o.stop(time + dur + 0.02)
  }

  schedNoise(dur, peak, time, bus) {
    const s = this.ctx.createBufferSource()
    s.buffer = this.noiseBuffer
    const f = this.ctx.createBiquadFilter()
    f.type = 'highpass'; f.frequency.value = 4000
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(peak, time)
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur)
    s.connect(f); f.connect(g); g.connect(bus)
    s.start(time); s.stop(time + dur + 0.02)
  }
}
