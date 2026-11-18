export class SettingsPanel {
  constructor(save, audio) {
    this.save = save
    this.audio = audio
    this.onBack = null
    this.bind()
  }

  bind() {
    const map = [
      ['set-master', 'out-master', 'master'],
      ['set-music', 'out-music', 'music'],
      ['set-sfx', 'out-sfx', 'sfx']
    ]
    for (const [id, outId, key] of map) {
      const el = document.getElementById(id)
      const out = document.getElementById(outId)
      if (!el || !out) continue
      el.addEventListener('input', () => {
        out.textContent = el.value
        this.save.updateSettings({ [key]: Number(el.value) })
        this.audio.applySettings(this.save.settings)
        this.audio.uiClick()
      })
    }
    const mute = document.getElementById('set-mute')
    mute?.addEventListener('change', () => {
      this.save.updateSettings({ mute: mute.checked })
      this.audio.applySettings(this.save.settings)
      this.audio.uiClick()
    })
    const mouse = document.getElementById('set-mouse')
    mouse?.addEventListener('change', () => {
      this.save.updateSettings({ mouseMode: mouse.checked })
      this.onMouseModeChange?.(mouse.checked)
      this.audio.uiClick()
    })
    document.getElementById('btn-settings-back')?.addEventListener('click', () => {
      this.audio.uiClick()
      this.onBack?.()
    })
  }

  sync() {
    const s = this.save.settings
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val }
    const out = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val }
    set('set-master', s.master); out('out-master', s.master)
    set('set-music', s.music); out('out-music', s.music)
    set('set-sfx', s.sfx); out('out-sfx', s.sfx)
    const mute = document.getElementById('set-mute'); if (mute) mute.checked = !!s.mute
    const mouse = document.getElementById('set-mouse'); if (mouse) mouse.checked = !!s.mouseMode
  }
}
