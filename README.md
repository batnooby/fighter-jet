# SKYFALL – Air Dominance

A complete, playable browser-based fighter jet combat game built with HTML5 Canvas, vanilla JavaScript and Vite. No backend, no paid APIs, no external asset downloads — graphics are rendered procedurally and all audio is synthesized at runtime with the Web Audio API.

## Features

- **7 full missions** with unique objectives, waves, enemy types and environments
- **Enemy AI**: basic fighters, fast interceptors, heavy gunships, bombers, missile-equipped advanced fighters and a three-phase boss
- **Destructible installations**: AA batteries, radar stations, hangars, ammunition depots and command HQ
- **Weapons**: twin primary cannons, homing missiles, special strike, deflector shield
- **Damage model**: hull, armor, shield, smoke trails when critical, explosion on death
- **Pickups**: hull repair, armor restore and missile resupply
- **Professional HUD**: health/armor/shield, objective & progress, score/best/level, radar minimap, weapon status, missile and critical-damage warnings
- **Full menus**: animated main menu, mission select with locks/completion/best scores, briefing, pause, settings, credits, game over, mission complete and campaign victory
- **LocalStorage saves**: unlocked levels, completed missions, best scores, campaign progress, settings and audio preferences
- **Performance**: fixed timestep-friendly delta-time loop, object pools for projectiles and particles, offscreen-cached scrolling terrain, automatic pause on tab blur
- **Controls**: keyboard, mouse steering and touch joystick + action buttons

## Quick start

```bash
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

The optimized site is generated in `dist/`. All paths are relative (`base: './'`), so it works from any subfolder.

`npm run build` also creates **`skyfall-standalone.html`** (and a copy in `dist/`). Double-click that file to play the entire game offline in a browser — no server or install required. A ready-to-save `skyfall-air-dominance.zip` in the project root contains the standalone file, README and the full `dist/` build.

## Controls

| Action | Keyboard | Mouse / Touch |
| --- | --- | --- |
| Steer | WASD / Arrow keys | Move cursor / virtual joystick (enable Mouse Mode in Settings) |
| Primary cannon | SPACE (hold) | Left mouse button / FIRE button |
| Homing missiles | X | Right mouse button / MISSILE button |
| Deflector shield | SHIFT | SHIELD button |
| Special strike | C or E | SPECIAL button |
| Pause | ESC | — |

## Project structure

```
fighter_jet/
├── index.html
├── package.json
├── vite.config.js
├── netlify.toml
├── README.md
├── public/assets/{images,audio}/   # reserved for optional custom assets
└── src/
    ├── main.js
    ├── style.css
    ├── game/
    │   ├── Game.js          # loop, state, entities, flow
    │   ├── Player.js
    │   ├── Enemy.js         # AI, patterns, boss phases
    │   ├── Installation.js
    │   ├── Projectile.js    # pooled bullets & homing missiles
    │   ├── Particle.js      # pooled explosions, smoke, debris
    │   ├── Collision.js
    │   ├── LevelManager.js  # 7 mission definitions + objectives
    │   ├── HUD.js
    │   ├── Input.js
    │   ├── AudioManager.js  # synthesized SFX + music
    │   ├── SaveManager.js
    │   ├── Background.js    # cached scrolling themed terrain
    │   └── constants.js / utils.js
    └── ui/
        ├── Menu.js          # screen manager + results screens
        ├── Settings.js
        └── MissionSelect.js
```

## Deploy to GitHub Pages

1. Push the repository to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions** and use a static-site workflow with `npm ci` → `npm run build` → publish `./dist`, or simply build locally and publish the `dist` folder from a branch.
3. Because `base` is `./`, the game works at `https://<user>.github.io/<repo>/` without changes.

Minimal workflow example (`.github/workflows/deploy.yml`):

```yaml
name: Deploy
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## Deploy to Netlify

Connect the repository and use:

- **Build command:** `npm run build`
- **Publish directory:** `dist`

These values are also stored in `netlify.toml`. Alternatively run `npm run build` and drag the `dist` folder onto Netlify Drop.

## Limitations

- Progress is stored in the browser's LocalStorage and is therefore device/browser specific.
- Audio starts only after the first user interaction (browser autoplay policy).
- The game is optimized for desktop; touch controls work but a larger screen is recommended.
- All content is fictional; no real-world trademarks or assets are used.
