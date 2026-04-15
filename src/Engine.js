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
import { Volcano } from "./weapons/Volcano.js";

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

		this.setupUI();
	}

	init() {
		this.resize();
		this.reset();
		requestAnimationFrame((t) => this.loop(t));
	}

	reset() {
		this.projectiles = [];
		this.particles = [];

		this.terrain = new Terrain(this.canvas.width, this.canvas.height);
		this.terrain.generate();

		const p1X = this.canvas.width * 0.2;
		this.p1 = new Tank(1, p1X, this.terrain.getSurfaceHeight(p1X), "#3b82f6");
		this.p1.targetAngle = 45;
		this.p1.weaponClass = SingleShot;

		const p2X = this.canvas.width * 0.8;
		this.p2 = new Tank(2, p2X, this.terrain.getSurfaceHeight(p2X), "#10b981");
		this.p2.targetAngle = 135;
		this.p2.weaponClass = SingleShot;

		this.changeTurn(1);
		this.generateWind();
		this.state = "AIMING";
		this.updateScoreUI();
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
		};

		this.ui.moveLeftBtn.addEventListener("click", () => this.startMove(-1));
		this.ui.moveRightBtn.addEventListener("click", () => this.startMove(1));

		document.getElementById("restart-btn").addEventListener("click", () => {
			document.getElementById("game-over-screen").classList.add("hidden");
			this.reset();
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
			if (this.state !== "AIMING") return;
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

		this.ui.turnIndicator.innerText = `Player ${player}'s Turn`;
		this.ui.turnIndicator.style.color = player === 1 ? "#3b82f6" : "#10b981";

		const w = new tank.weaponClass();
		this.ui.weaponSelectBtn.innerText = `Weapon: ${w.name}`;

		tank.movesLeft = 4;
		this.ui.movesLeftVal.innerText = tank.movesLeft;
		this.ui.moveLeftBtn.disabled = false;
		this.ui.moveRightBtn.disabled = false;

		this.state = "AIMING";
		this.ui.fireBtn.disabled = tank.turnsLeft <= 0;
		this.ui.fireBtn.style.opacity = tank.turnsLeft <= 0 ? 0.5 : 1;
	}

	startMove(direction) {
		if (this.state !== "AIMING") return;
		const tank = this.activeTank();
		if (tank.movesLeft <= 0) return;

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
		let msg;
		if (s1 > s2) {
			msg = `Player 1 Wins! (${s1} pts)`;
		} else if (s2 > s1) {
			msg = `Player 2 Wins! (${s2} pts)`;
		} else if (this.p1.health > this.p2.health) {
			msg = `Player 1 Wins! (health tiebreaker)`;
		} else if (this.p2.health > this.p1.health) {
			msg = `Player 2 Wins! (health tiebreaker)`;
		} else {
			msg = `It's a Draw!`;
		}
		document.getElementById("winner-text").innerText = msg;
	}

	updateHealthUI() {
		document.getElementById("p1-health").style.width = `${this.p1.health}%`;
		document.getElementById("p2-health").style.width = `${this.p2.health}%`;

		if (this.p1.health <= 0 || this.p2.health <= 0) {
			this.state = "GAME_OVER";
			document.getElementById("game-over-screen").classList.remove("hidden");
			const winner = this.p1.health > 0 ? 1 : 2;
			document.getElementById("winner-text").innerText =
				`Player ${winner} Wins!`;
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
			part.x += part.vx;
			part.y += part.vy;
			part.life -= dt * 2;
			if (part.life <= 0) this.particles.splice(i, 1);
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
			this.ctx.globalAlpha = part.life;
			this.ctx.fillStyle = part.color;
			this.ctx.beginPath();
			this.ctx.arc(part.x, part.y, 2, 0, Math.PI * 2);
			this.ctx.fill();
			this.ctx.globalAlpha = 1.0;
		}
	}
}
