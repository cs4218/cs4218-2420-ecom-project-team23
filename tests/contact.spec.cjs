// @ts-check
const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:3000/");
});

test("should navigate to contact on click", async ({ page }) => {
  await page.getByRole("link", { name: "Contact" }).click();
  await page.waitForURL("http://localhost:3000/contact");

  const contactPageHeader = page.getByRole("heading", { name: "CONTACT US" });
  const contactPageImg = page.getByRole("img", { name: "contact" });
  await expect(contactPageHeader).toBeVisible();
  await expect(contactPageImg).toBeVisible();
});
