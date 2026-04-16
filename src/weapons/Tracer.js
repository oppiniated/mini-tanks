import { Projectile } from "../Projectile.js";
import { Weapon } from "./Weapon.js";

/**
 * TracerProjectile — lands silently (no explosion) and spawns a floating
 * annotation showing how many degrees the player needs to adjust their angle
 * to hit the opponent from the current tank position.
 */
class TracerProjectile extends Projectile {
	constructor(x, y, vx, vy, ownerId, firingAngle, tankX, tankY) {
		super(x, y, vx, vy, ownerId, "#facc15", 0, 0, 0);
		this.firingAngle = firingAngle; // degrees used to fire this tracer
		this.tankX = tankX;
		this.tankY = tankY;
	}

	draw(ctx) {
		// Thinner, dashed-looking trail in yellow
		if (this.trail.length > 1) {
			ctx.beginPath();
			ctx.moveTo(this.trail[0].x, this.trail[0].y);
			for (let i = 1; i < this.trail.length; i++) {
				ctx.lineTo(this.trail[i].x, this.trail[i].y);
			}
			ctx.strokeStyle = "rgba(250, 204, 21, 0.4)";
			ctx.lineWidth = 1;
			ctx.stroke();
		}
		// Small crosshair marker
		ctx.strokeStyle = "#facc15";
		ctx.lineWidth = 1.5;
		ctx.beginPath();
		ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
		ctx.stroke();
	}

	onHit(engine) {
		// No explosion — just spawn a floating hint
		const target = engine.currentPlayer === 1 ? engine.p2 : engine.p1;
		const correction = this._computeCorrection(engine, target);
		engine.particles.push(
			new TracerHint(this.x, this.y, correction, this.firingAngle),
		);
	}

	onTerrainHit(engine) {
		this.onHit(engine);
		return true;
	}

	/**
	 * Compute the angle correction (in degrees) needed to aim from the
	 * firing tank toward the target, accounting for current wind/gravity.
	 * Returns a signed number: positive = aim higher, negative = aim lower.
	 */
	_computeCorrection(engine, target) {
		const power = engine.activeTank().power;
		const v = power * 10;
		const g = 600;
		const wind = engine.wind;
		const dt = 0.05;
		const maxTime = 6.0;

		const x0 = this.tankX;
		const y0 = this.tankY - 20; // approximate barrel height

		let bestAngle = this.firingAngle;
		let bestDist = Infinity;

		for (let deg = 1; deg < 180; deg++) {
			const rad = (deg * Math.PI) / 180;
			let x = x0;
			let y = y0;
			let vx = Math.cos(rad) * v;
			let vy = -Math.sin(rad) * v;
			let closest = Infinity;

			for (let t = 0; t < maxTime; t += dt) {
				x += vx * dt;
				y += vy * dt;
				vy += g * dt;
				vx += wind * 1.5 * dt;
				if (y > engine.canvas.height + 100) break;
				const d = Math.hypot(x - target.x, y - target.y);
				if (d < closest) closest = d;
			}

			if (closest < bestDist) {
				bestDist = closest;
				bestAngle = deg;
			}
		}

		return Math.round(bestAngle - this.firingAngle);
	}
}

/**
 * TracerHint — a particle that floats upward displaying the angle correction.
 * Lives for ~2.5 seconds.
 */
class TracerHint {
	constructor(x, y, correction, firingAngle) {
		this.x = x;
		this.y = y;
		this.correction = correction;
		this.firingAngle = firingAngle;
		this.life = 1.0; // 0→1, fades out
		this.vy = -30; // float upward px/s
	}

	update(dt) {
		this.y += this.vy * dt;
		this.life -= dt / 2.5;
	}

	draw(ctx) {
		if (this.life <= 0) return;
		const alpha = Math.max(0, this.life);
		const sign = this.correction > 0 ? "+" : "";
		const label =
			this.correction === 0
				? "✓ On target!"
				: `${sign}${this.correction}° to hit`;

		ctx.save();
		ctx.globalAlpha = alpha;
		ctx.font = "bold 13px monospace";
		ctx.textAlign = "center";

		// Outline for legibility
		ctx.strokeStyle = "rgba(0,0,0,0.8)";
		ctx.lineWidth = 3;
		ctx.strokeText(label, this.x, this.y);

		ctx.fillStyle = this.correction === 0 ? "#4ade80" : "#facc15";
		ctx.fillText(label, this.x, this.y);

		// Small dot at landing point
		ctx.beginPath();
		ctx.arc(this.x, this.y + 8, 3, 0, Math.PI * 2);
		ctx.fillStyle = `rgba(250, 204, 21, ${alpha})`;
		ctx.fill();

		ctx.restore();
	}

	get dead() {
		return this.life <= 0;
	}
}

export class Tracer extends Weapon {
	constructor() {
		super();
		this.name = "Tracer";
		this.color = "#facc15";
		this.description =
			"Fires 5 scouts in a spread. Each one lands and tells you how many degrees to adjust your angle to hit the target.";
		this.baseScore = 0;
	}

	fire(x, y, angle, power, ownerId) {
		const v = power * 10;
		const spread = [-10, -5, 0, 5, 10]; // degrees offset from aimed angle

		return spread.map((offset) => {
			const deg = angle + offset;
			const rad = (deg * Math.PI) / 180;
			const vx = Math.cos(rad) * v;
			const vy = -Math.sin(rad) * v;
			return new TracerProjectile(x, y, vx, vy, ownerId, deg, x, y);
		});
	}
}
