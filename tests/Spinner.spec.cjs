import { test, expect } from "@playwright/test";

test.describe("Spinner Component Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard/user");
  });

  test("should display initial countdown and spinner", async ({ page }) => {
    await expect(page.locator("h1")).toContainText(
      "redirecting to you in 3 second(s)"
    );
    await expect(page.locator(".spinner-border")).toBeVisible();
    await expect(page.locator(".visually-hidden")).toHaveText("Loading...");
  });

  test("should update countdown every second", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("3 second(s)");

    await page.waitForTimeout(1100);
    await expect(page.locator("h1")).toContainText("2 second(s)");

    await page.waitForTimeout(1100);
    await expect(page.locator("h1")).toContainText("1 second(s)");
  });

  test("should redirect after countdown completion", async ({ page }) => {
    await page.waitForTimeout(4000);

    expect(page.url()).toContain("/login");
  });
});
