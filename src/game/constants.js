export const VW = 1280
export const VH = 720

export const COLORS = {
  cyan: '#5ed6c7',
  cyanBright: '#8ff5e6',
  green: '#9fd66b',
  red: '#ff5a5a',
  amber: '#ffc45a',
  white: '#e8f6f2',
  muted: '#7f97a6'
}

export const PLAYER = {
  speed: 310,
  radius: 16,
  maxHealth: 100,
  maxArmor: 100,
  fireRate: 0.085,
  missileCooldown: 1.1,
  shieldCooldown: 14,
  shieldDuration: 2.4,
  specialCooldown: 26
}

export const ENEMY_TYPES = {
  basic: {
    name: 'Falcon', hp: 24, radius: 17, speed: 130, score: 100, color: '#d06b5a',
    fireRate: 1.4, bulletSpeed: 250, pattern: 'sine', missile: false
  },
  interceptor: {
    name: 'Wisp', hp: 18, radius: 14, speed: 235, score: 150, color: '#e0a24a',
    fireRate: 1.9, bulletSpeed: 300, pattern: 'dive', missile: false
  },
  heavy: {
    name: 'Bulwark', hp: 85, radius: 27, speed: 85, score: 280, color: '#8b8f9c',
    fireRate: 0.85, bulletSpeed: 220, pattern: 'track', missile: false
  },
  bomber: {
    name: 'Anvil', hp: 120, radius: 32, speed: 62, score: 350, color: '#a07a55',
    fireRate: 0.7, bulletSpeed: 200, pattern: 'straight', missile: false
  },
  advanced: {
    name: 'Specter', hp: 55, radius: 19, speed: 165, score: 400, color: '#b46bd0',
    fireRate: 1.1, bulletSpeed: 270, pattern: 'track', missile: true
  },
  boss: {
    name: 'OVERLORD', hp: 1400, radius: 66, speed: 90, score: 5000, color: '#c25a72',
    fireRate: 0.45, bulletSpeed: 260, pattern: 'boss', missile: true
  }
}

export const INSTALLATION_TYPES = {
  aa: { name: 'AA Battery', hp: 55, radius: 22, score: 200, color: '#b98a55', fireRate: 1.5 },
  radar: { name: 'Radar Station', hp: 45, radius: 20, score: 250, color: '#7fae9c', fireRate: 0 },
  hangar: { name: 'Hangar', hp: 90, radius: 30, score: 300, color: '#8a8f7a', fireRate: 0 },
  depot: { name: 'Ammo Depot', hp: 65, radius: 24, score: 280, color: '#c08a5a', fireRate: 0 },
  hq: { name: 'Command HQ', hp: 180, radius: 40, score: 800, color: '#9a7f9c', fireRate: 2.2 }
}
