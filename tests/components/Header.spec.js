// @ts-check
const { test, expect } = require("@playwright/test");

// WIP
test.describe("Header Component UI Tests", () => {

  test("should display brand logo and nav links", async ({ page }) => {
    await page.goto("http://localhost:3000");

    const brandLink = page.locator(".navbar-brand");
    await expect(brandLink).toHaveText("🛒 Virtual Vault");
    await expect(brandLink).toHaveAttribute("href", "/");

    const homeLink = page.getByRole("link", {name: /home/i})
    await expect(homeLink).toHaveText("Home");
    await expect(homeLink).toHaveAttribute("href", "/");

    const categoriesLink = page.getByRole("link", {name: /categories/i})
    await expect(categoriesLink).toHaveText("Categories");
    await expect(categoriesLink).toHaveAttribute("href", "/categories");

    const cartLink = page.getByRole("link", {name: /cart/i})
    await expect(cartLink).toHaveText("Cart");
    await expect(cartLink).toHaveAttribute("href", "/cart");
  });
});
