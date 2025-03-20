// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Admin Product Management", () => {
  let page;
  const adminEmail = "admin@test.sg";
  let productName;
  let updatedProductName;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    await page.goto("http://localhost:3000/login");
    await loginAsAdmin(page, adminEmail);
  });

  test("should create, edit, and delete a product successfully", async () => {
    productName = `TestProduct-${Date.now()}`;
    updatedProductName = `Updated-${productName}`;
    const productDescription = "This is a test description.";
    const productPrice = "99.99";
    const productQuantity = "10";

    await page.goto("http://localhost:3000/dashboard/admin/create-product");
    await page.waitForSelector(".form-select", { state: "visible" });

    const categoryDropdown = page.locator(".ant-select-selector").nth(0);
    await categoryDropdown.click();
    await page.waitForSelector(".ant-select-dropdown", { state: "visible" });

    const firstOption = page.locator(".ant-select-item-option").first();
    await firstOption.waitFor({ state: "visible" });
    await firstOption.click();

    await page.getByPlaceholder("write a name").fill(productName);
    await page.getByPlaceholder("write a description").fill(productDescription);
    await page.getByPlaceholder("write a Price").fill(productPrice);
    await page.getByPlaceholder("write a quantity").fill(productQuantity);

    const shippingDropdown = page.locator(".ant-select-selector").nth(1);
    await shippingDropdown.click();
    await page.locator(".ant-select-item-option", { hasText: "Yes" }).click();

    await page.getByRole("button", { name: "CREATE PRODUCT" }).click();

    await page.goto("http://localhost:3000/dashboard/admin/products");
    await page.waitForSelector(".card-title", { state: "visible" });
    const lastProduct = page.locator(".card-title", { hasText: productName });
    await expect(lastProduct).toBeVisible();

    await lastProduct.click();
    await page.waitForSelector("input[placeholder='write a name']");

    await page.getByPlaceholder("write a name").fill(updatedProductName);
    await page
      .getByPlaceholder("write a description")
      .fill("Updated description.");
    await page.getByPlaceholder("write a Price").fill("79.99");
    await page.getByPlaceholder("write a quantity").fill("20");

    await page.getByRole("button", { name: "UPDATE PRODUCT" }).click();

    await page.goto("http://localhost:3000/dashboard/admin/products");
    await page.waitForSelector(".card-title", { state: "visible" });

    const updatedProduct = page.locator(".card-title", {
      hasText: updatedProductName,
    });
    await expect(updatedProduct).toBeVisible();

    await updatedProduct.click();
    await page.waitForSelector("button:has-text('DELETE PRODUCT')", {
      state: "visible",
    });

    await page.evaluate(() => {
      window.prompt = () => "yes";
    });

    await page.getByRole("button", { name: "DELETE PRODUCT" }).click();

    await page.waitForTimeout(3000);

    await page.goto("http://localhost:3000/dashboard/admin/products");
    await page.waitForSelector(".card-title", { state: "visible" });

    await expect(
      page.locator(".card-title", { hasText: updatedProductName })
    ).toHaveCount(0);
  });
});

async function loginAsAdmin(page, email) {
  await page.getByRole("textbox", { name: "Enter Your Email" }).fill(email);
  await page.getByRole("textbox", { name: "Enter Your Password" }).fill(email);
  await page.getByRole("button", { name: "LOGIN" }).click();
  await page.waitForURL("http://localhost:3000/");
}
