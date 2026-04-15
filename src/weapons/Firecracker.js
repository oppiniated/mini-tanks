import { Projectile } from "../Projectile.js";
import { Weapon } from "./Weapon.js";

class FirecrackerProjectile extends Projectile {
	constructor(x, y, vx, vy, ownerId, baseScore) {
		super(x, y, vx, vy, ownerId, "#f97316", 22, 12, baseScore);
	}

	onHit(engine) {
		for (let i = -4; i <= 4; i++) {
			engine.createExplosion(
				this.x + i * 50,
				this.y,
				22,
				12,
				this.ownerId,
				this.baseScore,
			);
		}
		for (let i = 0; i < 30; i++) {
			engine.particles.push({
				x: this.x + (Math.random() - 0.5) * 400,
				y: this.y + (Math.random() - 0.5) * 60,
				vx: (Math.random() - 0.5) * 120,
				vy: (Math.random() - 0.5) * 80,
				life: 0.6 + Math.random() * 0.4,
				color: "#f97316",
			});
		}
	}
}

export class Firecracker extends Weapon {
	constructor() {
		super();
		this.name = "Firecracker";
		this.description =
			"Explodes in a chain of 9 blasts spreading horizontally from the impact point.";
		this.color = "#f97316";
		this.baseScore = 45;
	}

	fire(x, y, angle, power, ownerId) {
		const magnitude = power * 10;
		const rad = (angle * Math.PI) / 180;
		const vx = Math.cos(rad) * magnitude;
		const vy = -Math.sin(rad) * magnitude;
		return [new FirecrackerProjectile(x, y, vx, vy, ownerId, this.baseScore)];
	}
}
