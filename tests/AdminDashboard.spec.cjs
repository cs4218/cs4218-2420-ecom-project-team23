// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Admin Dashboard", () => {
  let page;
  const adminEmail = "admin@test.sg";

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    await page.goto("http://localhost:3000/login");
    await loginAsAdmin(page, adminEmail);

    await page.goto("http://localhost:3000/dashboard/admin");
  });

  test("should display admin details correctly", async () => {
    const adminName = page.getByRole("heading", { name: /^Admin Name/ });
    const adminEmailElement = page.getByRole("heading", {
      name: /^Admin Email/,
    });
    const adminContact = page.getByRole("heading", { name: /^Admin Contact/ });

    await expect(adminName).toBeVisible();
    await expect(adminEmailElement).toBeVisible();
    await expect(adminContact).toBeVisible();

    const displayedEmail = await adminEmailElement.innerText();
    expect(displayedEmail).toContain(adminEmail);
  });

  test("should show the admin menu", async () => {
    const adminMenu = page.locator(".col-md-3");
    await expect(adminMenu).toBeVisible();
  });

  test("should display the admin card", async () => {
    const adminCard = page.locator(".card.w-75.p-3");
    await expect(adminCard).toBeVisible();
  });
});

async function loginAsAdmin(page, email) {
  await page.getByRole("textbox", { name: "Enter Your Email" }).fill(email);
  await page.getByRole("textbox", { name: "Enter Your Password" }).fill(email);

  await page.getByRole("button", { name: "LOGIN" }).click();
  await page.waitForURL("http://localhost:3000/");
}
