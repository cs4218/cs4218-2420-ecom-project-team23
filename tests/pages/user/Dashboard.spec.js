// @ts-check
const { test, expect } = require("@playwright/test");

const loginUser = async (page) => {
  await page.goto("http://localhost:3000");
  await page.getByRole("link", { name: "Login" }).click();
  await page
    .getByRole("textbox", { name: /Enter Your Email/i })
    .fill("cs4218@test.com");
  await page
    .getByRole("textbox", { name: /Enter Your Password/i })
    .fill("cs4218@test.com");
  await page.getByRole("button", { name: "LOGIN" }).click();

  await expect(page.getByText(/login successfully/i)).toBeVisible();
};

test.describe("User Dashboard Component UI Tests", () => {
  const userInformation = {
    name: "CS 4218 Test Account",
    email: "cs4218@test.com",
    address: "1 Computing Drive"
  }

  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await page.goto("http://localhost:3000/dashboard/user");
  });

  test("should have correct title", async ({ page }) => {
    await expect(page).toHaveTitle("Dashboard - Ecommerce App");
  });

  test("user information should be correcly present", async ({ page }) => {
    const dashboardDiv = page.locator(".container-flui.m-3.p-3.dashboard");

    const userName = dashboardDiv.locator(".card h3").nth(0);
    const userEmail = dashboardDiv.locator(".card h3").nth(1);
    const userAddress = dashboardDiv.locator(".card h3").nth(2);

    await expect(userName).toBeVisible();
    await expect(userName).toHaveText(userInformation.name);

    await expect(userEmail).toBeVisible();
    await expect(userEmail).toHaveText(userInformation.email)

    await expect(userAddress).toBeVisible();
    await expect(userAddress).toHaveText(userInformation.address)
  });

  test("should handle session expiry", async ({ page }) => {
    await page.evaluate(() => localStorage.clear());

    await page.reload();

    await expect(page.locator(".visually-hidden")).toHaveText("Loading...")

    await page.waitForTimeout(3000)

    await expect(page).toHaveURL("http://localhost:3000/");
  });
});
