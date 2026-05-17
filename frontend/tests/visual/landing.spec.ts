import { expect, test } from "@playwright/test";

test("landing page visual baseline", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("landing-full.png", { fullPage: true, maxDiffPixelRatio: 0.03 });
});

test("landing hero visual baseline", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const hero = page.locator(".hero");
  await expect(hero).toHaveScreenshot("landing-hero.png", { maxDiffPixelRatio: 0.03 });
});
