import { Projectile } from "../Projectile.js";
import { Weapon } from "./Weapon.js";

class BoltProjectile extends Projectile {
	constructor(x, y, vx, vy, ownerId, baseScore) {
		super(x, y, vx, vy, ownerId, "#facc15", 18, 12, baseScore);
	}

	update(dt, engine) {
		super.update(dt, engine);
		if (this.trail.length > 8) {
			this.trail.shift();
		}
	}

	draw(ctx) {
		if (this.trail.length > 1) {
			ctx.beginPath();
			ctx.moveTo(this.trail[0].x, this.trail[0].y);
			for (let i = 1; i < this.trail.length; i++) {
				ctx.lineTo(this.trail[i].x, this.trail[i].y);
			}
			ctx.strokeStyle = "rgba(250, 204, 21, 0.5)";
			ctx.lineWidth = 1.5;
			ctx.stroke();
		}

		// Diamond/star shape
		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.fillStyle = this.color;
		ctx.shadowBlur = 10;
		ctx.shadowColor = this.color;
		ctx.beginPath();
		ctx.moveTo(0, -5);
		ctx.lineTo(3, 0);
		ctx.lineTo(0, 5);
		ctx.lineTo(-3, 0);
		ctx.closePath();
		ctx.fill();
		ctx.shadowBlur = 0;
		ctx.restore();
	}
}

class LightningProjectile extends Projectile {
	constructor(x, y, vx, vy, ownerId, baseScore) {
		super(x, y, vx, vy, ownerId, "#facc15", 25, 15, baseScore);
	}

	onHit(engine) {
		engine.createExplosion(
			this.x,
			this.y,
			25,
			15,
			this.ownerId,
			this.baseScore,
		);

		// 8 bolts at 45° increments
		for (let i = 0; i < 8; i++) {
			const angle = i * 45;
			const rad = (angle * Math.PI) / 180;
			const vx = Math.cos(rad) * 700;
			const vy = -Math.sin(rad) * 700;
			engine.projectiles.push(
				new BoltProjectile(
					this.x,
					this.y,
					vx,
					vy,
					this.ownerId,
					this.baseScore,
				),
			);
		}
	}
}

export class LightningStrike extends Weapon {
	constructor() {
		super();
		this.name = "Lightning Strike";
		this.description =
			"Detonates in a starburst of 8 fast lightning bolts radiating in all directions.";
		this.color = "#facc15";
		this.baseScore = 55;
	}

	fire(x, y, angle, power, ownerId) {
		const magnitude = power * 10;
		const rad = (angle * Math.PI) / 180;
		const vx = Math.cos(rad) * magnitude;
		const vy = -Math.sin(rad) * magnitude;
		return [new LightningProjectile(x, y, vx, vy, ownerId, this.baseScore)];
	}
}
