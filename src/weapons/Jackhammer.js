import { Projectile } from "../Projectile.js";
import { Weapon } from "./Weapon.js";

class JackhammerProjectile extends Projectile {
	constructor(x, y, vx, vy, ownerId, baseScore) {
		super(x, y, vx, vy, ownerId, "#fbbf24", 45, 35, baseScore);
		this.bounces = 0;
		this.maxBounces = 5;
	}

	draw(ctx) {
		if (this.trail.length > 1) {
			ctx.beginPath();
			ctx.moveTo(this.trail[0].x, this.trail[0].y);
			for (let i = 1; i < this.trail.length; i++) {
				ctx.lineTo(this.trail[i].x, this.trail[i].y);
			}
			ctx.strokeStyle = "rgba(251, 191, 36, 0.6)";
			ctx.lineWidth = 2;
			ctx.stroke();
		}
		ctx.fillStyle = this.color;
		ctx.shadowBlur = 14;
		ctx.shadowColor = this.color;
		ctx.beginPath();
		ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
		ctx.fill();
		ctx.shadowBlur = 0;

		// Remaining bounces badge
		ctx.fillStyle = "white";
		ctx.font = "bold 9px sans-serif";
		ctx.textAlign = "center";
		ctx.fillText(this.maxBounces - this.bounces, this.x, this.y - 10);
	}

	onTerrainHit(engine) {
		engine.createExplosion(this.x, this.y, 20, 10, this.ownerId, 0);
		if (this.bounces < this.maxBounces) {
			this.vx = 0;
			this.vy = -600;
			this.y -= 5;
			this.bounces++;
			return false;
		}
		engine.createExplosion(
			this.x,
			this.y,
			45,
			35,
			this.ownerId,
			this.baseScore,
		);
		return true;
	}

	onHit(engine) {
		engine.createExplosion(
			this.x,
			this.y,
			45,
			35,
			this.ownerId,
			this.baseScore,
		);
	}
}

export class Jackhammer extends Weapon {
	constructor() {
		super();
		this.name = "Jackhammer";
		this.description =
			"Bounces straight up 5 times, each landing causes a small explosion. Big final blast.";
		this.color = "#fbbf24";
		this.baseScore = 75;
	}

	fire(x, y, angle, power, ownerId) {
		const magnitude = power * 10;
		const rad = (angle * Math.PI) / 180;
		const vx = Math.cos(rad) * magnitude;
		const vy = -Math.sin(rad) * magnitude;
		return [new JackhammerProjectile(x, y, vx, vy, ownerId, this.baseScore)];
	}
}
