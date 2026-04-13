import { Projectile } from "../Projectile.js";
import { Weapon } from "./Weapon.js";

class RollerProjectile extends Projectile {
	constructor(x, y, vx, vy, ownerId, baseScore) {
		super(x, y, vx, vy, ownerId, "#f59e0b", 50, 35, baseScore);
		this.rolling = false;
		this.rolledDistance = 0;
		this.rollSpeed = 0;
	}

	draw(ctx) {
		if (this.trail.length > 1) {
			ctx.beginPath();
			ctx.moveTo(this.trail[0].x, this.trail[0].y);
			for (let i = 1; i < this.trail.length; i++) {
				ctx.lineTo(this.trail[i].x, this.trail[i].y);
			}
			ctx.strokeStyle = this.rolling
				? "rgba(245, 158, 11, 0.9)"
				: "rgba(245, 158, 11, 0.5)";
			ctx.lineWidth = this.rolling ? 3 : 2;
			ctx.stroke();
		}
		ctx.fillStyle = this.color;
		ctx.shadowBlur = this.rolling ? 20 : 10;
		ctx.shadowColor = this.color;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.rolling ? 7 : 5, 0, Math.PI * 2);
		ctx.fill();
		ctx.shadowBlur = 0;
	}

	update(dt, engine) {
		if (this.rolling) {
			// Counteract gravity/wind — roller sticks to terrain surface
			this.vx = this.rollSpeed;
			this.vy = 0;
			// Snap to terrain surface
			const surfaceY = engine.terrain.getSurfaceHeight(this.x) - 5;
			this.y = surfaceY;
			this.x += this.rollSpeed * dt;
			this.rolledDistance += Math.abs(this.rollSpeed * dt);

			this.trail.push({ x: this.x, y: this.y });
			if (this.trail.length > 20) this.trail.shift();

			if (this.rolledDistance >= 400) {
				this.onHit(engine);
				this.done = true;
			}
		} else {
			super.update(dt, engine);
		}
	}

	onTerrainHit(engine) {
		if (!this.rolling) {
			// Transition to roll mode on first terrain hit
			this.rolling = true;
			this.rollSpeed = this.vx > 0 ? 150 : -150;
			this.trail = [];
			return false; // keep alive
		}
		// If somehow terrain collision fires while rolling, explode
		this.onHit(engine);
		return true;
	}
}

export class Roller extends Weapon {
	constructor() {
		super();
		this.name = "Roller";
		this.description =
			"Lands and rolls 400px along the terrain surface before detonating.";
		this.color = "#f59e0b";
		this.baseScore = 90;
	}

	fire(x, y, angle, power, ownerId) {
		const magnitude = power * 10;
		const rad = (angle * Math.PI) / 180;
		const vx = Math.cos(rad) * magnitude;
		const vy = -Math.sin(rad) * magnitude;
		return [new RollerProjectile(x, y, vx, vy, ownerId, this.baseScore)];
	}
}
