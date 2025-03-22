// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Admin Orders Page", () => {
  let page;
  const adminEmail = "admin@test.sg";

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    await page.goto("http://localhost:3000/login");
    await loginAsAdmin(page, adminEmail);

    await page.goto("http://localhost:3000/dashboard/admin/orders");
  });

  test("should display 'All Orders' title", async () => {
    const title = page.getByRole("heading", { name: "All Orders" });
    await expect(title).toBeVisible();
  });
});

async function loginAsAdmin(page, email) {
  await page.getByRole("textbox", { name: "Enter Your Email" }).fill(email);
  await page.getByRole("textbox", { name: "Enter Your Password" }).fill(email);

  await page.getByRole("button", { name: "LOGIN" }).click();
  await page.waitForURL("http://localhost:3000/");
}
