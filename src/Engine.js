import { AudioManager } from "./Audio.js";
import { applyForces } from "./Physics.js";
import { Tank } from "./Tank.js";
import { Terrain } from "./Terrain.js";
import { AirStrike } from "./weapons/AirStrike.js";
import { BabyNuke } from "./weapons/BabyNuke.js";
import { Boomerang } from "./weapons/Boomerang.js";
import { Bouncer } from "./weapons/Bouncer.js";
import { ClusterBomb } from "./weapons/ClusterBomb.js";
import { DirtBall } from "./weapons/DirtBall.js";
import { DirtMover } from "./weapons/DirtMover.js";
import { Earthquake } from "./weapons/Earthquake.js";
import { Firecracker } from "./weapons/Firecracker.js";
import { FunkyBomb } from "./weapons/FunkyBomb.js";
import { HeavyShell } from "./weapons/HeavyShell.js";
import { HomingMissile } from "./weapons/HomingMissile.js";
import { Jackhammer } from "./weapons/Jackhammer.js";
import { Laser } from "./weapons/Laser.js";
import { LightningStrike } from "./weapons/LightningStrike.js";
import { MegaNuke } from "./weapons/MegaNuke.js";
import { MeteorShower } from "./weapons/MeteorShower.js";
import { Napalm } from "./weapons/Napalm.js";
import { PileDriver } from "./weapons/PileDriver.js";
import { Roller } from "./weapons/Roller.js";
import { ScatterShot } from "./weapons/ScatterShot.js";
import { SingleShot } from "./weapons/SingleShot.js";
import { Sniper } from "./weapons/Sniper.js";
import { Splitter } from "./weapons/Splitter.js";
import { Spray } from "./weapons/Spray.js";
import { Tracer } from "./weapons/Tracer.js";
import { Volcano } from "./weapons/Volcano.js";

// Weapons the AI will randomly cycle through — excludes terrain-only tools
// (DirtMover, DirtBall) and AirStrike (whose angle maps to canvas X, not trajectory).
const AI_WEAPONS = [
  SingleShot,
  HeavyShell,
  MegaNuke,
  BabyNuke,
  Sniper,
  Laser,
  Napalm,
  Spray,
  FunkyBomb,
  Splitter,
  ClusterBomb,
  Bouncer,
  Boomerang,
  Roller,
  HomingMissile,
  Earthquake,
  Jackhammer,
  Firecracker,
  PileDriver,
  Volcano,
  LightningStrike,
  MeteorShower,
  ScatterShot,
];

const TANK_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f43f5e", // Rose
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#84cc16", // Lime
  "#f97316", // Orange
  "#e2e8f0", // Silver
];

const WEAPONS = [
  SingleShot,
  HeavyShell,
  MegaNuke,
  BabyNuke,
  Sniper,
  Laser,
  Napalm,
  Spray,
  FunkyBomb,
  Splitter,
  ClusterBomb,
  Bouncer,
  Boomerang,
  Roller,
  AirStrike,
  HomingMissile,
  DirtMover,
  DirtBall,
  Tracer,
  Earthquake,
  Jackhammer,
  Firecracker,
  PileDriver,
  Volcano,
  LightningStrike,
  MeteorShower,
  ScatterShot,
];

