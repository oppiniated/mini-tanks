import { Projectile } from "../Projectile.js";
import { Weapon } from "./Weapon.js";

class BoomerangProjectile extends Projectile {
	constructor(x, y, vx, vy, ownerId, baseScore) {
		super(x, y, vx, vy, ownerId, "#fb923c", 45, 30, baseScore);
		this.flipped = false;
		this.prevVy = vy; // track sign change to detect apex
	}

	update(dt, engine) {
		// Detect apex: vy just crossed from negative (going up) to positive (falling)
		if (!this.flipped && this.prevVy < 0 && this.vy >= 0) {
			this.vx *= -1;
			this.flipped = true;
		}
		this.prevVy = this.vy;
		super.update(dt, engine);
	}

	draw(ctx) {
		if (this.trail.length > 1) {
			ctx.beginPath();
			ctx.moveTo(this.trail[0].x, this.trail[0].y);
			for (let i = 1; i < this.trail.length; i++) {
				ctx.lineTo(this.trail[i].x, this.trail[i].y);
			}
			ctx.strokeStyle = "rgba(251, 146, 60, 0.6)";
			ctx.lineWidth = 2;
			ctx.stroke();
		}
		// Rotate crescent shape to suggest travel direction
		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.rotate(Math.atan2(this.vy, this.vx));
		ctx.fillStyle = this.color;
		ctx.shadowBlur = 12;
		ctx.shadowColor = this.color;
		ctx.beginPath();
		ctx.arc(0, 0, 6, 0.3, Math.PI * 2 - 0.3);
		ctx.fill();
		ctx.shadowBlur = 0;
		ctx.restore();
	}
}

export class Boomerang extends Weapon {
	constructor() {
		super();
		this.name = "Boomerang";
		this.description =
			"Arcs back toward the shooter at its apex. Can hit from behind.";
		this.color = "#fb923c";
		this.baseScore = 120;
	}

	fire(x, y, angle, power, ownerId) {
		const magnitude = power * 10;
		const rad = (angle * Math.PI) / 180;
		const vx = Math.cos(rad) * magnitude;
		const vy = -Math.sin(rad) * magnitude;
		return [new BoomerangProjectile(x, y, vx, vy, ownerId, this.baseScore)];
	}
}
