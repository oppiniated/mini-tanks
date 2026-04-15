import { Projectile } from "../Projectile.js";
import { Weapon } from "./Weapon.js";

class BouncerProjectile extends Projectile {
	constructor(x, y, vx, vy, ownerId, baseScore) {
		super(x, y, vx, vy, ownerId, "#4ade80", 55, 30, baseScore);
		this.bounces = 0;
		this.maxBounces = 3;
	}

	draw(ctx) {
		if (this.trail.length > 1) {
			ctx.beginPath();
			ctx.moveTo(this.trail[0].x, this.trail[0].y);
			for (let i = 1; i < this.trail.length; i++) {
				ctx.lineTo(this.trail[i].x, this.trail[i].y);
			}
			ctx.strokeStyle = "rgba(74, 222, 128, 0.6)";
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

		// Bounce counter badge
		ctx.fillStyle = "white";
		ctx.font = "bold 9px sans-serif";
		ctx.textAlign = "center";
		ctx.fillText(this.maxBounces - this.bounces, this.x, this.y - 8);
	}

	onTerrainHit(engine) {
		if (this.bounces < this.maxBounces) {
			// Reflect and dampen; nudge away from terrain so we don't retrigger
			this.vy = -Math.abs(this.vy) * 0.75;
			this.vx *= 0.9;
			this.y -= 4;
			this.bounces++;
			engine.audio.playBounce();
			return false; // keep alive
		}
		// Final hit — explode
		this.onHit(engine);
		return true;
	}
}

export class Bouncer extends Weapon {
	constructor() {
		super();
		this.name = "Bouncer";
		this.description =
			"Bounces off terrain up to 3 times, then detonates. Number shown = bounces left.";
		this.color = "#4ade80";
		this.baseScore = 110;
	}

	fire(x, y, angle, power, ownerId) {
		const magnitude = power * 10;
		const rad = (angle * Math.PI) / 180;
		const vx = Math.cos(rad) * magnitude;
		const vy = -Math.sin(rad) * magnitude;
		return [new BouncerProjectile(x, y, vx, vy, ownerId, this.baseScore)];
	}
}