export class Engine {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });

    this.lastTime = 0;
    this.projectiles = [];
    this.particles = [];

    this.state = "MENU"; // MENU, AIMING, FIRING, GAME_OVER
    this.currentPlayer = 1; // 1 or 2
    this.wind = 0;
    this.windEnabled = true;
    this.targetMoveX = 0;
    this.moveDirection = 0;
    this.singlePlayer = false;
    this.aiDifficulty = "medium"; // 'easy' | 'medium' | 'hard'
    this.p1Color = TANK_COLORS[0];
    this.p2Color = TANK_COLORS[1];
    this.audio = new AudioManager();

    this.setupUI();
  }

  init() {
    this.resize();
    requestAnimationFrame((t) => this.loop(t));
    // Start screen is shown by default; game starts when player picks a mode
  }

  reset() {
    this.aiThinking = false;
    this.lastAIWeapon = null;
    this.projectiles = [];
    this.particles = [];

    this.terrain = new Terrain(this.canvas.width, this.canvas.height);
    this.terrain.generate();

    const p1X = this.canvas.width * 0.2;
    this.p1 = new Tank(
      1,
      p1X,
      this.terrain.getSurfaceHeight(p1X),
      this.p1Color,
    );
    this.p1.targetAngle = 45;
    this.p1.weaponClass = SingleShot;

    const p2X = this.canvas.width * 0.8;
    this.p2 = new Tank(
      2,
      p2X,
      this.terrain.getSurfaceHeight(p2X),
      this.p2Color,
    );
    this.p2.targetAngle = 135;
    this.p2.weaponClass = SingleShot;

    const p2Label = document.getElementById("p2-name");
    if (p2Label) p2Label.innerText = this.singlePlayer ? "CPU" : "Player 2";

    this.changeTurn(1);
    this.generateWind();
    this.state = "AIMING";
    this.updateScoreUI();
  }

  startGame(mode) {
    this.singlePlayer = mode === "single";
    // CPU auto-picks a color that doesn't clash with P1's choice
    if (this.singlePlayer) {
      this.p2Color =
        TANK_COLORS.find((c) => c !== this.p1Color) ?? TANK_COLORS[1];
    }
    document.getElementById("start-screen").classList.add("hidden");
    this.reset();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    // Re-generate if resizing drastically, but for now just clear
    if (this.terrain) {
      this.terrain.resize(this.canvas.width, this.canvas.height);
      this.p1.y = this.terrain.getSurfaceHeight(this.p1.x);
      this.p2.y = this.terrain.getSurfaceHeight(this.p2.x);
    }
  }

  generateWind() {
    if (!this.windEnabled) return;
    // Wind from -50 to 50
    this.wind = (Math.random() - 0.5) * 100;
    document.getElementById("wind-val").innerText = Math.round(this.wind);
  }

  setupUI() {
    this.ui = {
      angleVal: document.getElementById("angle-val"),
      angleSlider: document.getElementById("angle-slider"),
      powerVal: document.getElementById("power-val"),
      powerSlider: document.getElementById("power-slider"),
      fireBtn: document.getElementById("fire-btn"),
      weaponSelectBtn: document.getElementById("weapon-select-btn"),
      weaponModal: document.getElementById("weapon-modal"),
      closeModalBtn: document.getElementById("close-modal-btn"),
      p1Health: document.getElementById("p1-health"),
      p2Health: document.getElementById("p2-health"),
      turnIndicator: document.getElementById("turn-indicator"),
      windToggle: document.getElementById("wind-toggle"),
      moveLeftBtn: document.getElementById("move-left-btn"),
      moveRightBtn: document.getElementById("move-right-btn"),
      movesLeftVal: document.getElementById("moves-left-val"),
      sfxBtn: document.getElementById("sfx-btn"),
    };

    // Sync SFX button state with persisted preference
    this._updateSfxBtn();
    this.ui.sfxBtn.addEventListener("click", () => {
      this.audio.toggle();
      this._updateSfxBtn();
    });

    this.ui.moveLeftBtn.addEventListener("click", () => this.startMove(-1));
    this.ui.moveRightBtn.addEventListener("click", () => this.startMove(1));

    document.getElementById("restart-btn").addEventListener("click", () => {
      document.getElementById("game-over-screen").classList.add("hidden");
      document.getElementById("color-section").classList.add("hidden");
      document.getElementById("difficulty-select").classList.add("hidden");
      document.getElementById("btn-1p").classList.remove("selected");
      document.getElementById("btn-2p").classList.remove("selected");
      document.getElementById("start-screen").classList.remove("hidden");
    });

    this.ui.windToggle.addEventListener("change", (e) => {
      this.windEnabled = e.target.checked;
      if (!this.windEnabled) {
        this.wind = 0;
        document.getElementById("wind-val").innerText = "0";
      } else {
        this.generateWind();
      }
    });

    this.ui.angleSlider.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      this.ui.angleVal.innerText = val;
      this.activeTank().targetAngle = val;
    });

    this.ui.powerSlider.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      this.ui.powerVal.innerText = val;
      this.activeTank().power = val;
    });

    document.addEventListener("keydown", (e) => {
      if (
        this.state !== "AIMING" ||
        (this.singlePlayer && this.currentPlayer === 2)
      )
        return;
      // Prevent arrow keys from scrolling the page
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }
      const tank = this.activeTank();
      if (e.key === "ArrowUp") {
        tank.targetAngle = (tank.targetAngle + 1) % 360;
        this.ui.angleSlider.value = tank.targetAngle;
        this.ui.angleVal.innerText = tank.targetAngle;
      } else if (e.key === "ArrowDown") {
        tank.targetAngle = (tank.targetAngle - 1 + 360) % 360;
        this.ui.angleSlider.value = tank.targetAngle;
        this.ui.angleVal.innerText = tank.targetAngle;
      } else if (e.key === "ArrowRight") {
        tank.power = Math.min(100, tank.power + 1);
        this.ui.powerSlider.value = tank.power;
        this.ui.powerVal.innerText = tank.power;
      } else if (e.key === "ArrowLeft") {
        tank.power = Math.max(0, tank.power - 1);
        this.ui.powerSlider.value = tank.power;
        this.ui.powerVal.innerText = tank.power;
      } else if (e.key === "Enter") {
        if (this.state === "AIMING") {
          this.fireWeapon();
        }
        // < moves left and > moves right
      } else if (e.key === ",") {
        this.startMove(-1);
      } else if (e.key === ".") {
        this.startMove(1);
      }
    });

    this.ui.fireBtn.addEventListener("click", () => {
      if (this.state === "AIMING") {
        this.fireWeapon();
      }
    });

    this.ui.weaponSelectBtn.addEventListener("click", () => {
      this.populateWeaponModal();
      this.ui.weaponModal.classList.remove("hidden");
    });

    this.ui.closeModalBtn.addEventListener("click", () => {
      this.ui.weaponModal.classList.add("hidden");
    });

    // Generate color swatches for both players
    const makeSwatches = (containerId, isP1) => {
      const container = document.getElementById(containerId);
      const defaultIdx = isP1 ? 0 : 1;
      TANK_COLORS.forEach((color, i) => {
        const btn = document.createElement("button");
        btn.className = `color-swatch${i === defaultIdx ? " selected" : ""}`;
        btn.style.background = color;
        btn.title = color;
        btn.addEventListener("click", () => {
          container.querySelectorAll(".color-swatch").forEach((b) => {
            b.classList.remove("selected");
          });
          btn.classList.add("selected");
          if (isP1) this.p1Color = color;
          else this.p2Color = color;
        });
        container.appendChild(btn);
      });
    };
    makeSwatches("p1-swatches", true);
    makeSwatches("p2-swatches", false);

    // Difficulty buttons update aiDifficulty (medium is default / pre-selected)
    document.querySelectorAll(".diff-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".diff-btn").forEach((b) => {
          b.classList.remove("selected");
        });
        btn.classList.add("selected");
        this.aiDifficulty = btn.dataset.diff;
      });
    });

    // Mode buttons reveal color section (+ difficulty for 1P)
    document.getElementById("btn-1p").addEventListener("click", () => {
      this._pendingMode = "single";
      document.getElementById("p1-color-label").innerText = "Your Tank Color";
      document.getElementById("p2-color-row").classList.add("hidden");
      document.getElementById("difficulty-select").classList.remove("hidden");
      document.getElementById("color-section").classList.remove("hidden");
      document.getElementById("btn-1p").classList.add("selected");
      document.getElementById("btn-2p").classList.remove("selected");
    });

    document.getElementById("btn-2p").addEventListener("click", () => {
      this._pendingMode = "two";
      document.getElementById("p1-color-label").innerText = "Player 1 Color";
      document.getElementById("p2-color-row").classList.remove("hidden");
      document.getElementById("difficulty-select").classList.add("hidden");
      document.getElementById("color-section").classList.remove("hidden");
      document.getElementById("btn-2p").classList.add("selected");
      document.getElementById("btn-1p").classList.remove("selected");
    });

    document.getElementById("start-btn").addEventListener("click", () => {
      this.startGame(this._pendingMode ?? "two");
    });
  }

  populateWeaponModal() {
    const list = document.getElementById("weapon-list");
    list.innerHTML = "";

    WEAPONS.forEach((WeaponClass) => {
      const w = new WeaponClass();
      const div = document.createElement("div");
      div.className = "weapon-card";
      if (this.activeTank().weaponClass === WeaponClass) {
        div.classList.add("selected");
      }

      div.innerHTML = `
                <h3 style="color:${w.color}">${w.name}</h3>
                <p style="font-size:0.8rem; margin-top:5px; color:#94a3b8">${w.description}</p>
            `;

      div.addEventListener("click", () => {
        this.activeTank().weaponClass = WeaponClass;
        this.ui.weaponSelectBtn.innerText = `Weapon: ${w.name}`;
        this.ui.weaponModal.classList.add("hidden");
      });

      list.appendChild(div);
    });
  }

  _updateSfxBtn() {
    this.ui.sfxBtn.textContent = this.audio.enabled ? "🔊" : "🔇";
    this.ui.sfxBtn.title = this.audio.enabled
      ? "Sound On (click to mute)"
      : "Sound Off (click to unmute)";
  }

  activeTank() {
    return this.currentPlayer === 1 ? this.p1 : this.p2;
  }

  changeTurn(player) {
    this.currentPlayer = player;

    // Snap both tanks to the current terrain surface so they don't float
    // after terrain-modifying weapons (Earthquake, DirtMover, BabyNuke, etc.)
    this.p1.y = this.terrain.getSurfaceHeight(this.p1.x);
    this.p2.y = this.terrain.getSurfaceHeight(this.p2.x);

    const tank = this.activeTank();

    // Update UI
    this.ui.angleSlider.value = tank.targetAngle;
    this.ui.angleVal.innerText = Math.round(tank.targetAngle);

    this.ui.powerSlider.value = tank.power;
    this.ui.powerVal.innerText = Math.round(tank.power);

    const name = this.singlePlayer && player === 2 ? "CPU" : `Player ${player}`;
    this.ui.turnIndicator.innerText = `${name}'s Turn`;
    this.ui.turnIndicator.style.color = (
      player === 1 ? this.p1 : this.p2
    ).color;
    this.ui.weaponSelectBtn.innerText = `Weapon: ${new tank.weaponClass().name}`;

    tank.movesLeft = 4;
    this.ui.movesLeftVal.innerText = tank.movesLeft;
    this.ui.moveLeftBtn.disabled = false;
    this.ui.moveRightBtn.disabled = false;

    this.state = "AIMING";
    this.ui.fireBtn.disabled = tank.turnsLeft <= 0;
    this.ui.fireBtn.style.opacity = tank.turnsLeft <= 0 ? 0.5 : 1;

    this.audio.playTurnChange();

    // In single-player mode, schedule AI turn for player 2
    if (this.singlePlayer && player === 2) {
      this.ui.fireBtn.disabled = true;
      this.ui.fireBtn.style.opacity = 0.5;
      this.ui.moveLeftBtn.disabled = true;
      this.ui.moveRightBtn.disabled = true;
      this.scheduleAITurn();
    }
  }

  scheduleAITurn() {
    this.aiThinking = true;
    this.ui.turnIndicator.innerText = "CPU thinking...";
    this.ui.turnIndicator.style.color = "#a78bfa";

    setTimeout(() => {
      if (this.state !== "AIMING" || this.currentPlayer !== 2) return;

      this.aiThinking = false;

      const tank = this.p2;
      const target = this.p1;
      const action = this.findBestAIAction(tank, target);

      const finishShot = () => {
        tank.weaponClass = action.weaponClass;
        this.lastAIWeapon = action.weaponClass;
        tank.targetAngle = action.angle;
        tank.power = action.power;

        this.ui.weaponSelectBtn.innerText = `Weapon: ${new tank.weaponClass().name}`;
        this.ui.angleSlider.value = tank.targetAngle;
        this.ui.angleVal.innerText = Math.round(tank.targetAngle);
        this.ui.powerSlider.value = tank.power;
        this.ui.powerVal.innerText = Math.round(tank.power);

        this.fireWeapon();
      };

      if (action.moveSteps && action.moveSteps !== 0) {
        this.performAIMove(tank, action.moveSteps);
        setTimeout(() => {
          if (this.state !== "AIMING" || this.currentPlayer !== 2) return;
          finishShot();
        }, 450);
      } else {
        finishShot();
      }
    }, 900);
  }

  findBestAIAction(tank, target) {
    const cfg = this.getAIConfig();
    const weaponChoices = this.getTopAIWeapons(tank, target, cfg.topWeapons);
    const moveChoices = this.getAIMoveChoices(cfg);

    let bestAction = null;
    let bestScore = -Infinity;

    for (const moveSteps of moveChoices) {
      const movedTank = this.getVirtualMovedTank(tank, moveSteps);

      for (const WeaponClass of weaponChoices) {
        for (const angle of this.sampleAngles(cfg.angleSamples)) {
          for (const power of this.samplePowers(cfg.powerSamples)) {
            const result = this.simulateCandidateShot(
              movedTank,
              target,
              WeaponClass,
              angle,
              power,
            );

            const score = this.scoreCandidateShot(
              movedTank,
              target,
              WeaponClass,
              angle,
              power,
              result,
              moveSteps,
            );

            if (score > bestScore) {
              bestScore = score;
              bestAction = {
                weaponClass: WeaponClass,
                angle,
                power,
                moveSteps,
              };
            }
          }
        }
      }
    }

    if (!bestAction) {
      const fallbackWeapon = this.aiChooseWeapon(tank, target);
      const fallbackPower = 65;
      const fallbackAngle = this.aiComputeAngle(tank, target, fallbackPower);

      bestAction = {
        weaponClass: fallbackWeapon,
        angle: fallbackAngle,
        power: fallbackPower,
        moveSteps: 0,
      };
    }

    return {
      weaponClass: bestAction.weaponClass,
      moveSteps: bestAction.moveSteps ?? 0,
      angle: this.clamp(
        bestAction.angle + this.randInt(-cfg.angleNoise, cfg.angleNoise),
        1,
        179,
      ),
      power: this.clamp(
        Math.round(
          bestAction.power + this.randInt(-cfg.powerNoise, cfg.powerNoise),
        ),
        10,
        100,
      ),
    };
  }

  getAIConfig() {
    return (
      {
        easy: {
          topWeapons: 4,
          angleSamples: 10,
          powerSamples: 7,
          angleNoise: 8,
          powerNoise: 10,
        },
        medium: {
          topWeapons: 6,
          angleSamples: 16,
          powerSamples: 10,
          angleNoise: 4,
          powerNoise: 5,
        },
        hard: {
          topWeapons: 8,
          angleSamples: 24,
          powerSamples: 13,
          angleNoise: 1,
          powerNoise: 2,
        },
      }[this.aiDifficulty] ?? {
        topWeapons: 6,
        angleSamples: 16,
        powerSamples: 10,
        angleNoise: 4,
        powerNoise: 5,
      }
    );
  }

  getAIMoveChoices(cfg) {
    if (this.aiDifficulty === "easy") return [0];
    if (this.aiDifficulty === "medium") return [-2, -1, 0, 1, 2];
    return [-4, -3, -2, -1, 0, 1, 2, 3, 4];
  }

  getVirtualMovedTank(tank, moveSteps) {
    const clone = {
      ...tank,
      x: tank.x,
      y: tank.y,
    };

    if (!moveSteps) return clone;

    const stepSize = 12;
    const direction = Math.sign(moveSteps);
    const totalSteps = Math.abs(moveSteps);

    for (let i = 0; i < totalSteps; i++) {
      const nextX = clone.x + direction * stepSize;
      const groundY = this.findGroundY(nextX);

      if (groundY == null) break;

      clone.x = nextX;
      clone.y = groundY;
    }

    return clone;
  }

  performAIMove(tank, moveSteps) {
    if (!moveSteps) return;

    const stepSize = 12;
    const direction = Math.sign(moveSteps);
    const totalSteps = Math.abs(moveSteps);

    for (let i = 0; i < totalSteps; i++) {
      const nextX = tank.x + direction * stepSize;
      const groundY = this.findGroundY(nextX);

      if (groundY == null) break;

      tank.x = nextX;
      tank.y = groundY;
    }

    if (typeof this.render === "function") {
      this.render();
    }
  }

  findGroundY(x) {
    if (x < 0 || x >= this.canvas.width) return null;

    for (let y = 0; y < this.canvas.height; y++) {
      if (this.terrain.checkCollision(x, y)) {
        return y;
      }
    }

    return this.canvas.height - 1;
  }

  getTopAIWeapons(tank, target, count = 6) {
    const scored = AI_WEAPONS.map((WeaponClass) => ({
      WeaponClass,
      score: this.scoreWeaponForAI(WeaponClass, tank, target),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, count).map((entry) => entry.WeaponClass);
  }

  sampleAngles(count) {
    const min = 8;
    const max = 172;
    const step = (max - min) / Math.max(1, count - 1);
    const values = [];

    for (let i = 0; i < count; i++) {
      values.push(Math.round(min + i * step));
    }

    return values;
  }

  samplePowers(count) {
    const min = 20;
    const max = 100;
    const step = (max - min) / Math.max(1, count - 1);
    const values = [];

    for (let i = 0; i < count; i++) {
      values.push(Math.round(min + i * step));
    }

    return values;
  }

  simulateCandidateShot(tank, target, WeaponClass, angleDeg, power) {
    const v = power * 10;
    const g = 600;
    const wind = this.wind;
    const dt = 0.05;
    const maxTime = 6.0;

    let x = tank.x;
    let y = tank.y - tank.height;

    const rad = (angleDeg * Math.PI) / 180;
    let vx = Math.cos(rad) * v;
    let vy = -Math.sin(rad) * v;

    let closestEnemyDist = Infinity;
    let closestSelfDist = Infinity;
    let landingX = x;
    let landingY = y;
    let hitEnemy = false;
    let hitSelf = false;

    for (let t = 0; t < maxTime; t += dt) {
      x += vx * dt;
      y += vy * dt;
      vy += g * dt;
      vx += wind * 1.5 * dt;

      const enemyDist = Math.hypot(x - target.x, y - target.y);
      const selfDist = Math.hypot(x - tank.x, y - tank.y);

      if (enemyDist < closestEnemyDist) closestEnemyDist = enemyDist;
      if (selfDist < closestSelfDist) closestSelfDist = selfDist;

      if (
        x >= target.x - target.width / 2 &&
        x <= target.x + target.width / 2 &&
        y >= target.y - target.height &&
        y <= target.y
      ) {
        hitEnemy = true;
        landingX = x;
        landingY = y;
        break;
      }

      if (
        x >= tank.x - tank.width / 2 &&
        x <= tank.x + tank.width / 2 &&
        y >= tank.y - tank.height &&
        y <= tank.y
      ) {
        hitSelf = true;
        landingX = x;
        landingY = y;
        break;
      }

      if (
        y > this.canvas.height + 100 ||
        x < -100 ||
        x > this.canvas.width + 100
      ) {
        landingX = x;
        landingY = y;
        break;
      }

      if (this.terrain.checkCollision(x, y)) {
        landingX = x;
        landingY = y;
        break;
      }
    }

    const blastRadius = this.getAIWeaponBlastRadius(WeaponClass);

    return {
      hitEnemy,
      hitSelf,
      landingX,
      landingY,
      closestEnemyDist,
      closestSelfDist,
      estimatedEnemyDamage: this.estimateSplashDamage(
        target,
        landingX,
        landingY,
        blastRadius,
      ),
      estimatedSelfDamage: this.estimateSplashDamage(
        tank,
        landingX,
        landingY,
        blastRadius,
      ),
    };
  }

  scoreCandidateShot(
    tank,
    target,
    WeaponClass,
    angle,
    power,
    result,
    moveSteps = 0,
  ) {
    let score = 0;

    score += result.estimatedEnemyDamage * 5;
    score -= result.estimatedSelfDamage * 7;

    if (result.hitEnemy) score += 150;
    if (result.hitSelf) score -= 180;

    score += Math.max(0, 80 - result.closestEnemyDist * 0.18);
    score -= Math.max(0, 60 - result.closestSelfDist * 0.25);

    if (target.health <= 25) {
      score += result.estimatedEnemyDamage * 1.2;
    }

    if (WeaponClass === BabyNuke) score -= 10;
    if (WeaponClass === MegaNuke) score -= 18;

    score += this.scoreWeaponForAI(WeaponClass, tank, target) * 20;

    // movement penalty so it doesn't shuffle around constantly
    score -= Math.abs(moveSteps) * 6;

    // slight reward for getting into a better distance band
    const dist = Math.abs(tank.x - target.x);
    if (dist > 160 && dist < 420) score += 12;

    return score;
  }

  getAIWeaponBlastRadius(WeaponClass) {
    if (WeaponClass === MegaNuke) return 95;
    if (WeaponClass === BabyNuke) return 70;
    if (WeaponClass === HeavyShell) return 42;
    if (WeaponClass === Napalm) return 45;
    if (WeaponClass === PileDriver) return 38;
    if (WeaponClass === Roller) return 34;
    if (WeaponClass === Laser) return 18;
    if (WeaponClass === Sniper) return 16;
    return 28;
  }

  estimateSplashDamage(tank, x, y, radius) {
    const d = Math.hypot(x - tank.x, y - tank.y);
    if (d >= radius) return 0;
    const normalized = 1 - d / radius;
    return normalized * 100;
  }

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  scoreWeaponForAI(WeaponClass, tank, target) {
    const dist = Math.abs(tank.x - target.x);
    const myHealth = tank.health;
    const foeHealth = target.health;
    const turnsLeft = tank.turnsLeft;

    const isHard = this.aiDifficulty === "hard";
    const isMedium = this.aiDifficulty === "medium";
    const skillMult = isHard ? 1.0 : isMedium ? 0.7 : 0.4;

    const scores = new Map([
      [SingleShot, () => 0.4],
      [HeavyShell, () => (dist > 300 ? 0.5 : 0.3)],
      [Sniper, () => (dist > 400 ? 0.58 : 0.2)],
      [Laser, () => (dist > 350 ? 0.52 : 0.25)],
      [Boomerang, () => (dist > 250 ? 0.5 : 0.2)],
      [Bouncer, () => (dist < 300 ? 0.55 : 0.3)],
      [Roller, () => (dist < 200 ? 0.6 : 0.3)],

      [
        MegaNuke,
        () => {
          const killShot = foeHealth < 60 ? 0.4 : 0;
          const urgency = turnsLeft <= 3 ? 0.35 : 0;
          return 0.1 + killShot + urgency;
        },
      ],

      [
        BabyNuke,
        () => {
          const closeBonus = dist < 300 ? 0.3 : 0;
          const killBonus = foeHealth < 50 ? 0.25 : 0;
          return 0.18 + closeBonus + killBonus;
        },
      ],

      [Napalm, () => (dist < 260 ? 0.58 : 0.28)],
      [Spray, () => (dist < 220 ? 0.56 : 0.24)],
      [FunkyBomb, () => (dist < 260 ? 0.5 : 0.22)],
      [Splitter, () => (dist > 180 && dist < 420 ? 0.54 : 0.24)],
      [ClusterBomb, () => (dist > 180 && dist < 420 ? 0.52 : 0.24)],
      [HomingMissile, () => (dist > 250 ? 0.55 : 0.32)],
      [Jackhammer, () => (dist < 220 ? 0.5 : 0.2)],
      [PileDriver, () => (dist < 180 ? 0.62 : 0.18)],
      [Volcano, () => (dist < 260 ? 0.48 : 0.22)],
      [LightningStrike, () => (dist < 300 ? 0.45 : 0.28)],
      [MeteorShower, () => (foeHealth > 60 ? 0.5 : 0.25)],
      [ScatterShot, () => (dist < 240 ? 0.55 : 0.25)],
      [Earthquake, () => (myHealth < 35 ? 0.42 : 0.18)],
      [Firecracker, () => (dist < 230 ? 0.46 : 0.22)],
    ]);

    const scoreFn = scores.get(WeaponClass);
    const base = scoreFn ? scoreFn() : 0.3;
    const jitter = (Math.random() - 0.5) * (isHard ? 0.18 : 0.35);
    const repeatPenalty = WeaponClass === this.lastAIWeapon ? 0.3 : 0;

    return base * skillMult + jitter - repeatPenalty;
  }

  aiChooseWeapon(tank, target) {
    let bestWeapon = SingleShot;
    let bestScore = -Infinity;

    for (const WeaponClass of AI_WEAPONS) {
      const score = this.scoreWeaponForAI(WeaponClass, tank, target);

      if (score > bestScore) {
        bestScore = score;
        bestWeapon = WeaponClass;
      }
    }

    return bestWeapon;
  }

  aiComputeAngle(tank, target, power) {
    const g = 600;
    const speed = power * 10;
    const dt = 0.05;
    let bestAngle = tank.id === 1 ? 45 : 135;
    let bestDist = Infinity;

    for (let angle = 1; angle < 179; angle += 1) {
      let x = tank.x;
      let y = tank.y - tank.height;
      const rad = (angle * Math.PI) / 180;
      let vx = Math.cos(rad) * speed;
      let vy = -Math.sin(rad) * speed;

      for (let t = 0; t < 5; t += dt) {
        x += vx * dt;
        y += vy * dt;
        vy += g * dt;
        vx += this.wind * 1.5 * dt;

        const d = Math.hypot(x - target.x, y - target.y);
        if (d < bestDist) {
          bestDist = d;
          bestAngle = angle;
        }

        if (
          x < 0 ||
          x > this.canvas.width ||
          y > this.canvas.height ||
          this.terrain.checkCollision(x, y)
        ) {
          break;
        }
      }
    }

    return bestAngle;
  }

  startMove(direction) {
    if (this.state !== "AIMING") return;
    const tank = this.activeTank();
    if (tank.movesLeft <= 0) return;

    this.audio.playMove();

    const MOVE_STEP = 60; // pixels per move
    tank.movesLeft--;
    this.ui.movesLeftVal.innerText = tank.movesLeft;
    this.ui.moveLeftBtn.disabled = tank.movesLeft <= 0;
    this.ui.moveRightBtn.disabled = tank.movesLeft <= 0;

    this.moveDirection = direction;
    this.targetMoveX = Math.max(
      0,
      Math.min(this.canvas.width, tank.x + direction * MOVE_STEP),
    );

    this.state = "MOVING";
    this.ui.fireBtn.disabled = true;
    this.ui.fireBtn.style.opacity = 0.5;
  }

  fireWeapon() {
    this.state = "FIRING";
    this.ui.fireBtn.disabled = true;
    this.ui.fireBtn.style.opacity = 0.5;

    this.audio.playFire();

    const tank = this.activeTank();

    // Calculate barrel tip position
    const angleRad = (tank.targetAngle * Math.PI) / 180;
    const startX = tank.x + Math.cos(angleRad) * tank.turretLength;
    const startY =
      tank.y - tank.height - Math.sin(angleRad) * tank.turretLength;

    const weaponClass = tank.weaponClass;
    const weapon = new weaponClass();

    this.projectiles.push(
      ...weapon.fire(
        startX,
        startY,
        tank.targetAngle,
        tank.power,
        this.currentPlayer,
      ),
    );
  }

  createExplosion(x, y, radius, damage, ownerId, baseScore = 0) {
    this.terrain.destroyCircle(x, y, radius);

    // Scale explosion sound by radius (small ~20, medium ~50, large ~130)
    this.audio.playExplosion(Math.min(1, radius / 100));

    const shooter = ownerId === 1 ? this.p1 : this.p2;
    const tanks = [this.p1, this.p2];

    tanks.forEach((tank) => {
      const dist = Math.hypot(tank.x - x, tank.y - y);
      if (dist < radius + 15) {
        const proximityFactor = 1 - dist / (radius + 15);
        tank.health = Math.max(
          0,
          tank.health - Math.max(0, damage * proximityFactor),
        );

        if (tank !== shooter && baseScore > 0) {
          shooter.score += Math.max(1, Math.round(baseScore * proximityFactor));
        }
      }
    });

    this.updateHealthUI();
    this.updateScoreUI();

    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color: "#ef4444",
      });
    }
  }

  updateScoreUI() {
    document.getElementById("p1-score").innerText = `Score: ${this.p1.score}`;
    document.getElementById("p2-score").innerText = `Score: ${this.p2.score}`;
    document.getElementById("p1-turns").innerText =
      `Turns left: ${this.p1.turnsLeft}`;
    document.getElementById("p2-turns").innerText =
      `Turns left: ${this.p2.turnsLeft}`;
  }

  endGameByScore() {
    this.state = "GAME_OVER";
    document.getElementById("game-over-screen").classList.remove("hidden");
    const s1 = this.p1.score,
      s2 = this.p2.score;
    const p2Name = this.singlePlayer ? "CPU" : "Player 2";
    let msg;
    if (s1 > s2) {
      msg = `Player 1 Wins! (${s1} pts)`;
      this.audio.playVictory();
    } else if (s2 > s1) {
      msg = `${p2Name} Wins! (${s2} pts)`;
      this.singlePlayer ? this.audio.playDefeat() : this.audio.playVictory();
    } else if (this.p1.health > this.p2.health) {
      msg = `Player 1 Wins! (health tiebreaker)`;
      this.audio.playVictory();
    } else if (this.p2.health > this.p1.health) {
      msg = `${p2Name} Wins! (health tiebreaker)`;
      this.singlePlayer ? this.audio.playDefeat() : this.audio.playVictory();
    } else {
      msg = `It's a Draw!`;
      this.audio.playDefeat();
    }
    document.getElementById("winner-text").innerText = msg;
  }

  updateHealthUI() {
    document.getElementById("p1-health").style.width = `${this.p1.health}%`;
    document.getElementById("p2-health").style.width = `${this.p2.health}%`;

    if (this.p1.health <= 0 || this.p2.health <= 0) {
      this.state = "GAME_OVER";
      document.getElementById("game-over-screen").classList.remove("hidden");
      const p2Name = this.singlePlayer ? "CPU" : "Player 2";
      const winner = this.p1.health > 0 ? "Player 1" : p2Name;
      document.getElementById("winner-text").innerText = `${winner} Wins!`;
    }
  }

  loop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    if (!this.terrain) return;
    if (this.state === "GAME_OVER") return;

    if (this.state === "MOVING") {
      const tank = this.activeTank();
      const speed = 100; // pixels per second horizontally

      let reached = false;
      if (this.moveDirection === 1) {
        tank.x += speed * dt;
        if (tank.x >= this.targetMoveX) {
          tank.x = this.targetMoveX;
          reached = true;
        }
      } else {
        tank.x -= speed * dt;
        if (tank.x <= this.targetMoveX) {
          tank.x = this.targetMoveX;
          reached = true;
        }
      }

      // Magnetize to terrain
      tank.y = this.terrain.getSurfaceHeight(tank.x);

      if (reached) {
        this.state = "AIMING";
        this.ui.fireBtn.disabled = tank.turnsLeft <= 0;
        this.ui.fireBtn.style.opacity = tank.turnsLeft <= 0 ? 0.5 : 1;
        this.ui.moveLeftBtn.disabled = tank.movesLeft <= 0;
        this.ui.moveRightBtn.disabled = tank.movesLeft <= 0;
      }
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      // Projectile marked itself for removal (e.g. Splitter after spawning children)
      if (p.done) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Apply wind and gravity
      applyForces(p, this.wind, dt);

      p.update(dt, this);

      // Check collisions
      let hit = false;

      // Screen boundaries
      if (
        p.x < -100 ||
        p.x > this.canvas.width + 100 ||
        p.y > this.canvas.height
      ) {
        hit = true; // Off screen
      }
      // Tank collision checked before terrain so a projectile landing on
      // the tank body isn't swallowed by the terrain surface check first
      else {
        const tanks = [this.p1, this.p2];
        for (const t of tanks) {
          if (Math.abs(p.x - t.x) < 20 && p.y > t.y - 20 && p.y < t.y + 10) {
            hit = true;
            p.onHit(this);
            break;
          }
        }
      }
      // Terrain collision (only if no tank was hit)
      if (!hit && this.terrain.checkCollision(p.x, p.y)) {
        if (p.onTerrainHit(this)) hit = true;
      }

      if (hit) {
        this.projectiles.splice(i, 1);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      if (typeof part.update === "function") {
        part.update(dt);
        if (part.dead) this.particles.splice(i, 1);
      } else {
        part.x += part.vx;
        part.y += part.vy;
        part.life -= dt * 2;
        if (part.life <= 0) this.particles.splice(i, 1);
      }
    }

    // Check if turn ended
    if (this.state === "FIRING" && this.projectiles.length === 0) {
      this.state = "WAITING_TURN";

      const firingTank = this.activeTank();
      firingTank.turnsLeft--;
      this.updateScoreUI();

      setTimeout(() => {
        if (this.state !== "GAME_OVER") {
          const nextPlayer = this.currentPlayer === 1 ? 2 : 1;
          const nextTank = nextPlayer === 1 ? this.p1 : this.p2;

          if (firingTank.turnsLeft <= 0 && nextTank.turnsLeft <= 0) {
            this.endGameByScore();
          } else {
            this.generateWind();
            // Skip opponent if they've used all their turns
            const turnPlayer =
              nextTank.turnsLeft > 0 ? nextPlayer : this.currentPlayer;
            this.changeTurn(turnPlayer);
          }
        }
      }, 1000);
    }
  }

  draw() {
    if (!this.terrain) return;
    // Clear main canvas (the background is handled by CSS on the container)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw terrain
    this.terrain.draw(this.ctx);

    // Draw tanks
    this.p1.draw(this.ctx);
    this.p2.draw(this.ctx);

    // Draw projectiles
    for (const p of this.projectiles) {
      p.draw(this.ctx);
    }

    // Draw particles
    for (const part of this.particles) {
      if (typeof part.draw === "function") {
        part.draw(this.ctx);
      } else {
        this.ctx.globalAlpha = part.life;
        this.ctx.fillStyle = part.color;
        this.ctx.beginPath();
        this.ctx.arc(part.x, part.y, 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;
      }
    }
  }
}
