# Mini Tanks 🪖

A browser-based artillery game — play against a friend or a heuristic CPU opponent — built with vanilla JavaScript and Canvas. No frameworks, no dependencies.

## Getting Started

```bash
npm install
npm run dev      # dev server at http://localhost:5173
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with hot reload |
| `npm run build` | Bundle and minify into `dist/` for production |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Check for lint issues with Biome |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format source files |
| `npm test` | Run Playwright e2e tests (headless Chromium) |
| `npm run test:ui` | Run tests with the Playwright interactive UI |

## How to Play

Players take turns firing at each other across procedurally generated terrain. Each player gets **10 firing turns**. The player with the higher score wins; health breaks ties.

### Game Modes

| Mode | Description |
|---|---|
| **1 Player** | Face a CPU opponent — choose Easy, Medium, or Hard |
| **2 Players** | Local hot-seat multiplayer |

Both modes let each player pick a tank colour (10 options) before the game starts.

### Controls

| Action | Control |
|---|---|
| Aim | Angle slider **or** ↑ / ↓ arrow keys (±1° per press) |
| Set power | Power slider **or** ← / → arrow keys (±1 per press) |
| Move tank | `<` / `>` buttons (4 moves per turn) |
| Select weapon | **Weapon** button → modal |
| Fire | **FIRE** button |
| Toggle sound | 🔊 button (top centre) |
| Toggle wind | **Enable Wind** checkbox |

### Weapons

| Weapon | Notes |
|---|---|
| Single Shot | Standard shell |
| Heavy Shell | Slower, massive crater |
| Mega Nuke | Enormous blast radius |
| Baby Nuke | Large blast radius |
| Sniper | Direct hit only, no splash |
| Laser | Instant beam, precision |
| Napalm | 7-shell spread with fire particles |
| Spray | 12 random pellets |
| Funky Bomb | Cluster with unpredictable arcs |
| Splitter | Splits mid-air |
| Cluster Bomb | 5 sub-projectiles |
| Bouncer | Reflects off terrain ≤3×, then explodes |
| Boomerang | Reverses direction at apex |
| Roller | Rolls along the ground |
| Air Strike | 5 bombs drop from above |
| Homing Missile | Steers toward the opponent |
| Earthquake | Area damage through terrain |
| Jackhammer | Bounces straight up 5×, small blast each landing |
| Firecracker | Chain of 9 explosions across the field |
| Pile Driver | Drills a narrow shaft through terrain |
| Volcano | 12 lava chunks in a wide arc |
| Lightning Strike | 8 fast bolts in a starburst |
| Meteor Shower | 8 meteors rain down on the target zone |
| Scatter Shot | Fan of 7 sub-shells on impact |
| Dirt Mover | Adds terrain, no damage |
| Dirt Ball | Smaller terrain mound |

### Scoring

Score is based on proximity to the blast centre — direct hit = full points, scaling to 0 at the blast edge. Hitting yourself does not score.

## CPU AI

The CPU uses a two-layer approach:

1. **Physics simulation** — simulates all 179 possible angles and picks the trajectory that passes closest to the target. Angle and power are perturbed by difficulty noise (Easy ±22°, Medium ±10°, Hard ±3°).
2. **Heuristic weapon selection** — scores each weapon against live game state:
   - Close range → prefers Spray, Napalm, Roller, Pile Driver
   - Long range → prefers Sniper, Laser, Boomerang
   - Enemy low health → picks high-damage finishers (Baby/Mega Nuke)
   - Few turns left → prioritises maximum damage
   - Hard difficulty: minimal jitter, consistently optimal picks

> **Future:** An LLM-powered opponent using the Chrome Nano (`window.ai`) built-in API is tracked in [issue #6](https://github.com/oppiniated/mini-tanks/issues/6).

## Audio

All sounds are synthesised with the Web Audio API — no audio files. The 🔊 button in the top bar toggles sound on/off (state persists via `localStorage`).

## Architecture

```
index.html        – Canvas + HTML UI overlay (health bars, sliders, modals)
style.css         – All styles (CSS custom properties)
src/
  main.js         – Entry point; instantiates Engine and wires resize handler
  Engine.js       – Game loop, state machine, AI, scoring, UI wiring
  Audio.js        – Procedural Web Audio API sound engine
  Terrain.js      – Procedural terrain with pixel-accurate collision mask
  Tank.js         – Tank entity (position, health, weapon, drawing)
  Physics.js      – Gravity and wind force application
  Projectile.js   – Base projectile (movement, trail, onHit explosion)
  weapons/        – One file per weapon (26 total)
```

**Engine states:** `AIMING → FIRING → WAITING_TURN → AIMING` (plus `MOVING` and `GAME_OVER`)

## Testing

```bash
npm test          # run all 26 e2e tests headlessly
npm run test:ui   # open Playwright interactive UI
```

Tests cover: start screen, color picker, SFX toggle, all controls, weapon modal, 2P mode, wind toggle, and restart flow.

## Development

Edit any `.js` or `.css` file and Vite will hot-reload automatically. See [`.github/copilot-instructions.md`](.github/copilot-instructions.md) for architecture notes on adding new weapons and extending the AI.
