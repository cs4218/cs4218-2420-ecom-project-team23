// @ts-check
const { test, expect } = require("@playwright/test");
const fetch = require("node-fetch");

test.describe.configure({ mode: "serial" });

test.describe("Product Details Page", () => {
  const adminEmail = "admin@test.sg";
  const adminPassword = "admin@test.sg";
  const productName = `PlaywrightDetailProduct-${Date.now()}`;
  let productSlug = null;
  let createdProductId = null;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login as admin
    await page.goto("http://localhost:3000/login");
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill(adminEmail);
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill(adminPassword);
    await page.getByRole("button", { name: "LOGIN" }).click();
    await page.waitForURL("http://localhost:3000/");

    // Create product
    await page.goto("http://localhost:3000/dashboard/admin/create-product");

    await page.locator(".ant-select-selector").first().click();
    await page.locator(".ant-select-item-option").first().click();

    await page.getByPlaceholder("write a name").fill(productName);
    await page
      .getByPlaceholder("write a description")
      .fill("Playwright detail product");
    await page.getByPlaceholder("write a Price").fill("123");
    await page.getByPlaceholder("write a quantity").fill("5");

    await page.locator(".ant-select-selector").nth(1).click();
    await page.locator(".ant-select-item-option", { hasText: "Yes" }).click();

    await page.getByRole("button", { name: "CREATE PRODUCT" }).click();
    await page.waitForTimeout(1000);
    await context.close();

    // Get product slug and id
    const response = await fetch(
      "http://localhost:3000/api/v1/product/get-product"
    );
    const data = await response.json();
    const product = data.products.find((p) => p.name === productName);
    if (product) {
      productSlug = product.slug;
      createdProductId = product._id;
    }
  });

  test("should display product details correctly", async ({ page }) => {
    await page.goto(`http://localhost:3000/product/${productSlug}`);

    await expect(page.getByText("Product Details")).toBeVisible();
    await expect(
      page.getByText(new RegExp(`Name\\s*:\\s*${productName}`, "i"))
    ).toBeVisible();
    await expect(
      page.getByText("Description : Playwright detail product")
    ).toBeVisible();
    await expect(page.getByText(/\$123.00/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "ADD TO CART" })
    ).toBeVisible();
  });

  test.afterAll(async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/v1/product/get-product"
      );
      const data = await response.json();
      const match = data.products.find((p) => p.name === productName);

      if (match) {
        const deleteResponse = await fetch(
          `http://localhost:3000/api/v1/product/delete-product/${match._id}`,
          {
            method: "DELETE",
          }
        );

        const result = await deleteResponse.json();

        if (!deleteResponse.ok) {
          throw new Error(
            `Failed to delete product. Status: ${deleteResponse.status}`
          );
        }
      } else {
        console.warn("Product not found for cleanup.");
      }
    } catch (e) {
      console.error("Cleanup failed:", e.message);
    }
  });
});
