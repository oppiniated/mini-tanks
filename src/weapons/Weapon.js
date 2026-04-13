export class Weapon {
	constructor() {
		this.name = "Base Weapon";
		this.description = "Base class for weapons.";
		this.color = "#ffffff";
		this.baseScore = 0;
	}

	// Returns an array of Projectiles to be added to the Engine
	fire(_x, _y, _angle, _power, _ownerId) {
		return [];
	}
}
