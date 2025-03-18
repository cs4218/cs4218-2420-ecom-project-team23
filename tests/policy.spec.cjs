// @ts-check
const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:3000/");
});

test("should navigate to policy page on click", async ({ page }) => {
  await page.getByRole("link", { name: "Privacy Policy" }).click();
  await page.waitForURL("http://localhost:3000/policy");

  const policyPageHeader = page.getByRole("heading", {
    name: "PRIVACY POLICY",
  });
  const policyPageImg = page.getByRole("img", { name: "policy" });

  await expect(policyPageHeader).toBeVisible();
  await expect(policyPageImg).toBeVisible();
});
