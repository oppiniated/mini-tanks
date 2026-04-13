import { Projectile } from "../Projectile.js";
import { Weapon } from "./Weapon.js";

class LaserProjectile extends Projectile {
	constructor(x, y, vx, vy, ownerId, baseScore) {
		super(x, y, vx, vy, ownerId, "#22d3ee", 12, 70, baseScore);
		this.origin = { x, y };
		// Store the direction unit vector for constant-trajectory movement
		const speed = Math.hypot(vx, vy);
		this.dirX = vx / speed;
		this.dirY = vy / speed;
		this.speed = speed;
	}

	update(dt, engine) {
		// Override gravity — maintain exact launch direction
		this.vx = this.dirX * this.speed;
		this.vy = this.dirY * this.speed;
		super.update(dt, engine);
	}

	draw(ctx) {
		// Draw a glowing beam from origin to current position
		const gradient = ctx.createLinearGradient(
			this.origin.x,
			this.origin.y,
			this.x,
			this.y,
		);
		gradient.addColorStop(0, "rgba(34, 211, 238, 0)");
		gradient.addColorStop(0.6, "rgba(34, 211, 238, 0.4)");
		gradient.addColorStop(1, "rgba(34, 211, 238, 1)");

		ctx.beginPath();
		ctx.moveTo(this.origin.x, this.origin.y);
		ctx.lineTo(this.x, this.y);
		ctx.strokeStyle = gradient;
		ctx.lineWidth = 3;
		ctx.shadowBlur = 20;
		ctx.shadowColor = this.color;
		ctx.stroke();
		ctx.shadowBlur = 0;

		// Tip dot
		ctx.fillStyle = "#ffffff";
		ctx.beginPath();
		ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
		ctx.fill();
	}

	onHit(engine) {
		// Precise impact — small but damaging
		engine.createExplosion(
			this.x,
			this.y,
			this.explosionRadius,
			this.damage,
			this.ownerId,
			this.baseScore,
		);
		for (let i = 0; i < 15; i++) {
			engine.particles.push({
				x: this.x,
				y: this.y,
				vx: (Math.random() - 0.5) * 20,
				vy: (Math.random() - 0.5) * 20,
				life: 0.8,
				color: this.color,
			});
		}
	}
}

export class Laser extends Weapon {
	constructor() {
		super();
		this.name = "Laser";
		this.description =
			"Travels in a perfectly straight line at extreme speed. Pinpoint accuracy, no gravity.";
		this.color = "#22d3ee";
		this.baseScore = 100;
	}

	fire(x, y, angle, power, ownerId) {
		const magnitude = power * 60; // very fast — ~6000 px/s at max power
		const rad = (angle * Math.PI) / 180;
		const vx = Math.cos(rad) * magnitude;
		const vy = -Math.sin(rad) * magnitude;
		return [new LaserProjectile(x, y, vx, vy, ownerId, this.baseScore)];
	}
}
