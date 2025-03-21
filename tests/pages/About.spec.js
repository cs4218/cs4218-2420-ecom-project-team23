// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("About Component UI Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/about");
  });

  test("should have correct title", async ({ page }) => {
    await expect(page).toHaveTitle("About us - Ecommerce app");
  });

  test("about page contents are correctly loaded", async ({ page }) => {
    const image = page.locator('img[alt=contactus]');
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute("src", "/images/about.jpeg")


    const paragraph = page.locator("row.contactus"); // should get the about page div

    await expect(paragraph).toBeVisible();
    await expect(paragraph).not.toBeEmpty();
  });
});
