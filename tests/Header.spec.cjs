// @ts-check
const { test, expect } = require("@playwright/test");

async function loginUser(page) {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email").fill("cs4218@test.com");
  await page.getByPlaceholder("Enter Your Password").fill("cs4218@test.com");
  await page.getByRole("button", { name: "LOGIN" }).click();
  await page.waitForURL("http://localhost:3000/");
}

async function loginAdmin(page) {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email").fill("admin@admin.com");
  await page.getByPlaceholder("Enter Your Password").fill("admin");
  await page.getByRole("button", { name: "LOGIN" }).click();
  await page.waitForURL("http://localhost:3000/");
}

test.describe("Header Component UI Tests", () => {
  const customCategories = [
    { name: "Electronics", slug: "electronics" },
    { name: "Books", slug: "books" },
    { name: "Clothes", slug: "clothes" },
  ];

  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/category/get-category", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ category: customCategories }),
      });
    });
    await page.goto("http://localhost:3000", {waitUntil: "domcontentloaded"});
  });

  test("should display brand logo and nav links", async ({ page }) => {
    const brandLink = page.locator(".navbar-brand");
    await expect(brandLink).toHaveText("🛒 Virtual Vault");
    await expect(brandLink).toHaveAttribute("href", "/");

    const homeLink = page.getByRole("link", { name: /home/i });
    await expect(homeLink).toHaveText("Home");
    await expect(homeLink).toHaveAttribute("href", "/");

    const categoriesLink = page.getByRole("link", { name: /categories/i });
    await expect(categoriesLink).toHaveText("Categories");
    await expect(categoriesLink).toHaveAttribute("href", "/categories");

    const cartLink = page.getByRole("link", { name: /cart/i });
    await expect(cartLink).toHaveText("Cart");
    await expect(cartLink).toHaveAttribute("href", "/cart");
  });

  test("should show Register and Login links when user is not authenticated", async ({
    page,
  }) => {
    const registerLink = page.getByRole("link", { name: /register/i });
    await expect(registerLink).toHaveText("Register");
    await expect(registerLink).toHaveAttribute("href", "/register");

    const loginLink = page.getByRole("link", { name: /login/i });
    await expect(loginLink).toHaveText("Login");
    await expect(loginLink).toHaveAttribute("href", "/login");
  });

  test("should show user dropdown when user is authenticated", async ({
    page,
  }) => {
    await loginUser(page);

    const userNameDropdown = page.locator(".nav-item.dropdown").nth(1);

    const userDropdown = userNameDropdown.locator(".nav-link.dropdown-toggle");
    await userDropdown.click();
    await expect(userDropdown).toBeVisible();
    await expect(userDropdown).toHaveText("CS 4218 Test Account");

    await userDropdown.click();

    const dashboardLink = userNameDropdown.locator(".dropdown-item").nth(0);
    await expect(dashboardLink).toHaveText("Dashboard");
    await expect(dashboardLink).toHaveAttribute("href", "/dashboard/user");

    const logoutLink = userNameDropdown.locator(".dropdown-item").nth(1);
    await expect(logoutLink).toHaveText("Logout");
    await expect(logoutLink).toHaveAttribute("href", "/login");
  });

  test("should show admin dashboard", async ({ page }) => {
    await loginAdmin(page);

    const userNameDropdown = page.locator(".nav-item.dropdown").nth(1);
    await userNameDropdown.locator(".nav-link.dropdown-toggle").click();

    const dashboardLink = userNameDropdown.locator(".dropdown-item").nth(0);
    await expect(dashboardLink).toHaveText("Dashboard");
    await expect(dashboardLink).toHaveAttribute("href", "/dashboard/admin");
  });

  test("should navigate to home page", async ({ page }) => {
    // clicks brand logo
    await page.goto("http://localhost:3000/about");
    await page.locator(".navbar-brand").click();
    await expect(page).toHaveURL("http://localhost:3000/");

    // clicks home
    await page.goto("http://localhost:3000/about");
    const homeLink = page.locator(".nav-item").first();

    await expect(homeLink).toHaveText("Home");

    await homeLink.click();
    await expect(page).toHaveURL("http://localhost:3000/");
  });

  test("should display categories with all categories", async ({ page }) => {
    const categoriesLink = page.locator(".nav-item.dropdown").nth(0);
    await categoriesLink.locator(".nav-link.dropdown-toggle").click();

    const allCategoriesLink = categoriesLink.locator(".dropdown-item").nth(0);
    await expect(allCategoriesLink).toBeVisible();
    await expect(allCategoriesLink).toHaveText("All Categories");
    await expect(allCategoriesLink).toHaveAttribute("href", "/categories");

    for (let i = 0; i < customCategories.length; i++) {
      const category = customCategories[i];
      const categoryLink = categoriesLink.locator(".dropdown-item").nth(i + 1);
      await expect(categoryLink).toBeVisible();
      await expect(categoryLink).toHaveText(category.name);
      await expect(categoryLink).toHaveAttribute(
        "href",
        `/category/${category.slug}`
      );
    }
  });

  test("should show correct cart badge count", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem(
        "cart",
        JSON.stringify([
          { id: 1, name: "item" },
          { id: 2, name: "item2" },
        ])
      );
    });
    await page.reload({waitUntil: "domcontentloaded"});

    const badgeCount = page.locator(".ant-badge-count");
    await expect(badgeCount).toBeVisible();
    await expect(badgeCount).toHaveText("2");
  });

  test("should logout user", async ({ page }) => {
    await loginUser(page);

    const userNameDropdown = page.locator(".nav-item.dropdown").nth(1);
    await userNameDropdown.locator(".nav-link.dropdown-toggle").click();

    const logoutLink = userNameDropdown.locator(".dropdown-item").nth(1);
    await logoutLink.click();

    await expect(page).toHaveURL("http://localhost:3000/login");
  });
});
