export const GRAVITY = 600; // pixels per second squared

export function applyForces(entity, wind, dt) {
	// Gravity
	entity.vy += GRAVITY * dt;

	// Wind acceleration
	const windEffect = wind * 1.5;
	entity.vx += windEffect * dt;
}
