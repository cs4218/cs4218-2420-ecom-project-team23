// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Pagenotfound Component UI Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/errorpage");
  });

  test("should have correct title", async ({ page }) => {
    await expect(page).toHaveTitle("go back- page not found");
  });

  test("Pagenotfound page contents are correctly loaded", async ({ page }) => {
    const pnfTitle = page.locator('.pnf-title');
    const pnfHeading= page.locator('.pnf-heading');


    await expect(pnfTitle).toBeVisible();
    await expect(pnfTitle).toHaveText("404");

    await expect(pnfHeading).toBeVisible();
    await expect(pnfHeading).toHaveText("Oops ! Page Not Found");
  });

  test("Pagenotfound redirects correctly", async ({ page }) => {
    const pnfLink = page.locator('.pnf-btn');

    pnfLink.click()
    
    await expect(pnfLink).toBeVisible();
    await expect(pnfLink).toHaveAttribute("href", "/");
    await expect(page).toHaveURL(`http://localhost:3000`)
  });
});
