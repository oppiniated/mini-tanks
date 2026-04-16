# Pocket Tanks – Copilot Instructions

## Running the Game

```bash
npm install
npm run dev      # Vite dev server at http://localhost:5173
```

The project uses ES modules (`type="module"`), so `index.html` must be served over HTTP — not opened as a `file://` URL.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production bundle → `dist/` |
| `npm run lint` | Biome lint check |
| `npm run lint:fix` | Biome auto-fix |
| `npm test` | Playwright e2e tests (headless Chromium) |
| `npm run test:ui` | Playwright interactive UI |

## Playwright E2E Tests

26 tests live in `tests/game.spec.js`. Config is in `playwright.config.js` — it reuses an existing dev server if one is running.

```bash
npm test
```

Tests assert on HTML overlay elements (`#ui-layer`). The canvas itself is not DOM-inspectable.

A Playwright MCP server is also configured in `.vscode/mcp.json` for interactive browser sessions.

## Architecture

The game is a browser-only, vanilla JS canvas game. Vite is used for dev/build only.

```
index.html          – Canvas element + HTML UI overlay (health bars, sliders, modals)
style.css           – All styles; CSS custom properties defined in :root
src/main.js         – Entry point; instantiates Engine and wires the resize handler
src/Engine.js       – Central game loop, state machine, AI, UI wiring; owns all entities
src/Audio.js        – Procedural Web Audio API sound engine (no audio files)
src/Terrain.js      – Procedural terrain backed by a hidden canvas collision mask
src/Tank.js         – Tank entity (position, health, weapon selection, drawing)
src/Physics.js      – Static gravity/wind force application
src/Projectile.js   – Base projectile (movement, trail, default onHit explosion)
src/weapons/        – One file per weapon (26 total); all extend Weapon.js
```

**Engine state machine** — `this.state` cycles through: `AIMING → FIRING → WAITING_TURN → AIMING` (or `MOVING` when a tank repositions, `GAME_OVER` on win). Turn transitions happen after all projectiles leave the scene.

**Terrain collision mask** — `Terrain` renders to an off-screen canvas (`maskCanvas`). Collision detection reads pixel alpha from cached `imageData`. After any `destroyCircle`/`addCircle` call, `dirty` is set to `true` and `imageData` is refreshed lazily before the next check.

## Key Conventions

### Adding a Weapon
1. Create `src/weapons/MyWeapon.js` extending `Weapon`.
2. Override `fire(x, y, angle, power, ownerId)` and return an array of `Projectile` instances.
3. For custom hit logic, extend `Projectile` and override `onHit(engine)`.
4. For bounce/keep-alive on terrain, override `onTerrainHit(engine)` — return `false` to keep alive, `true` to remove.
5. For per-frame engine access (e.g. homing), override `update(dt, engine)` and call `super.update(dt, engine)`.
6. Register in the `WEAPONS` array **and** `AI_WEAPONS` array at the top of `Engine.js`.
7. Add a score entry to `aiChooseWeapon()` so the CPU knows when to use it.

### Custom Projectile Behaviour
Extend `Projectile` and override as needed:
- `onHit(engine)` — default creates an explosion; override for direct damage, terrain add, etc.
- `onTerrainHit(engine)` — called on terrain collision; returns `true` (remove) or `false` (keep alive). Default calls `onHit`. Used by **Bouncer**.
- `update(dt, engine)` — called every frame. Used by **HomingMissile** and **Boomerang**.

The `engine` reference gives access to `engine.terrain`, `engine.particles`, `engine.p1`, `engine.p2`, `engine.audio`, and `engine.createExplosion()`.

### Coordinate System
- **Y-axis is inverted**: `y=0` is the top of the screen; `vy` is negative for upward motion.
- **Angle convention**: `0°` points right, `90°` points straight up, `180°` points left. Stored in degrees on `Tank.targetAngle`; converted to radians at fire time.
- **Power → velocity**: `magnitude = power * 10` (power 0–100 → velocity 0–1000 px/s).
- **Wind**: value between −50 and 50; applied as `vx += wind * 1.5 * dt` each frame.

### Tank Movement
Each tank starts a turn with 4 moves (`Tank.movesLeft = 4`). Clicking `<`/`>` calls `Engine.startMove(direction)` which:
1. Decrements `movesLeft`; guards against moves while not in `AIMING` state.
2. Sets `targetMoveX` to `tank.x ± MOVE_STEP` (60 px, clamped to canvas bounds).
3. Transitions to `MOVING` state and disables FIRE.

During `MOVING`, `update()` slides the tank toward `targetMoveX` at 100 px/s and snaps `tank.y` to `terrain.getSurfaceHeight(tank.x)` each frame. On arrival, state reverts to `AIMING`. `movesLeft` resets only in `changeTurn()`.

