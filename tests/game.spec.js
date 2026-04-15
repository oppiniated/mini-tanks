import { expect, test } from "@playwright/test";

test.describe("Start screen", () => {
	test("shows 1P and 2P buttons on load", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#start-screen")).toBeVisible();
		await expect(page.getByRole("button", { name: /1 player/i })).toBeVisible();
		await expect(page.getByRole("button", { name: /2 player/i })).toBeVisible();
	});

	test("shows color swatches after selecting 1P mode", async ({ page }) => {
		await page.goto("/");
		await page.getByRole("button", { name: /1 player/i }).click();
		await expect(page.locator("#p1-swatches")).toBeVisible();
		const swatches = page.locator("#p1-swatches .color-swatch");
		await expect(swatches).toHaveCount(10);
	});

	test("shows color swatches for both players in 2P mode", async ({
		page,
	}) => {
		await page.goto("/");
		await page.getByRole("button", { name: /2 player/i }).click();
		const rows = page.locator(".color-swatches");
		await expect(rows).toHaveCount(2);
	});

	test("can select a tank color and start 1P game", async ({ page }) => {
		await page.goto("/");
		await page.getByRole("button", { name: /1 player/i }).click();
		await page.locator(".color-swatch").nth(3).click();
		await page.getByRole("button", { name: /start game/i }).click();
		await expect(page.locator("#start-screen")).toBeHidden();
		await expect(page.locator("#fire-btn")).toBeVisible();
	});
});

test.describe("SFX toggle", () => {
	test("sfx button is present and shows speaker emoji", async ({ page }) => {
		await page.goto("/");
		const btn = page.locator("#sfx-btn");
		await expect(btn).toBeVisible();
		await expect(btn).toHaveText("🔊");
	});

	test("toggles between 🔊 and 🔇 on click", async ({ page }) => {
		await page.goto("/");
		const btn = page.locator("#sfx-btn");
		// Use evaluate to directly invoke click handler (start screen overlays the button)
		await page.evaluate(() =>
			document.getElementById("sfx-btn").dispatchEvent(new MouseEvent("click")),
		);
		await expect(btn).toHaveText("🔇");
		await page.evaluate(() =>
			document.getElementById("sfx-btn").dispatchEvent(new MouseEvent("click")),
		);
		await expect(btn).toHaveText("🔊");
	});

	test("persists mute state across page reload", async ({ page }) => {
		await page.goto("/");
		await page.evaluate(() =>
			document.getElementById("sfx-btn").dispatchEvent(new MouseEvent("click")),
		); // mute
		await page.reload();
		await expect(page.locator("#sfx-btn")).toHaveText("🔇");
		// cleanup: restore default
		await page.evaluate(() =>
			document.getElementById("sfx-btn").dispatchEvent(new MouseEvent("click")),
		);
	});
});

test.describe("1P game – controls", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.getByRole("button", { name: /1 player/i }).click();
		await page.locator(".color-swatch").first().click();
		await page.getByRole("button", { name: /start game/i }).click();
	});

	test("angle slider and display update together", async ({ page }) => {
		const slider = page.locator("#angle-slider");
		const display = page.locator("#angle-val");
		await slider.fill("90");
		await slider.dispatchEvent("input");
		await expect(display).toHaveText("90");
	});

	test("power slider and display update together", async ({ page }) => {
		const slider = page.locator("#power-slider");
		const display = page.locator("#power-val");
		await slider.fill("75");
		await slider.dispatchEvent("input");
		await expect(display).toHaveText("75");
	});

	test("move buttons decrement moves counter", async ({ page }) => {
		await expect(page.locator("#moves-left-val")).toHaveText("4");
		await page.locator("#move-right-btn").click();
		await expect(page.locator("#moves-left-val")).toHaveText("3");
		// Wait for tank MOVING state to resolve before next click
		await page.waitForFunction(
			() => document.getElementById("moves-left-val").textContent === "3",
		);
		await page.waitForTimeout(600);
		await page.locator("#move-right-btn").click();
		await expect(page.locator("#moves-left-val")).toHaveText("2");
	});

	test("move buttons disable at 0 moves left", async ({ page }) => {
		for (let i = 0; i < 4; i++) {
			await page.locator("#move-right-btn").click();
			// Wait for MOVING state to complete before next click
			await page.waitForTimeout(600);
		}
		await expect(page.locator("#moves-left-val")).toHaveText("0");
		await expect(page.locator("#move-right-btn")).toBeDisabled();
		await expect(page.locator("#move-left-btn")).toBeDisabled();
	});

	test("fire button is enabled at start of turn", async ({ page }) => {
		await expect(page.locator("#fire-btn")).toBeEnabled();
	});

	test("fire button disables during firing then re-enables", async ({
		page,
	}) => {
		await page.locator("#angle-slider").fill("90");
		await page.locator("#angle-slider").dispatchEvent("input");
		await page.locator("#fire-btn").click();
		// While projectile is in flight the button is disabled
		await expect(page.locator("#fire-btn")).toBeDisabled();
		// After the full turn resolves (CPU fires too) the button re-enables
		await expect(page.locator("#fire-btn")).toBeEnabled({ timeout: 15_000 });
	});

	test("turn indicator switches to CPU after player fires", async ({
		page,
	}) => {
		await page.locator("#angle-slider").fill("90");
		await page.locator("#angle-slider").dispatchEvent("input");
		await page.locator("#fire-btn").click();
		await expect(page.locator("#turn-indicator")).toContainText(/cpu/i, {
			timeout: 5_000,
		});
	});

	test("health bars are rendered for both players", async ({ page }) => {
		await expect(page.locator("#p1-health")).toBeVisible();
		await expect(page.locator("#p2-health")).toBeVisible();
	});

	test("score elements are present", async ({ page }) => {
		await expect(page.locator("#p1-score")).toContainText("Score:");
		await expect(page.locator("#p2-score")).toContainText("Score:");
	});

	test("turns left counters are present", async ({ page }) => {
		await expect(page.locator("#p1-turns")).toContainText("Turns left:");
		await expect(page.locator("#p2-turns")).toContainText("Turns left:");
	});
});

