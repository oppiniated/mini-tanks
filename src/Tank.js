export class Tank {
	constructor(id, x, y, color) {
		this.id = id;
		this.x = x;
		this.y = y;
		this.color = color;

		this.health = 100;
		this.score = 0;
		this.turnsLeft = 10;
		this.targetAngle = 45; // 0 is right, 90 is up, 180 is left, 270 is down
		this.power = 50; // 0 to 100
		this.movesLeft = 4;

		// Visual constants
		this.width = 40;
		this.height = 15;
		this.turretLength = 25;
	}

	draw(ctx) {
		ctx.save();
		ctx.translate(this.x, this.y);

		// Draw treads
		ctx.fillStyle = "#1e293b";
		ctx.beginPath();
		ctx.roundRect(-this.width / 2, -5, this.width, 10, 5);
		ctx.fill();

		// Draw body
		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.roundRect(
			-this.width / 2 + 5,
			-this.height,
			this.width - 10,
			this.height,
			4,
		);
		ctx.fill();
		ctx.strokeStyle = "#ffffff";
		ctx.lineWidth = 1;
		ctx.stroke();

		// Draw turret base
		ctx.beginPath();
		ctx.arc(0, -this.height, 8, 0, Math.PI * 2);
		ctx.fill();

		// Draw turret barrel
		ctx.save();
		ctx.translate(0, -this.height);
		ctx.rotate((-this.targetAngle * Math.PI) / 180);
		ctx.fillStyle = "#94a3b8";
		ctx.fillRect(0, -2, this.turretLength, 4);
		ctx.strokeRect(0, -2, this.turretLength, 4);
		ctx.restore();

		ctx.restore();

		// Draw floating health/player indicator
		ctx.fillStyle = "#ffffff";
		ctx.font = "10px sans-serif";
		ctx.textAlign = "center";
		ctx.fillText(`P${this.id}`, this.x, this.y - 35);
	}
}
