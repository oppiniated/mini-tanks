import { Projectile } from "../Projectile.js";
import { Weapon } from "./Weapon.js";

class NukeProjectile extends Projectile {
	draw(ctx) {
		// Larger, glowing visual
		if (this.trail.length > 1) {
			ctx.beginPath();
			ctx.moveTo(this.trail[0].x, this.trail[0].y);
			for (let i = 1; i < this.trail.length; i++) {
				ctx.lineTo(this.trail[i].x, this.trail[i].y);
			}
			ctx.strokeStyle = "rgba(168, 85, 247, 0.6)";
			ctx.lineWidth = 4;
			ctx.stroke();
		}
		ctx.fillStyle = this.color;
		ctx.shadowBlur = 25;
		ctx.shadowColor = this.color;
		ctx.beginPath();
		ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
		ctx.fill();
		ctx.shadowBlur = 0;
	}
}

export class BabyNuke extends Weapon {
	constructor() {
		super();
		this.name = "Baby Nuke";
		this.description =
			"Causes a colossal explosion. Clears massive areas of terrain.";
		this.color = "#a855f7";
		this.baseScore = 200;
	}

	fire(x, y, angle, power, ownerId) {
		const magnitude = power * 10;
		const rad = (angle * Math.PI) / 180;
		const vx = Math.cos(rad) * magnitude;
		const vy = -Math.sin(rad) * magnitude;
		return [
			new NukeProjectile(
				x,
				y,
				vx,
				vy,
				ownerId,
				this.color,
				130,
				35,
				this.baseScore,
			),
		];
	}
}
