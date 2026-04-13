export class Projectile {
	constructor(
		x,
		y,
		vx,
		vy,
		ownerId,
		color = "#f8fafc",
		explosionRadius = 40,
		damage = 25,
		baseScore = 0,
	) {
		this.x = x;
		this.y = y;
		this.vx = vx;
		this.vy = vy;
		this.ownerId = ownerId;
		this.color = color;
		this.explosionRadius = explosionRadius;
		this.damage = damage;
		this.baseScore = baseScore;
		this.trail = [];
	}

	// engine param available for subclasses that need it (e.g. HomingMissile)
	update(dt, _engine = null) {
		this.x += this.vx * dt;
		this.y += this.vy * dt;

		// Add to trail
		this.trail.push({ x: this.x, y: this.y });
		if (this.trail.length > 20) {
			this.trail.shift();
		}
	}

	draw(ctx) {
		// Draw trail
		if (this.trail.length > 1) {
			ctx.beginPath();
			ctx.moveTo(this.trail[0].x, this.trail[0].y);
			for (let i = 1; i < this.trail.length; i++) {
				ctx.lineTo(this.trail[i].x, this.trail[i].y);
			}
			ctx.strokeStyle = `rgba(255, 255, 255, 0.5)`;
			ctx.lineWidth = 2;
			ctx.stroke();
		}

		// Draw projectile
		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
		ctx.fill();
		ctx.shadowBlur = 10;
		ctx.shadowColor = this.color;
		ctx.fill();
		ctx.shadowBlur = 0;
	}

	// Default hit behavior is a standard explosion
	onHit(engine) {
		engine.createExplosion(
			this.x,
			this.y,
			this.explosionRadius,
			this.damage,
			this.ownerId,
			this.baseScore,
		);
	}

	// Called when projectile hits terrain.
	// Return true to remove projectile (default), false to keep alive (e.g. Bouncer).
	onTerrainHit(engine) {
		this.onHit(engine);
		return true;
	}
}
