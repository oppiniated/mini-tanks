# Pocket Tanks – Copilot Instructions

## Running the Game

No build step required. Because the project uses ES modules (`type="module"`), `index.html` must be served over HTTP — not opened as a `file://` URL. Use any static file server, for example:

```bash
npx serve .
# or
python3 -m http.server
```

There are no tests or lint scripts.

## Playwright MCP (Browser Testing)

A Playwright MCP server is configured in `.vscode/mcp.json`. Use it to interact with and test the game in a real browser.

Because the game uses ES modules, it **must be served over HTTP** before Playwright can load it:

```bash
npx serve .        # serves on http://localhost:3000
# or
python3 -m http.server 8080
```

Then use the Playwright MCP tools to navigate to `http://localhost:3000`, interact with canvas and UI elements, and assert on the DOM state (health bars, turn indicator, score displays). The canvas itself is not DOM-inspectable — assertions should target the HTML overlay (`#ui-layer`) elements.

## Architecture

The game is a browser-only, vanilla JS canvas game with no dependencies or bundler.

```
index.html          – Canvas element + HTML UI overlay (health bars, sliders, modals)
style.css           – All styles; uses CSS custom properties defined in :root
src/main.js         – Entry point; instantiates Engine and wires the resize handler
src/Engine.js       – Central game loop and state machine; owns all entities
src/Terrain.js      – Procedural terrain backed by a hidden canvas collision mask
src/Tank.js         – Tank entity (position, health, weapon selection, drawing)
src/Physics.js      – Static gravity/wind force application
src/Projectile.js   – Base projectile (movement, trail, default onHit explosion)
src/weapons/
  Weapon.js         – Base weapon class (fire() contract)
  SingleShot.js     – Standard single projectile
  ClusterBomb.js    – Fires 5 projectiles in a spread
  DirtMover.js      – Custom projectile that adds terrain instead of destroying it
```

**Engine state machine** — `this.state` cycles through: `AIMING → FIRING → WAITING_TURN → AIMING` (or `MOVING` when a tank repositions, `GAME_OVER` on win). Turn transitions happen after all projectiles leave the scene.

**Terrain collision mask** — `Terrain` renders to an off-screen canvas (`maskCanvas`). Collision detection reads pixel alpha from cached `imageData`. After any `destroyCircle`/`addCircle` call, `dirty` is set to `true` and `imageData` is refreshed lazily before the next check.

## Key Conventions

### Adding a Weapon
1. Create `src/weapons/MyWeapon.js` extending `Weapon`.
2. Override `fire(x, y, angle, power, ownerId)` and return an array of `Projectile` instances.
3. For custom hit logic, extend `Projectile` and override `onHit(engine)`.
4. For bounce/keep-alive on terrain, override `onTerrainHit(engine)` — return `false` to keep the projectile alive, `true` to remove it.
5. For per-frame engine access (e.g. homing), override `update(dt, engine)` and call `super.update(dt, engine)`.
6. Register the class in the `WEAPONS` array at the top of `Engine.js` — that's all that's needed for it to appear in the weapon modal.

### Custom Projectile Behaviour
Extend `Projectile` and override as needed:
- `onHit(engine)` — default creates an explosion; override for direct damage, terrain add, etc.
- `onTerrainHit(engine)` — called on terrain collision; returns `true` (remove) or `false` (keep alive). Default calls `onHit`. Used by **Bouncer**.
- `update(dt, engine)` — called every frame; `engine` is always passed now. Used by **HomingMissile** and **Boomerang**.

The `engine` reference gives access to `engine.terrain`, `engine.particles`, `engine.p1`, `engine.p2`, and `engine.createExplosion()`.

### Coordinate System
- **Y-axis is inverted**: `y=0` is the top of the screen; `vy` is negative for upward motion.
- **Angle convention**: `0°` points right, `90°` points straight up, `180°` points left. Stored in degrees on `Tank.targetAngle`; converted to radians at fire time.
- **Power → velocity**: `magnitude = power * 10` (power is 0–100, giving velocity 0–1000 px/s).
- **Wind**: value between −50 and 50; applied as `vx += wind * 1.5 * dt` each frame.

### Tank Movement
Each tank starts a turn with 4 moves (`Tank.movesLeft = 4`). Clicking the `<`/`>` buttons calls `Engine.startMove(direction)` which:
1. Decrements `movesLeft` and guards against moves while not in `AIMING` state.
2. Sets `targetMoveX` to `tank.x ± MOVE_STEP` (60 px, clamped to canvas bounds).
3. Transitions to `MOVING` state and disables FIRE.

During `MOVING`, `update()` slides the tank toward `targetMoveX` at 100 px/s and magnetises `tank.y` to `terrain.getSurfaceHeight(tank.x)` each frame. On arrival, state reverts to `AIMING`. Move buttons stay disabled for the rest of the turn once `movesLeft` reaches 0. `movesLeft` is **not** reset between moves within a turn — only when `changeTurn()` is called (it resets to whatever is stored on the tank at turn start, i.e. 4 each new round).

### Scoring & Turn Limits
Each game is limited to **10 firing turns per player** (`Tank.turnsLeft = 10`). Moving does not consume a turn — only firing does.

**Score** is calculated in `Engine.createExplosion` when the opponent is inside the blast radius:
```
score += Math.round(baseScore * (1 - dist / (radius + 15)))
```
Full `baseScore` is awarded for a direct centre hit; the value scales to 0 at the blast edge. Shooting yourself does **not** score.

**All weapons and base scores:**
| Weapon | baseScore | Notes |
|---|---|---|
| Single Shot | 100 | standard shell |
| Heavy Shell | 150 | 0.75× speed, massive crater |
| Baby Nuke | 200 | largest blast (130px radius) |
| Sniper | 130 | direct hit only, 80 damage, no splash |
| Napalm | 50 | 7 shells ±9° spread, fire particles |
| Spray | 20 | 12 pellets ±20° random spread |
| Cluster Bomb | 40 | per sub-projectile (×5 = 200 max) |
| Dirt Mover | 0 | adds terrain, no damage |
| Dirt Ball | 0 | smaller dirt mound (35px) |
| Bouncer | 110 | reflects off terrain ≤3×, then explodes |
| Boomerang | 120 | flips direction at apex |
| Air Strike | 60 | 5 bombs drop from top; angle=aim, power=spread |
| Homing Missile | 180 | steers vx toward opponent each frame |

To set a score on a new weapon, assign `this.baseScore` in its constructor; the `fire()` method must pass it as the 9th argument to `new Projectile(...)`.

**Turn-limit game over** triggers in `Engine.update()` once both players reach `turnsLeft === 0`. Winner is determined by score; health breaks ties; equal health is a draw.

If one player runs out of turns first, the other continues uncontested until their turns also expire.

### Restart
`Engine.reset()` reinitialises terrain, tanks, and all game state without restarting the render loop (already running via `requestAnimationFrame`). The restart button wired in `setupUI` calls `reset()` and hides the game-over overlay.

### CSS
Styles use plain CSS custom properties (`--accent-blue`, `--panel-bg`, etc.) defined in `:root`. The `@extend .glass-panel` comments in `.player-info` and `.status-panel` are **non-functional SCSS syntax** left in the file — those rules are duplicated inline and not compiled.
