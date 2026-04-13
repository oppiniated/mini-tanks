import { Projectile } from "../Projectile.js";
import { Weapon } from "./Weapon.js";

class FunkyBombProjectile extends Projectile {
	constructor(x, y, vx, vy, ownerId, baseScore) {
		super(x, y, vx, vy, ownerId, "#ec4899", 30, 15, baseScore);
	}

	draw(ctx) {
		if (this.trail.length > 1) {
			ctx.beginPath();
			ctx.moveTo(this.trail[0].x, this.trail[0].y);
			for (let i = 1; i < this.trail.length; i++) {
				ctx.lineTo(this.trail[i].x, this.trail[i].y);
			}
			ctx.strokeStyle = "rgba(236, 72, 153, 0.6)";
			ctx.lineWidth = 2;
			ctx.stroke();
		}
		ctx.fillStyle = this.color;
		ctx.shadowBlur = 15;
		ctx.shadowColor = this.color;
		ctx.beginPath();
		ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
		ctx.fill();
		ctx.shadowBlur = 0;
	}

	onHit(engine) {
		// Standard explosion for this shell
		engine.createExplosion(
			this.x,
			this.y,
			this.explosionRadius,
			this.damage,
			this.ownerId,
			this.baseScore,
		);

		// Spawn 6 sub-projectiles in random directions from impact point
		const numChildren = 6;
		for (let i = 0; i < numChildren; i++) {
			const angle =
				(Math.PI * 2 * i) / numChildren + (Math.random() - 0.5) * 0.8;
			const speed = 300 + Math.random() * 250;
			engine.projectiles.push(
				new Projectile(
					this.x,
					this.y,
					Math.cos(angle) * speed,
					Math.sin(angle) * speed,
					this.ownerId,
					"#f9a8d4",
					25,
					15,
					this.baseScore,
				),
			);
		}
	}
}

export class FunkyBomb extends Weapon {
	constructor() {
		super();
		this.name = "Funky Bomb";
		this.description =
			"Explodes then launches 6 sub-shells outward in all directions. Chaotic.";
		this.color = "#ec4899";
		this.baseScore = 40;
	}

	fire(x, y, angle, power, ownerId) {
		const magnitude = power * 10;
		const rad = (angle * Math.PI) / 180;
		const vx = Math.cos(rad) * magnitude;
		const vy = -Math.sin(rad) * magnitude;
		return [new FunkyBombProjectile(x, y, vx, vy, ownerId, this.baseScore)];
	}
}
