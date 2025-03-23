// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Layout Component UI Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000", {waitUntil: "domcontentloaded"});
  });

  test("should render basic layout structure", async ({ page }) => {
    await expect(page.locator("nav.navbar")).toBeVisible();

    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();

    await expect(page.locator(".footer")).toBeVisible();
  });

  test("should render meta tags correctly", async ({ page }) => {
    await expect(page).toHaveTitle("ALL Products - Best offers ");

    await expect(
      page.locator("meta[name='description']").nth(1)
    ).toHaveAttribute("content", "mern stack project");
    await expect(page.locator("meta[name='keywords']")).toHaveAttribute(
      "content",
      "mern,react,node,mongodb"
    );
    await expect(page.locator("meta[name='author']")).toHaveAttribute(
      "content",
      "Techinfoyt"
    );
  });

  test("should display toast", async ({ page }) => {
    const addToCartButton = page.getByRole("button", { name: /add to cart/i }).first();

    await addToCartButton.click();

    await expect(page.getByText(/item added to cart/i)).toBeVisible();
  });
});
