// @ts-check
const { test, expect } = require("@playwright/test");

async function loginUser(page) {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email").fill("cs4218@test.com");
  await page.getByPlaceholder("Enter Your Password").fill("cs4218@test.com");
  await page.getByRole("button", { name: "LOGIN" }).click();
  await page.waitForURL("http://localhost:3000/");
}

test.describe("UserMenu Component UI Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);

    await page.goto("http://localhost:3000/dashboard/user", {waitUntil: "domcontentloaded"});
  });

  test("should render default navigation for user", async ({ page }) => {
    const userMenu = page.locator(".list-group");
    await expect(userMenu).toBeVisible();

    await expect(userMenu.locator("h4")).toHaveText("Dashboard");

    const userMenuItems = userMenu.locator(".list-group-item-action");
    await expect(userMenuItems).toHaveCount(2);
  });

  test("should have the correct links", async ({ page }) => {
    const profileLink = page.getByRole("link", { name: "Profile" });
    await expect(profileLink).toBeVisible();
    await expect(profileLink).toHaveAttribute(
      "href",
      "/dashboard/user/profile"
    );

    const ordersLink = page.getByRole("link", { name: "Orders" });
    await expect(ordersLink).toBeVisible();
    await expect(ordersLink).toHaveAttribute("href", "/dashboard/user/orders");
  });

  test("links goes to the correct page", async ({ page }) => {
    const profileLink = page.getByRole("link", { name: "Profile" });
    await profileLink.click();
    await expect(page).toHaveURL(
      `http://localhost:3000/dashboard/user/profile`
    );
    await page.goBack();

    const ordersLink = page.getByRole("link", { name: "Orders" });
    await ordersLink.click();
    await expect(page).toHaveURL(`http://localhost:3000/dashboard/user/orders`);
  });
});
