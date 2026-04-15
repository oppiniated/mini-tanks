import { Projectile } from "../Projectile.js";
import { Weapon } from "./Weapon.js";

class PileDriverProjectile extends Projectile {
	constructor(x, y, vx, vy, ownerId, baseScore) {
		super(x, y, vx, vy, ownerId, "#78716c", 18, 30, baseScore);
	}

	onHit(engine) {
		// Dig a narrow shaft downward
		for (let i = 0; i < 10; i++) {
			engine.terrain.destroyCircle(this.x, this.y + i * 16, 18);
		}

		// Damage tanks caught in the shaft
		for (const tank of [engine.p1, engine.p2]) {
			if (tank.ownerId === this.ownerId) continue;
			const dx = Math.abs(tank.x - this.x);
			const dy = tank.y - this.y;
			if (dx <= 30 && dy >= 0 && dy <= 180) {
				tank.health = Math.max(0, tank.health - 30);
				if (this.ownerId !== tank.ownerId) {
					const scorer =
						engine.p1.ownerId === this.ownerId ? engine.p1 : engine.p2;
					scorer.score = (scorer.score || 0) + this.baseScore;
				}
			}
		}

		// Dirt particles
		for (let i = 0; i < 20; i++) {
			engine.particles.push({
				x: this.x + (Math.random() - 0.5) * 40,
				y: this.y + Math.random() * 80,
				vx: (Math.random() - 0.5) * 60,
				vy: (Math.random() - 0.5) * 40,
				life: 0.5 + Math.random() * 0.3,
				color: "#a8a29e",
			});
		}

		engine.updateHealthUI();
		engine.updateScoreUI();
	}
}

export class PileDriver extends Weapon {
	constructor() {
		super();
		this.name = "Pile Driver";
		this.description =
			"Drives a narrow shaft deep into the ground on impact. Great for burying tanks.";
		this.color = "#78716c";
		this.baseScore = 95;
	}

	fire(x, y, angle, power, ownerId) {
		const magnitude = power * 10;
		const rad = (angle * Math.PI) / 180;
		const vx = Math.cos(rad) * magnitude;
		const vy = -Math.sin(rad) * magnitude;
		return [new PileDriverProjectile(x, y, vx, vy, ownerId, this.baseScore)];
	}
}
