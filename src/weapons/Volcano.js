import { Projectile } from "../Projectile.js";
import { Weapon } from "./Weapon.js";

class VolcanoProjectile extends Projectile {
	constructor(x, y, vx, vy, ownerId, baseScore) {
		super(x, y, vx, vy, ownerId, "#dc2626", 40, 20, baseScore);
	}

	onHit(engine) {
		engine.createExplosion(
			this.x,
			this.y,
			40,
			20,
			this.ownerId,
			this.baseScore,
		);

		// Spawn 12 lava chunks in a wide upper arc (30° to 150°)
		for (let i = 0; i < 12; i++) {
			const angle = 30 + (120 / 11) * i;
			const rad = (angle * Math.PI) / 180;
			const speed = 300 + Math.random() * 300;
			const vx = Math.cos(rad) * speed;
			const vy = -Math.sin(rad) * speed;
			engine.projectiles.push(
				new Projectile(
					this.x,
					this.y,
					vx,
					vy,
					this.ownerId,
					"#ef4444",
					22,
					15,
					this.baseScore,
				),
			);
		}

		// Fire particles
		for (let i = 0; i < 25; i++) {
			engine.particles.push({
				x: this.x,
				y: this.y,
				vx: (Math.random() - 0.5) * 400,
				vy: -(50 + Math.random() * 250),
				life: 0.5 + Math.random() * 0.6,
				color: i % 2 === 0 ? "#f97316" : "#fbbf24",
			});
		}
	}
}

export class Volcano extends Weapon {
	constructor() {
		super();
		this.name = "Volcano";
		this.description =
			"Erupts on impact, hurling 12 burning lava chunks in a wide arc.";
		this.color = "#dc2626";
		this.baseScore = 55;
	}

	fire(x, y, angle, power, ownerId) {
		const magnitude = power * 10;
		const rad = (angle * Math.PI) / 180;
		const vx = Math.cos(rad) * magnitude;
		const vy = -Math.sin(rad) * magnitude;
		return [new VolcanoProjectile(x, y, vx, vy, ownerId, this.baseScore)];
	}
}
