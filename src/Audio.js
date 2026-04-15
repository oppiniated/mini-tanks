/**
 * Procedural sound engine using the Web Audio API.
 * All sounds are synthesised — no audio files required.
 * Enabled state is persisted in localStorage.
 */
export class AudioManager {
	constructor() {
		this.enabled = localStorage.getItem("sfx_enabled") !== "false"; // default on
		this._ctx = null;
	}

	// Lazily create AudioContext on first use (browsers require user gesture first)
	_getCtx() {
		if (!this._ctx) {
			this._ctx = new (window.AudioContext || window.webkitAudioContext)();
		}
		if (this._ctx.state === "suspended") {
			this._ctx.resume();
		}
		return this._ctx;
	}

	toggle() {
		this.enabled = !this.enabled;
		localStorage.setItem("sfx_enabled", this.enabled);
		return this.enabled;
	}

	// ── Helpers ───────────────────────────────────────────────────────────────

	_noise(ctx, duration, gain = 0.3) {
		const bufSize = ctx.sampleRate * duration;
		const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
		const data = buf.getChannelData(0);
		for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
		const src = ctx.createBufferSource();
		src.buffer = buf;
		const g = ctx.createGain();
		g.gain.setValueAtTime(gain, ctx.currentTime);
		src.connect(g);
		g.connect(ctx.destination);
		return { src, gainNode: g };
	}

	_osc(ctx, type, freq, start, duration, gainStart, gainEnd = 0) {
		const osc = ctx.createOscillator();
		const g = ctx.createGain();
		osc.type = type;
		osc.frequency.setValueAtTime(freq, start);
		g.gain.setValueAtTime(gainStart, start);
		g.gain.exponentialRampToValueAtTime(
			Math.max(gainEnd, 0.0001),
			start + duration,
		);
		osc.connect(g);
		g.connect(ctx.destination);
		osc.start(start);
		osc.stop(start + duration + 0.02);
		return osc;
	}

	// ── Public sounds ──────────────────────────────────────────────────────────

	/** Short cannon-fire pop + tail */
	playFire() {
		if (!this.enabled) return;
		const ctx = this._getCtx();
		const t = ctx.currentTime;

		// Low thump
		this._osc(ctx, "sine", 120, t, 0.08, 0.6, 0.001);
		// Mid crack
		this._osc(ctx, "square", 280, t, 0.06, 0.25, 0.001);
		// Noise burst
		const { src, gainNode } = this._noise(ctx, 0.12, 0.18);
		gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
		src.start(t);
	}

	/** Explosion — size 0-1 scales pitch/rumble */
	playExplosion(size = 0.5) {
		if (!this.enabled) return;
		const ctx = this._getCtx();
		const t = ctx.currentTime;
		const dur = 0.4 + size * 0.6;

		// Deep rumble
		const baseFreq = 60 + (1 - size) * 80;
		this._osc(ctx, "sine", baseFreq, t, dur, 0.7, 0.001);
		this._osc(ctx, "sine", baseFreq * 1.5, t, dur * 0.6, 0.3, 0.001);

		// Noise body
		const { src, gainNode } = this._noise(ctx, dur, 0.5 + size * 0.3);
		const filter = ctx.createBiquadFilter();
		filter.type = "lowpass";
		filter.frequency.setValueAtTime(800 + size * 600, t);
		filter.frequency.exponentialRampToValueAtTime(150, t + dur);
		gainNode.gain.setValueAtTime(0.5 + size * 0.3, t);
		gainNode.gain.exponentialRampToValueAtTime(0.0001, t + dur);
		src.disconnect();
		src.connect(filter);
		filter.connect(ctx.destination);
		src.start(t);
	}

	/** Light bounce click */
	playBounce() {
		if (!this.enabled) return;
		const ctx = this._getCtx();
		const t = ctx.currentTime;
		this._osc(ctx, "triangle", 600, t, 0.06, 0.2, 0.001);
		this._osc(ctx, "triangle", 900, t + 0.01, 0.05, 0.1, 0.001);
	}

	/** Tank treads clunk */
	playMove() {
		if (!this.enabled) return;
		const ctx = this._getCtx();
		const t = ctx.currentTime;
		this._osc(ctx, "sawtooth", 80, t, 0.07, 0.15, 0.001);
		const { src, gainNode } = this._noise(ctx, 0.07, 0.1);
		gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
		src.start(t);
	}

	/** Soft ping on turn change */
	playTurnChange() {
		if (!this.enabled) return;
		const ctx = this._getCtx();
		const t = ctx.currentTime;
		this._osc(ctx, "sine", 880, t, 0.15, 0.2, 0.001);
		this._osc(ctx, "sine", 1100, t + 0.06, 0.12, 0.12, 0.001);
	}

	/** Victory fanfare (3 ascending notes) */
	playVictory() {
		if (!this.enabled) return;
		const ctx = this._getCtx();
		const t = ctx.currentTime;
		const notes = [523, 659, 784, 1047];
		notes.forEach((freq, i) => {
			this._osc(ctx, "triangle", freq, t + i * 0.12, 0.25, 0.3, 0.001);
		});
	}

	/** Descending sad notes on defeat / draw */
	playDefeat() {
		if (!this.enabled) return;
		const ctx = this._getCtx();
		const t = ctx.currentTime;
		const notes = [392, 330, 262];
		notes.forEach((freq, i) => {
			this._osc(ctx, "triangle", freq, t + i * 0.18, 0.3, 0.25, 0.001);
		});
	}

	/** Subtle UI click */
	playClick() {
		if (!this.enabled) return;
		const ctx = this._getCtx();
		const t = ctx.currentTime;
		this._osc(ctx, "sine", 1200, t, 0.04, 0.1, 0.001);
	}
}
