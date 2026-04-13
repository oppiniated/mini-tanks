# Mini Tanks 🪖

A browser-based 2-player artillery game built with vanilla JavaScript and Canvas.

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

## How to Play

Two players take turns firing at each other across procedurally generated terrain. Each player gets **10 turns** to deal as much damage as possible. The player with the higher score at the end wins.

### Controls

| Action | Control |
|---|---|
| Aim | Angle slider |
| Set power | Power slider |
| Move tank | `<` / `>` buttons (4 moves per turn) |
| Select weapon | **Weapons** button |
| Fire | **FIRE** button |

### Weapons

| Weapon | Description |
|---|---|
| Single Shot | Standard shell |
| Heavy Shell | Slower but massive crater |
| Baby Nuke | Largest blast radius |
| Sniper | Direct hit only, no splash |
| Napalm | 7-shell spread with fire particles |
| Spray | 12 random pellets |
| Cluster Bomb | Splits into 5 sub-projectiles |
| Bouncer | Reflects off terrain up to 3× then explodes |
| Boomerang | Flips direction at its apex |
| Air Strike | 5 bombs drop from above |
| Homing Missile | Steers toward the opponent |
| Dirt Mover | Adds terrain instead of destroying it |
| Dirt Ball | Smaller terrain mound |

### Scoring

Score is based on proximity to the blast centre — a direct hit scores maximum points, scaling to 0 at the blast edge. Hitting yourself does not score. Health breaks score ties; a draw is possible.

## Architecture

```
index.html        – Canvas + HTML UI overlay (health bars, sliders, modals)
style.css         – All styles (CSS custom properties)
src/
  main.js         – Entry point
  Engine.js       – Game loop, state machine, scoring
  Terrain.js      – Procedural terrain with collision mask
  Tank.js         – Tank entity (position, health, drawing)
  Physics.js      – Gravity and wind
  Projectile.js   – Base projectile class
  weapons/        – Individual weapon implementations
```

**Engine states:** `AIMING → FIRING → WAITING_TURN → AIMING` (plus `MOVING` and `GAME_OVER`)

## Development

Edit any `.js` or `.css` file and Vite will hot-reload the browser automatically. See [`CONTRIBUTING`](.github/copilot-instructions.md) for architecture notes on adding new weapons.
