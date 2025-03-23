// @ts-check
const { test, expect } = require("@playwright/test");

const loginUser = async (page) => {
  await page.goto("http://localhost:3000", {waitUntil: "domcontentloaded"});
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

test.describe("Private Route Component UI Tests", () => {
  test("should have the spinner when not logged in", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard", {waitUntil: "domcontentloaded"});

    await page.waitForTimeout(1000);

    await expect(page.locator(".spinner-border .visually-hidden")).toHaveText("Loading...")
  });

  test("should redirect when user is logged in", async ({ page }) => {
    await loginUser(page);
    await page.goto("http://localhost:3000/dashboard/user", {waitUntil: "domcontentloaded"}); // path goes through private then dashboard

    await expect(page).toHaveURL("http://localhost:3000/dashboard/user")
  });
});
