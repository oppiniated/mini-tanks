import { Projectile } from "../Projectile.js";
import { Weapon } from "./Weapon.js";

class HomingProjectile extends Projectile {
	constructor(x, y, vx, vy, ownerId, baseScore) {
		super(x, y, vx, vy, ownerId, "#e879f9", 60, 45, baseScore);
		this.maxTurnRate = 250; // px/s² steering force
	}

	update(dt, engine) {
		if (engine) {
			const target = this.ownerId === 1 ? engine.p2 : engine.p1;
			const dx = target.x - this.x;
			// Steer toward target with a limited turn rate
			const direction = dx > 0 ? 1 : -1;
			this.vx += direction * this.maxTurnRate * dt;
			// Cap horizontal speed so it doesn't spin out
			const maxVx = 800;
			this.vx = Math.max(-maxVx, Math.min(maxVx, this.vx));
		}
		super.update(dt, engine);
	}

	draw(ctx) {
		if (this.trail.length > 1) {
			ctx.beginPath();
			ctx.moveTo(this.trail[0].x, this.trail[0].y);
			for (let i = 1; i < this.trail.length; i++) {
				ctx.lineTo(this.trail[i].x, this.trail[i].y);
			}
			ctx.strokeStyle = "rgba(232, 121, 249, 0.7)";
			ctx.lineWidth = 3;
			ctx.stroke();
		}
		// Nose points in travel direction
		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.rotate(Math.atan2(this.vy, this.vx));
		ctx.fillStyle = this.color;
		ctx.shadowBlur = 20;
		ctx.shadowColor = this.color;
		// Missile body
		ctx.beginPath();
		ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
		ctx.fill();
		// Nose cone
		ctx.beginPath();
		ctx.moveTo(8, 0);
		ctx.lineTo(14, 0);
		ctx.lineTo(8, 3);
		ctx.closePath();
		ctx.fill();
		ctx.shadowBlur = 0;
		ctx.restore();
	}
}

export class HomingMissile extends Weapon {
	constructor() {
		super();
		this.name = "Homing Missile";
		this.description = "Steers toward the enemy after launch. Hard to dodge.";
		this.color = "#e879f9";
		this.baseScore = 180;
	}

	fire(x, y, angle, power, ownerId) {
		const magnitude = power * 10;
		const rad = (angle * Math.PI) / 180;
		const vx = Math.cos(rad) * magnitude;
		const vy = -Math.sin(rad) * magnitude;
		return [new HomingProjectile(x, y, vx, vy, ownerId, this.baseScore)];
	}
}
