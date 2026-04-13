import { Projectile } from "../Projectile.js";
import { Weapon } from "./Weapon.js";

class NapalmProjectile extends Projectile {
	constructor(x, y, vx, vy, ownerId, baseScore) {
		super(x, y, vx, vy, ownerId, "#f97316", 20, 10, baseScore);
	}

	onHit(engine) {
		engine.createExplosion(
			this.x,
			this.y,
			this.explosionRadius,
			this.damage,
			this.ownerId,
			this.baseScore,
		);
		// Extra fire particles on top of the standard red ones
		for (let i = 0; i < 10; i++) {
			engine.particles.push({
				x: this.x + (Math.random() - 0.5) * 15,
				y: this.y + (Math.random() - 0.5) * 15,
				vx: (Math.random() - 0.5) * 7,
				vy: -(Math.random() * 5 + 1),
				life: 1.5,
				color: Math.random() > 0.5 ? "#f97316" : "#fbbf24",
			});
		}
	}
}

export class Napalm extends Weapon {
	constructor() {
		super();
		this.name = "Napalm";
		this.description =
			"Fires 7 burning shells in a tight spread. Scorches a wide area.";
		this.color = "#f97316";
		this.baseScore = 50;
	}

	fire(x, y, angle, power, ownerId) {
		const magnitude = power * 10;
		const projectiles = [];
		for (let i = -3; i <= 3; i++) {
			const rad = ((angle + i * 3) * Math.PI) / 180; // ±9° spread
			projectiles.push(
				new NapalmProjectile(
					x,
					y,
					Math.cos(rad) * magnitude,
					-Math.sin(rad) * magnitude,
					ownerId,
					this.baseScore,
				),
			);
		}
		return projectiles;
	}
}
