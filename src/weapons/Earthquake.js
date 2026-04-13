import { Projectile } from "../Projectile.js";
import { Weapon } from "./Weapon.js";

class EarthquakeProjectile extends Projectile {
	constructor(x, y, vx, vy, ownerId, baseScore) {
		// explosionRadius unused — onHit handles all terrain/damage directly
		super(x, y, vx, vy, ownerId, "#b45309", 35, 40, baseScore);
	}

	draw(ctx) {
		if (this.trail.length > 1) {
			ctx.beginPath();
			ctx.moveTo(this.trail[0].x, this.trail[0].y);
			for (let i = 1; i < this.trail.length; i++) {
				ctx.lineTo(this.trail[i].x, this.trail[i].y);
			}
			ctx.strokeStyle = "rgba(180, 83, 9, 0.6)";
			ctx.lineWidth = 3;
			ctx.stroke();
		}
		ctx.fillStyle = this.color;
		ctx.shadowBlur = 15;
		ctx.shadowColor = this.color;
		// Distinct angular shape to set it apart
		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.rotate(Math.atan2(this.vy, this.vx));
		ctx.beginPath();
		ctx.moveTo(-8, -5);
		ctx.lineTo(8, 0);
		ctx.lineTo(-8, 5);
		ctx.closePath();
		ctx.fill();
		ctx.shadowBlur = 0;
		ctx.restore();
	}

	onHit(engine) {
		// 1. Wide terrain strip destruction using natural overlapping craters
		engine.terrain.destroyStrip(this.x, this.y, 450, 45);
		// 2. Small cosmetic crater at impact point (avoids a 2nd huge canvas op)
		engine.terrain.destroyCircle(this.x, this.y, 35);

		// 3. Manual damage + scoring over a wide radius (no extra terrain destruction)
		const damageRadius = 220;
		const shooter = this.ownerId === 1 ? engine.p1 : engine.p2;
		for (const tank of [engine.p1, engine.p2]) {
			const dist = Math.hypot(tank.x - this.x, tank.y - this.y);
			if (dist < damageRadius) {
				const factor = 1 - dist / damageRadius;
				tank.health = Math.max(0, tank.health - this.damage * factor);
				if (tank !== shooter && this.baseScore > 0) {
					shooter.score += Math.max(1, Math.round(this.baseScore * factor));
				}
			}
		}
		engine.updateHealthUI();
		engine.updateScoreUI();

		// 4. Rumble particles spread across the strip
		for (let i = 0; i < 18; i++) {
			engine.particles.push({
				x: this.x + (Math.random() - 0.5) * 450,
				y: this.y,
				vx: (Math.random() - 0.5) * 5,
				vy: -(Math.random() * 5 + 1),
				life: 1.0,
				color: Math.random() > 0.5 ? "#92400e" : "#78350f",
			});
		}
	}
}

export class Earthquake extends Weapon {
	constructor() {
		super();
		this.name = "Earthquake";
		this.description =
			"Shakes the ground on impact, collapsing terrain in a 450px wide strip.";
		this.color = "#b45309";
		this.baseScore = 120;
	}

	fire(x, y, angle, power, ownerId) {
		const magnitude = power * 10;
		const rad = (angle * Math.PI) / 180;
		const vx = Math.cos(rad) * magnitude;
		const vy = -Math.sin(rad) * magnitude;
		return [new EarthquakeProjectile(x, y, vx, vy, ownerId, this.baseScore)];
	}
}
