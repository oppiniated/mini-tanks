import { Projectile } from "../Projectile.js";
import { Weapon } from "./Weapon.js";

export class AirStrike extends Weapon {
	constructor() {
		super();
		this.name = "Air Strike";
		this.description =
			"Calls in 5 bombs dropping straight down. Aim with angle; power controls spread.";
		this.color = "#f43f5e";
		this.baseScore = 60;
	}

	fire(_x, _y, angle, power, ownerId) {
		// Map angle (0–180°) to a center x on the canvas.
		// angle=0 → right edge, angle=90 → centre, angle=180 → left edge.
		const canvasWidth = 1200; // matches Engine canvas width
		const centerX = canvasWidth * (1 - angle / 180);

		// Spread scales with power (0–100 → 0–400px total)
		const spread = power * 4;
		const vy = 400 + power * 5; // faster at higher power
		const projectiles = [];

		for (let i = 0; i < 5; i++) {
			const offset = -spread / 2 + (spread / 4) * i;
			projectiles.push(
				new Projectile(
					centerX + offset,
					-10,
					0,
					vy,
					ownerId,
					this.color,
					35,
					20,
					this.baseScore,
				),
			);
		}
		return projectiles;
	}
}
