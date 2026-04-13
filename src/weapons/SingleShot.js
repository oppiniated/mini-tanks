import { Projectile } from "../Projectile.js";
import { Weapon } from "./Weapon.js";

export class SingleShot extends Weapon {
	constructor() {
		super();
		this.name = "Single Shot";
		this.description =
			"A standard projectile that creates a medium-sized crater.";
		this.color = "#f8fafc";
		this.baseScore = 100;
	}

	fire(x, y, angle, power, ownerId) {
		const magnitude = power * 10;
		const rad = (angle * Math.PI) / 180;
		const vx = Math.cos(rad) * magnitude;
		const vy = -Math.sin(rad) * magnitude;

		const p = new Projectile(
			x,
			y,
			vx,
			vy,
			ownerId,
			this.color,
			40,
			25,
			this.baseScore,
		);
		return [p];
	}
}
