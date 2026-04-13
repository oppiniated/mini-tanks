import { Projectile } from "../Projectile.js";
import { Weapon } from "./Weapon.js";

class SplitterProjectile extends Projectile {
	constructor(x, y, vx, vy, ownerId, baseScore) {
		super(x, y, vx, vy, ownerId, "#818cf8", 35, 20, baseScore);
		this.prevVy = vy;
		this.hasSplit = false;
	}

	draw(ctx) {
		if (this.trail.length > 1) {
			ctx.beginPath();
			ctx.moveTo(this.trail[0].x, this.trail[0].y);
			for (let i = 1; i < this.trail.length; i++) {
				ctx.lineTo(this.trail[i].x, this.trail[i].y);
			}
			ctx.strokeStyle = "rgba(129, 140, 248, 0.6)";
			ctx.lineWidth = 2;
			ctx.stroke();
		}
		ctx.fillStyle = this.color;
		ctx.shadowBlur = 12;
		ctx.shadowColor = this.color;
		ctx.beginPath();
		ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
		ctx.fill();
		ctx.shadowBlur = 0;
	}

	update(dt, engine) {
		// Detect apex: vy just crossed from negative (rising) to positive (falling)
		if (!this.hasSplit && this.prevVy < 0 && this.vy >= 0) {
			this.hasSplit = true;

			const speed = Math.hypot(this.vx, this.vy);
			const baseAngle = Math.atan2(-this.vy, this.vx); // up-is-positive convention
			const offsets = [-25, 0, 25]; // degrees

			for (const deg of offsets) {
				const rad = baseAngle + (deg * Math.PI) / 180;
				const childVx = Math.cos(rad) * speed * 0.9;
				const childVy = -Math.sin(rad) * speed * 0.9;
				engine.projectiles.push(
					new Projectile(
						this.x,
						this.y,
						childVx,
						childVy,
						this.ownerId,
						"#c7d2fe",
						35,
						20,
						this.baseScore,
					),
				);
			}
			// Flash particles at split point
			for (let i = 0; i < 12; i++) {
				engine.particles.push({
					x: this.x,
					y: this.y,
					vx: (Math.random() - 0.5) * 12,
					vy: (Math.random() - 0.5) * 12,
					life: 0.6,
					color: this.color,
				});
			}
			this.done = true; // Engine will remove on next tick
		}
		this.prevVy = this.vy;
		super.update(dt, engine);
	}
}

export class Splitter extends Weapon {
	constructor() {
		super();
		this.name = "Splitter";
		this.description =
			"Splits into 3 shells at the apex of its arc. Covers a wide landing zone.";
		this.color = "#818cf8";
		this.baseScore = 60;
	}

	fire(x, y, angle, power, ownerId) {
		const magnitude = power * 10;
		const rad = (angle * Math.PI) / 180;
		const vx = Math.cos(rad) * magnitude;
		const vy = -Math.sin(rad) * magnitude;
		return [new SplitterProjectile(x, y, vx, vy, ownerId, this.baseScore)];
	}
}
