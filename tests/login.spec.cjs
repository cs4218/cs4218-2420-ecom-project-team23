// @ts-check
const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:3000/login");
});

test.describe("Routing and Logging In", () => {
  test("should login and navigate to homepage on valid user", async ({
    page,
  }) => {
    await fillDefaultData(page);

    await page.getByRole("button", { name: "LOGIN" }).click();
    await page.waitForURL("http://localhost:3000/");

    const loginUserName = page.getByRole("button", { name: "John Doe" });
    await expect(loginUserName).toBeVisible();
  });

  test("should navigate to login page on logout", async ({ page }) => {
    await fillDefaultData(page);

    await page.getByRole("button", { name: "LOGIN" }).click();
    await page.waitForURL("http://localhost:3000/");
    await page.getByRole("button", { name: "John Doe" }).click();
    await page.getByRole("link", { name: "Logout" }).click();
    await page.waitForURL("http://localhost:3000/login");

    const loginTitle = page.getByRole("heading", { name: "LOGIN FORM" });
    await expect(loginTitle).toBeVisible();
  });

  test("should navigate to Forgot Password Page", async ({ page }) => {
    await page.getByRole("button", { name: "Forgot Password" }).click();

    await page.waitForURL("http://localhost:3000/forgot-password");

    const forgotPasswordPage = page.getByRole("heading", {
      name: "Forgot Password Function is coming soon!",
    });
    await expect(forgotPasswordPage).toBeVisible();
  });
});

test.describe("should trigger toaster on invalid inputs", () => {
  test("should trigger toaster on invalid email", async ({ page }) => {
    await fillDefaultData(page);

    await page.getByRole("textbox", { name: "Enter Your Email" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill("example@gmail.c");

    await page.getByRole("button", { name: "LOGIN" }).click();

    const toaster = await page.waitForSelector(
      "text=Invalid email or password",
      { state: "visible", timeout: 5000 }
    );
    expect(await toaster.isVisible()).toBeTruthy();
  });

  test("should trigger toaster on invalid password", async ({ page }) => {
    await fillDefaultData(page);

    await page.getByRole("textbox", { name: "Enter Your Password" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill("wrongPassword");

    await page.getByRole("button", { name: "LOGIN" }).click();

    const toaster = await page.waitForSelector(
      "text=Invalid email or password",
      { state: "visible", timeout: 5000 }
    );
    expect(await toaster.isVisible()).toBeTruthy();
  });
});

async function fillDefaultData(page) {
  await page.getByRole("textbox", { name: "Enter Your Email" }).click();
  await page
    .getByRole("textbox", { name: "Enter Your Email" })
    .fill("example@gmail.com");
  await page.getByRole("textbox", { name: "Enter Your Password" }).click();
  await page
    .getByRole("textbox", { name: "Enter Your Password" })
    .fill("example");
}
