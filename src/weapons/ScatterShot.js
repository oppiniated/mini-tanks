import { Projectile } from "../Projectile.js";
import { Weapon } from "./Weapon.js";

class ScatterShotProjectile extends Projectile {
	constructor(x, y, vx, vy, ownerId, baseScore) {
		super(x, y, vx, vy, ownerId, "#34d399", 15, 5, baseScore);
	}

	onTerrainHit(engine) {
		engine.createExplosion(this.x, this.y, 15, 5, this.ownerId, 0);

		// 7 sub-projectiles fanned from 40° to 140°
		for (let i = 0; i < 7; i++) {
			const angle = 40 + (100 / 6) * i;
			const rad = (angle * Math.PI) / 180;
			const speed = 400 + Math.random() * 150;
			const vx = Math.cos(rad) * speed;
			const vy = -Math.sin(rad) * speed;
			engine.projectiles.push(
				new Projectile(
					this.x,
					this.y,
					vx,
					vy,
					this.ownerId,
					"#6ee7b7",
					22,
					14,
					this.baseScore,
				),
			);
		}
		return true;
	}
}

export class ScatterShot extends Weapon {
	constructor() {
		super();
		this.name = "Scatter Shot";
		this.description =
			"Hits the ground and scatters 7 shells upward in a wide fan.";
		this.color = "#34d399";
		this.baseScore = 40;
	}

	fire(x, y, angle, power, ownerId) {
		const magnitude = power * 10;
		const rad = (angle * Math.PI) / 180;
		const vx = Math.cos(rad) * magnitude;
		const vy = -Math.sin(rad) * magnitude;
		return [new ScatterShotProjectile(x, y, vx, vy, ownerId, this.baseScore)];
	}
}
