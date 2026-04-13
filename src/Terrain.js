export class Terrain {
	constructor(width, height) {
		this.width = width;
		this.height = height;

		// Setup hidden canvas for collision mask
		this.maskCanvas = document.createElement("canvas");
		this.maskCanvas.width = width;
		this.maskCanvas.height = height;
		this.maskCtx = this.maskCanvas.getContext("2d", {
			willReadFrequently: true,
		});

		this.imageData = null; // We'll cache imageData for fast collision checks
		this.dirty = true;
	}

	resize(width, height) {
		// Simple resize, realistically we'd need to stretch the terrain or recreate
		// For simplicity now, we just recreate
		this.width = width;
		this.height = height;
		this.maskCanvas.width = width;
		this.maskCanvas.height = height;
		this.generate();
	}

	generate() {
		this.maskCtx.clearRect(0, 0, this.width, this.height);

		// Generate random heights using multiple sine waves
		const points = [];
		const baseHeight = this.height * 0.6;
		const variations = [
			{ freq: 0.005, amp: 100 },
			{ freq: 0.02, amp: 30 },
			{ freq: 0.05, amp: 10 },
		];

		// Random offsets for unique generation
		const offsets = variations.map(() => Math.random() * 1000);

		this.maskCtx.fillStyle = "#1e293b"; // Base terrain color
		this.maskCtx.beginPath();
		this.maskCtx.moveTo(0, this.height);

		for (let x = 0; x <= this.width; x += 2) {
			let y = baseHeight;
			variations.forEach((v, i) => {
				y -= Math.sin((x + offsets[i]) * v.freq) * v.amp;
			});
			points.push({ x, y });
			this.maskCtx.lineTo(x, y);
		}

		this.maskCtx.lineTo(this.width, this.height);
		this.maskCtx.closePath();
		this.maskCtx.fill();

		// Add a nice gradient overlay to the terrain
		this.maskCtx.globalCompositeOperation = "source-atop";
		const grad = this.maskCtx.createLinearGradient(
			0,
			this.height * 0.3,
			0,
			this.height,
		);
		grad.addColorStop(0, "#334155");
		grad.addColorStop(1, "#0f172a");
		this.maskCtx.fillStyle = grad;
		this.maskCtx.fillRect(0, 0, this.width, this.height);

		// Add grass layer
		this.maskCtx.fillStyle = "#16a34a";
		this.maskCtx.beginPath();
		points.forEach((p, i) => {
			if (i === 0) this.maskCtx.moveTo(p.x, p.y + 10);
			else this.maskCtx.lineTo(p.x, p.y + 10);
		});
		for (let i = points.length - 1; i >= 0; i--) {
			this.maskCtx.lineTo(points[i].x, points[i].y - 5);
		}
		this.maskCtx.fill();

		// Reset composite operation
		this.maskCtx.globalCompositeOperation = "source-over";

		this.updateImageData();
	}

	getSurfaceHeight(x) {
		// Always use fresh data — terrain may have been modified since last call
		if (this.dirty || !this.imageData) this.updateImageData();
		const data = this.imageData.data;
		const cx = Math.floor(x);
		if (cx < 0 || cx >= this.width) return this.height - 50;

		for (let y = 0; y < this.height; y++) {
			const alpha = data[(y * this.width + cx) * 4 + 3];
			if (alpha > 128) {
				return y;
			}
		}
		return this.height; // Fallback
	}

	destroyCircle(x, y, radius) {
		this.maskCtx.globalCompositeOperation = "destination-out";
		this.maskCtx.beginPath();
		this.maskCtx.arc(x, y, radius, 0, Math.PI * 2);
		this.maskCtx.fill();
		this.maskCtx.globalCompositeOperation = "source-over";

		this.dirty = true;
	}

	destroyRect(x, y, w, h) {
		this.maskCtx.globalCompositeOperation = "destination-out";
		this.maskCtx.fillRect(x - w / 2, y - h / 2, w, h);
		this.maskCtx.globalCompositeOperation = "source-over";
		this.dirty = true;
	}

	// Destroys a wide strip using overlapping circles so edges look natural
	destroyStrip(centerX, surfaceY, width, depth) {
		const r = depth;
		const step = r * 0.8; // overlap circles by 20%
		const startX = centerX - width / 2;
		const endX = centerX + width / 2;
		this.maskCtx.globalCompositeOperation = "destination-out";
		this.maskCtx.beginPath();
		for (let cx = startX; cx <= endX + step; cx += step) {
			this.maskCtx.arc(
				Math.min(cx, endX),
				surfaceY + r * 0.3,
				r,
				0,
				Math.PI * 2,
			);
			this.maskCtx.closePath();
		}
		this.maskCtx.fill();
		this.maskCtx.globalCompositeOperation = "source-over";
		this.dirty = true;
	}

	addCircle(x, y, radius) {
		// Dirt mover uses this
		this.maskCtx.globalCompositeOperation = "source-over";
		this.maskCtx.fillStyle = "#854d0e"; // Dirt color
		this.maskCtx.beginPath();
		this.maskCtx.arc(x, y, radius, 0, Math.PI * 2);
		this.maskCtx.fill();

		this.dirty = true;
	}

	updateImageData() {
		this.imageData = this.maskCtx.getImageData(0, 0, this.width, this.height);
		this.dirty = false;
	}

	checkCollision(x, y) {
		// Use cached image data
		if (this.dirty) this.updateImageData();

		const cx = Math.floor(x);
		const cy = Math.floor(y);

		if (cx < 0 || cx >= this.width || cy < 0 || cy >= this.height) {
			return false;
		}

		const alphaIndex = (cy * this.width + cx) * 4 + 3;
		return this.imageData.data[alphaIndex] > 10;
	}

	draw(ctx) {
		ctx.drawImage(this.maskCanvas, 0, 0);
	}
}
