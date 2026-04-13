import { Engine } from "./Engine.js";

document.addEventListener("DOMContentLoaded", () => {
	const engine = new Engine();
	engine.init();

	// Resize handler
	window.addEventListener("resize", () => {
		engine.resize();
	});
});
