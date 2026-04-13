import { Projectile } from "../Projectile.js";
import { Weapon } from "./Weapon.js";

class DirtMoverProjectile extends Projectile {
	constructor(x, y, vx, vy, ownerId, color) {
		super(x, y, vx, vy, ownerId, color, 50, 0); // Large radius, 0 damage
	}

	onHit(engine) {
		// Add terrain instead of destroying it
		engine.terrain.addCircle(this.x, this.y, this.explosionRadius);

		// Add visual particles
		for (let i = 0; i < 15; i++) {
			engine.particles.push({
				x: this.x,
				y: this.y,
				vx: (Math.random() - 0.5) * 5,
				vy: (Math.random() - 0.5) * 5 - 2,
				life: 1.0,
				color: "#854d0e",
			});
		}
	}
}

export class DirtMover extends Weapon {
	constructor() {
		super();
		this.name = "Dirt Mover";
		this.description =
			"Adds a large mound of dirt upon impact instead of doing damage.";
		this.color = "#854d0e";
	}

	fire(x, y, angle, power, ownerId) {
		const magnitude = power * 10;
		const rad = (angle * Math.PI) / 180;
		const vx = Math.cos(rad) * magnitude;
		const vy = -Math.sin(rad) * magnitude;

		const p = new DirtMoverProjectile(x, y, vx, vy, ownerId, this.color);
		return [p];
	}
}