test.describe("Weapon modal", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.getByRole("button", { name: /1 player/i }).click();
		await page.locator(".color-swatch").first().click();
		await page.getByRole("button", { name: /start game/i }).click();
	});

	test("weapon modal opens and lists weapons", async ({ page }) => {
		await page.locator("#weapon-select-btn").click();
		const modal = page.locator("#weapon-modal");
		await expect(modal).toBeVisible();
		const items = modal.locator("button, .weapon-item, li");
		await expect(items.first()).toBeVisible();
	});

	test("selecting a weapon updates the weapon button label", async ({
		page,
	}) => {
		await page.locator("#weapon-select-btn").click();
		const modal = page.locator("#weapon-modal");
		// Weapon cards are .weapon-card divs (not the Close button)
		const firstCard = modal.locator(".weapon-card").first();
		const weaponName = await firstCard.locator("h3").textContent();
		await firstCard.click();
		await expect(page.locator("#weapon-select-btn")).toContainText(
			weaponName?.trim() ?? "",
		);
	});
});

test.describe("2P game", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.getByRole("button", { name: /2 player/i }).click();
		// Pick different colors for P1 and P2
		const rows = page.locator(".color-swatches");
		await rows.nth(0).locator(".color-swatch").nth(0).click();
		await rows.nth(1).locator(".color-swatch").nth(2).click();
		await page.getByRole("button", { name: /start game/i }).click();
	});

	test("turn indicator shows Player 1 first", async ({ page }) => {
		await expect(page.locator("#turn-indicator")).toContainText(/player 1/i);
	});

	test("P2 label is not 'CPU' in 2P mode", async ({ page }) => {
		await expect(page.locator("#p2-name")).not.toContainText(/cpu/i);
	});

	test("turn passes to Player 2 after firing", async ({ page }) => {
		await page.locator("#angle-slider").fill("90");
		await page.locator("#angle-slider").dispatchEvent("input");
		await page.locator("#fire-btn").click();
		await expect(page.locator("#turn-indicator")).toContainText(/player 2/i, {
			timeout: 10_000,
		});
	});
});

test.describe("Wind toggle", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.getByRole("button", { name: /1 player/i }).click();
		await page.locator(".color-swatch").first().click();
		await page.getByRole("button", { name: /start game/i }).click();
	});

	test("wind indicator is visible", async ({ page }) => {
		await expect(page.locator("#wind-indicator")).toBeVisible();
	});

	test("wind toggle checkbox is checked by default", async ({ page }) => {
		await expect(page.locator("#wind-toggle")).toBeChecked();
	});

	test("unchecking wind toggle disables wind", async ({ page }) => {
		await page.locator("#wind-toggle").uncheck();
		await expect(page.locator("#wind-val")).toHaveText("0");
	});
});

test.describe("Restart flow", () => {
	test("restart button returns to start screen", async ({ page }) => {
		await page.goto("/");
		await page.getByRole("button", { name: /1 player/i }).click();
		await page.locator(".color-swatch").first().click();
		await page.getByRole("button", { name: /start game/i }).click();
		await expect(page.locator("#fire-btn")).toBeVisible();

		// Force game-over screen visible via JS to test the restart button
		await page.evaluate(() => {
			document.getElementById("game-over-screen").classList.remove("hidden");
			document.getElementById("winner-text").innerText = "Test Win";
		});
		await page.locator("#restart-btn").click();
		await expect(page.locator("#start-screen")).toBeVisible();
	});
});
