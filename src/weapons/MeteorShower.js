import { Projectile } from "../Projectile.js";
import { Weapon } from "./Weapon.js";

class MeteorProjectile extends Projectile {
	constructor(x, y, vx, vy, ownerId, baseScore) {
		super(x, y, vx, vy, ownerId, "#a78bfa", 35, 25, baseScore);
	}

	draw(ctx) {
		if (this.trail.length > 1) {
			for (let i = 1; i < this.trail.length; i++) {
				const alpha = i / this.trail.length;
				ctx.beginPath();
				ctx.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
				ctx.lineTo(this.trail[i].x, this.trail[i].y);
				ctx.strokeStyle = `rgba(167, 139, 250, ${alpha * 0.7})`;
				ctx.lineWidth = 2;
				ctx.stroke();
			}
		}
		ctx.fillStyle = this.color;
		ctx.shadowBlur = 16;
		ctx.shadowColor = this.color;
		ctx.beginPath();
		ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
		ctx.fill();
		ctx.shadowBlur = 0;
	}
}

class MeteorShowerProjectile extends Projectile {
	constructor(x, y, vx, vy, ownerId, baseScore) {
		super(x, y, vx, vy, ownerId, "#a78bfa", 20, 10, baseScore);
	}

	_spawnMeteors(engine) {
		engine.createExplosion(this.x, this.y, 20, 10, this.ownerId, 0);
		for (let i = 0; i < 8; i++) {
			const offsetX = (Math.random() - 0.5) * 300;
			const vy = 600 + Math.random() * 200;
			const vx = (Math.random() - 0.5) * 100;
			engine.projectiles.push(
				new MeteorProjectile(
					this.x + offsetX,
					-20,
					vx,
					vy,
					this.ownerId,
					this.baseScore,
				),
			);
		}
	}

	onTerrainHit(engine) {
		this._spawnMeteors(engine);
		return true;
	}

	onHit(engine) {
		this._spawnMeteors(engine);
	}
}

export class MeteorShower extends Weapon {
	constructor() {
		super();
		this.name = "Meteor Shower";
		this.description =
			"The shell marks a target zone; 8 meteors rain down from the sky around it.";
		this.color = "#a78bfa";
		this.baseScore = 65;
	}

	fire(x, y, angle, power, ownerId) {
		const magnitude = power * 10;
		const rad = (angle * Math.PI) / 180;
		const vx = Math.cos(rad) * magnitude;
		const vy = -Math.sin(rad) * magnitude;
		return [new MeteorShowerProjectile(x, y, vx, vy, ownerId, this.baseScore)];
	}
}
