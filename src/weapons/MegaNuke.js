import { Projectile } from "../Projectile.js";
import { Weapon } from "./Weapon.js";

class MegaNukeProjectile extends Projectile {
	draw(ctx) {
		if (this.trail.length > 1) {
			ctx.beginPath();
			ctx.moveTo(this.trail[0].x, this.trail[0].y);
			for (let i = 1; i < this.trail.length; i++) {
				ctx.lineTo(this.trail[i].x, this.trail[i].y);
			}
			ctx.strokeStyle = "rgba(250, 204, 21, 0.7)";
			ctx.lineWidth = 5;
			ctx.stroke();
		}
		ctx.shadowBlur = 40;
		ctx.shadowColor = "#fbbf24";
		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
		ctx.fill();
		ctx.shadowBlur = 0;
	}
}

export class MegaNuke extends Weapon {
	constructor() {
		super();
		this.name = "Mega Nuke";
		this.description =
			"The biggest bomb. Obliterates everything in a massive radius.";
		this.color = "#facc15";
		this.baseScore = 250;
	}

	fire(x, y, angle, power, ownerId) {
		const magnitude = power * 7; // slightly slower — extra weight
		const rad = (angle * Math.PI) / 180;
		const vx = Math.cos(rad) * magnitude;
		const vy = -Math.sin(rad) * magnitude;
		return [
			new MegaNukeProjectile(
				x,
				y,
				vx,
				vy,
				ownerId,
				this.color,
				200,
				60,
				this.baseScore,
			),
		];
	}
}
