import { Projectile } from "../Projectile.js";
import { Weapon } from "./Weapon.js";

export class HeavyShell extends Weapon {
	constructor() {
		super();
		this.name = "Heavy Shell";
		this.description = "A slow, massive shell that blasts a huge crater.";
		this.color = "#f97316";
		this.baseScore = 150;
	}

	fire(x, y, angle, power, ownerId) {
		const magnitude = power * 7.5; // 0.75× speed — heavier projectile
		const rad = (angle * Math.PI) / 180;
		const vx = Math.cos(rad) * magnitude;
		const vy = -Math.sin(rad) * magnitude;
		return [
			new Projectile(x, y, vx, vy, ownerId, this.color, 80, 50, this.baseScore),
		];
	}
}
