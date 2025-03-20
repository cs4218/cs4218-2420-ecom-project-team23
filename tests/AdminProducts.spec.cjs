// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Admin Create Product Page", () => {
  let page;
  const adminEmail = "admin@test.sg";

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    await page.goto("http://localhost:3000/login");
    await loginAsAdmin(page, adminEmail);
    await page.waitForTimeout(5000);
    await page.goto("http://localhost:3000/dashboard/admin/create-product");
  });

  test("should create a new product successfully", async () => {
    const productName = `TestProduct-${Date.now()}`;
    const productDescription = "This is a test description.";
    const productPrice = "99.99";
    const productQuantity = "10";

    // ✅ Select category dropdown
    const categoryDropdown = page.locator(".ant-select-selector").nth(0);
    await categoryDropdown.click();

    // ✅ Wait for dropdown options to appear and select the first option
    const dropdown = page.locator(".ant-select-dropdown");
    await dropdown.waitFor({ state: "visible" });

    const firstOption = dropdown.locator(".ant-select-item-option").first();
    await firstOption.waitFor({ state: "visible" });
    await firstOption.click();

    // ✅ Fill in product details
    await page.getByPlaceholder("write a name").fill(productName);
    await page.getByPlaceholder("write a description").fill(productDescription);
    await page.getByPlaceholder("write a Price").fill(productPrice);
    await page.getByPlaceholder("write a quantity").fill(productQuantity);

    // ✅ Select shipping option
    const shippingDropdown = page.locator(".ant-select-selector").nth(1);
    await shippingDropdown.click();
    await page.locator(".ant-select-item-option", { hasText: "Yes" }).click();

    // ✅ Submit form
    await page.getByRole("button", { name: "CREATE PRODUCT" }).click();

    // ✅ Expect success toast
    await expect(page.getByText("Product Created Successfully")).toBeVisible();

    // ✅ Navigate to products list
    await page.goto("http://localhost:3000/dashboard/admin/products");

    // ✅ Verify product exists (Scoped to last added product)
    const lastProductCard = page.locator(".card").first();
    await expect(lastProductCard.locator(".card-title")).toHaveText(
      productName
    );
  });
});

async function loginAsAdmin(page, email) {
  await page.getByRole("textbox", { name: "Enter Your Email" }).fill(email);
  await page.getByRole("textbox", { name: "Enter Your Password" }).fill(email);
  await page.getByRole("button", { name: "LOGIN" }).click();
  await page.waitForURL("http://localhost:3000/");
}
