export class SaveManager {
  constructor() {
    this.key = 'skyfall.save.v1'
    this.state = this.defaults()
    this.load()
  }

  defaults() {
    return {
      unlocked: [1],
      completed: [],
      bestScore: 0,
      bestByLevel: {},
      lastLevel: 1,
      settings: { master: 70, music: 50, sfx: 80, mute: false, mouseMode: false },
      totalKills: 0
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(this.key)
      if (!raw) return
      const parsed = JSON.parse(raw)
      this.state = { ...this.defaults(), ...parsed, settings: { ...this.defaults().settings, ...(parsed.settings || {}) } }
      if (!Array.isArray(this.state.unlocked) || !this.state.unlocked.length) this.state.unlocked = [1]
      if (!Array.isArray(this.state.completed)) this.state.completed = []
      if (!this.state.bestByLevel || typeof this.state.bestByLevel !== 'object') this.state.bestByLevel = {}
    } catch {
      this.state = this.defaults()
    }
  }

  save() {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)) } catch { /* storage may be unavailable */ }
  }

  get settings() { return this.state.settings }
  get bestScore() { return this.state.bestScore }
  get unlocked() { return this.state.unlocked }
  get completed() { return this.state.completed }
  get lastLevel() { return this.state.lastLevel }
  get totalKills() { return this.state.totalKills }

  updateSettings(patch) {
    this.state.settings = { ...this.state.settings, ...patch }
    this.save()
  }

  isUnlocked(id) { return this.state.unlocked.includes(id) }
  isCompleted(id) { return this.state.completed.includes(id) }

  recordMission(levelId, score, kills, completed) {
    let unlockedNew = false
    if (completed) {
      if (!this.state.completed.includes(levelId)) this.state.completed.push(levelId)
      if (levelId < 7 && !this.state.unlocked.includes(levelId + 1)) {
        this.state.unlocked.push(levelId + 1)
        unlockedNew = levelId + 1
      }
    }
    const prevBest = this.state.bestByLevel[levelId] || 0
    if (score > prevBest) this.state.bestByLevel[levelId] = score
    if (score > this.state.bestScore) this.state.bestScore = score
    if (completed && levelId >= this.state.lastLevel) this.state.lastLevel = Math.min(7, levelId + 1)
    this.state.totalKills = Math.max(this.state.totalKills || 0, 0) + kills
    this.save()
    return { unlockedNew }
  }

  resetProgress() {
    const settings = { ...this.state.settings }
    this.state = this.defaults()
    this.state.settings = settings
    this.save()
  }
}
