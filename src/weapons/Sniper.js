import { Projectile } from "../Projectile.js";
import { Weapon } from "./Weapon.js";

class SniperProjectile extends Projectile {
	constructor(x, y, vx, vy, ownerId, color, baseScore) {
		super(x, y, vx, vy, ownerId, color, 10, 0, baseScore);
		this.directDamage = 80;
	}

	draw(ctx) {
		// Thin, fast-looking streak
		if (this.trail.length > 1) {
			ctx.beginPath();
			ctx.moveTo(this.trail[0].x, this.trail[0].y);
			for (let i = 1; i < this.trail.length; i++) {
				ctx.lineTo(this.trail[i].x, this.trail[i].y);
			}
			ctx.strokeStyle = "rgba(34, 211, 238, 0.9)";
			ctx.lineWidth = 1.5;
			ctx.stroke();
		}
		ctx.fillStyle = this.color;
		ctx.shadowBlur = 8;
		ctx.shadowColor = this.color;
		ctx.beginPath();
		ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
		ctx.fill();
		ctx.shadowBlur = 0;
	}

	// Direct tank hit — full precision damage, no area splash
	onHit(engine) {
		engine.terrain.destroyCircle(this.x, this.y, this.explosionRadius);
		const shooter = this.ownerId === 1 ? engine.p1 : engine.p2;
		const tanks = [engine.p1, engine.p2];
		for (const tank of tanks) {
			if (tank !== shooter) {
				const dist = Math.hypot(tank.x - this.x, tank.y - this.y);
				if (dist < 25) {
					tank.health = Math.max(0, tank.health - this.directDamage);
					shooter.score += this.baseScore;
					engine.updateHealthUI();
					engine.updateScoreUI();
				}
			}
		}
		for (let i = 0; i < 8; i++) {
			engine.particles.push({
				x: this.x,
				y: this.y,
				vx: (Math.random() - 0.5) * 20,
				vy: (Math.random() - 0.5) * 20,
				life: 0.8,
				color: this.color,
			});
		}
	}

	// Terrain miss — small visual puff, no damage
	onTerrainHit(engine) {
		for (let i = 0; i < 5; i++) {
			engine.particles.push({
				x: this.x,
				y: this.y,
				vx: (Math.random() - 0.5) * 8,
				vy: (Math.random() - 0.5) * 8,
				life: 0.5,
				color: this.color,
			});
		}
		return true;
	}
}

export class Sniper extends Weapon {
	constructor() {
		super();
		this.name = "Sniper";
		this.description =
			"Extremely fast and precise. Full damage on direct hit only — no splash.";
		this.color = "#22d3ee";
		this.baseScore = 130;
	}

	fire(x, y, angle, power, ownerId) {
		const magnitude = power * 25; // 2.5× speed
		const rad = (angle * Math.PI) / 180;
		const vx = Math.cos(rad) * magnitude;
		const vy = -Math.sin(rad) * magnitude;
		return [
			new SniperProjectile(x, y, vx, vy, ownerId, this.color, this.baseScore),
		];
	}
}
