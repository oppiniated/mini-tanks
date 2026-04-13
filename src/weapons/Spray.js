import { Projectile } from "../Projectile.js";
import { Weapon } from "./Weapon.js";

export class Spray extends Weapon {
	constructor() {
		super();
		this.name = "Spray";
		this.description =
			"12 small pellets in a wide random spread. Devastating up close.";
		this.color = "#a3e635";
		this.baseScore = 20;
	}

	fire(x, y, angle, power, ownerId) {
		const magnitude = power * 10;
		const projectiles = [];
		for (let i = 0; i < 12; i++) {
			const spreadAngle = angle + (Math.random() - 0.5) * 40; // ±20°
			const speedFactor = 0.8 + Math.random() * 0.4; // 80–120% speed variation
			const rad = (spreadAngle * Math.PI) / 180;
			projectiles.push(
				new Projectile(
					x,
					y,
					Math.cos(rad) * magnitude * speedFactor,
					-Math.sin(rad) * magnitude * speedFactor,
					ownerId,
					this.color,
					8,
					8,
					this.baseScore,
				),
			);
		}
		return projectiles;
	}
}
