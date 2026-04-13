import { Projectile } from "../Projectile.js";
import { Weapon } from "./Weapon.js";

// ClusterProjectile is retained for future split-on-apex behaviour (currently unused)
// biome-ignore lint/correctness/noUnusedVariables: reserved for future use
class ClusterProjectile extends Projectile {
	constructor(x, y, vx, vy, ownerId, color, isChild = false) {
		super(x, y, vx, vy, ownerId, color, isChild ? 20 : 40, isChild ? 10 : 25);
		this.isChild = isChild;
		this.hasSplit = false;
	}

	update(dt) {
		super.update(dt);

		// Split at apex if it's the parent bomb
		if (!this.isChild && !this.hasSplit && this.vy > 0) {
			this.hasSplit = true;
			// The split logic needs access to engine.projectiles, which we don't directly have.
			// A more robust engine would emit events or pass engine to update().
			// For now, we'll mark it to be split in the Engine turn logic if possible,
			// or just cheat by attaching a reference to the Engine in Projectile in Engine.js.
			// Actually, we can just split when vy crosses 0 if we pass `engine` to `update`, but we don't.
		}
	}
}

// Since we didn't pass engine to update(), let's modify the weapon to just shoot a cluster of 5 bombs directly.
export class ClusterBomb extends Weapon {
	constructor() {
		super();
		this.name = "Cluster Bomb";
		this.description = "Fires a spread of 5 smaller bombs.";
		this.color = "#fbbf24";
		this.baseScore = 40;
	}

	fire(x, y, angle, power, ownerId) {
		const magnitude = power * 10;
		const projectiles = [];

		// Fire 5 projectiles with slight angle variations
		for (let i = -2; i <= 2; i++) {
			const spreadAngle = angle + i * 3; // 3 degrees spread
			const rad = (spreadAngle * Math.PI) / 180;
			const vx = Math.cos(rad) * magnitude;
			const vy = -Math.sin(rad) * magnitude;

			projectiles.push(
				new Projectile(
					x,
					y,
					vx,
					vy,
					ownerId,
					this.color,
					25,
					15,
					this.baseScore,
				),
			);
		}

		return projectiles;
	}
}
