import { Projectile } from "../Projectile.js";
import { Weapon } from "./Weapon.js";

class DirtBallProjectile extends Projectile {
	constructor(x, y, vx, vy, ownerId, color) {
		super(x, y, vx, vy, ownerId, color, 35, 0, 0);
	}

	onHit(engine) {
		engine.terrain.addCircle(this.x, this.y, this.explosionRadius);
		for (let i = 0; i < 10; i++) {
			engine.particles.push({
				x: this.x,
				y: this.y,
				vx: (Math.random() - 0.5) * 5,
				vy: (Math.random() - 0.5) * 5 - 2,
				life: 0.8,
				color: "#a16207",
			});
		}
	}
}

export class DirtBall extends Weapon {
	constructor() {
		super();
		this.name = "Dirt Ball";
		this.description = "Creates a small mound of dirt. Good for quick cover.";
		this.color = "#92400e";
		this.baseScore = 0;
	}

	fire(x, y, angle, power, ownerId) {
		const magnitude = power * 10;
		const rad = (angle * Math.PI) / 180;
		const vx = Math.cos(rad) * magnitude;
		const vy = -Math.sin(rad) * magnitude;
		return [new DirtBallProjectile(x, y, vx, vy, ownerId, this.color)];
	}
}