### Scoring & Turn Limits
Each game is limited to **10 firing turns per player** (`Tank.turnsLeft = 10`). Moving does not consume a turn.

```
score += Math.round(baseScore * (1 - dist / (radius + 15)))
```

Full `baseScore` for a direct hit; scales to 0 at the blast edge. Shooting yourself does **not** score.

**All weapons and base scores:**
| Weapon | baseScore | Notes |
|---|---|---|
| Single Shot | 100 | standard shell |
| Heavy Shell | 150 | 0.75× speed, massive crater |
| Mega Nuke | 250 | enormous blast |
| Baby Nuke | 200 | largest standard blast (130px radius) |
| Sniper | 130 | direct hit only, 80 damage, no splash |
| Laser | 140 | instant beam |
| Napalm | 50 | 7 shells ±9° spread, fire particles |
| Spray | 20 | 12 pellets ±20° random spread |
| Funky Bomb | 60 | cluster with unpredictable arcs |
| Splitter | 80 | splits mid-air |
| Cluster Bomb | 40 | per sub-projectile (×5 = 200 max) |
| Bouncer | 110 | reflects off terrain ≤3×, then explodes |
| Boomerang | 120 | flips direction at apex |
| Roller | 90 | rolls along ground |
| Air Strike | 60 | 5 bombs from top; angle=aim, power=spread |
| Homing Missile | 180 | steers vx toward opponent each frame |
| Earthquake | 70 | area damage through terrain |
| Jackhammer | 30 | bounces up 5×, small blast each landing |
| Firecracker | 45 | 9 chain explosions across field |
| Pile Driver | 55 | drills narrow shaft |
| Volcano | 50 | 12 lava chunks in wide arc |
| Lightning Strike | 85 | 8 fast bolts in starburst |
| Meteor Shower | 60 | 8 meteors rain on target zone |
| Scatter Shot | 65 | fan of 7 sub-shells on impact |
| Dirt Mover | 0 | adds terrain, no damage |
| Dirt Ball | 0 | smaller terrain mound (35px) |

### CPU AI

The CPU runs two systems each turn:

**1. Physics trajectory scan** (`aiComputeAngle`): Simulates all 179 angles (1–179°) at dt=0.05s steps up to 6s. Wind applied as `vx += wind * 1.5 * dt`. Returns the angle whose path passes closest to the target. Difficulty noise applied after: Easy ±22°, Medium ±10°, Hard ±3°.

**2. Heuristic weapon selection** (`aiChooseWeapon`): Each weapon has a scoring lambda (0–1) that reads:
- `dist` — horizontal distance to target
- `myHealth` / `foeHealth` — tank health percentages
- `turnsLeft` — remaining firing turns

Scores are multiplied by `skillMult` (Hard=1.0, Medium=0.7, Easy=0.4) and a random jitter is added (Hard ±0.08, Easy ±0.35) so higher difficulties feel more deliberate.

**Adding a weapon to the AI**: add it to `AI_WEAPONS` and add a scoring entry in the `scores` Map inside `aiChooseWeapon()`.

**Future — LLM opponent**: tracked in [issue #6](https://github.com/oppiniated/mini-tanks/issues/6). Recommended approach is the Chrome Nano `window.ai` built-in API (zero download, no API key) with heuristic fallback for other browsers.

### Audio (`src/Audio.js`)
All sounds are synthesised via the Web Audio API — no audio files.

- `playFire()` — called in `fireWeapon()`
- `playExplosion(size)` — called in `createExplosion()`; `size` = `Math.min(1, radius / 100)`
- `playBounce()` — called in `Bouncer.onTerrainHit()`
- `playMove()` — called in `startMove()`
- `playTurnChange()` — called in `changeTurn()`
- `playVictory()` / `playDefeat()` — called in `endGameByScore()`
- `toggle()` — flips `this.enabled` and persists to `localStorage` key `sfx_enabled`

`AudioContext` is created lazily on first sound call (browser gesture policy).

### Start Screen Flow
1P: mode button → color section (P1 swatches + difficulty) → Start Game  
2P: mode button → color section (P1 + P2 swatches, no difficulty) → Start Game  
Restart: → start screen (color section hidden, mode buttons de-selected)

### CSS
Styles use CSS custom properties (`--accent-blue`, `--panel-bg`, etc.) defined in `:root`. The `@extend .glass-panel` comments in `.player-info` and `.status-panel` are non-functional SCSS-style notes — rules are duplicated inline.

### Restart
`Engine.reset()` reinitialises terrain, tanks, and all state without restarting the render loop. The restart button calls `reset()` and hides the game-over overlay.
