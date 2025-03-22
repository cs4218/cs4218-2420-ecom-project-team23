// @ts-check
const { test, expect } = require("@playwright/test");
const fetch = require("node-fetch");

test.describe.configure({ mode: "serial" });

test.describe("Category Product Page", () => {
  const adminEmail = "admin@test.sg";
  const adminPassword = "admin@test.sg";
  const productName = `PlaywrightCategoryProduct-${Date.now()}`;
  const categorySlug = "electronics";

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login as admin
    await page.goto("http://localhost:3000/login");
    await page.getByPlaceholder("Enter Your Email").fill(adminEmail);
    await page.getByPlaceholder("Enter Your Password").fill(adminPassword);
    await page.getByRole("button", { name: "LOGIN" }).click();
    await page.waitForURL("http://localhost:3000/");

    // Create product
    await page.goto("http://localhost:3000/dashboard/admin/create-product");

    await page.locator(".ant-select-selector").first().click();
    await page
      .locator(".ant-select-item-option", { hasText: "Electronics" })
      .click();

    await page.getByPlaceholder("write a name").fill(productName);
    await page
      .getByPlaceholder("write a description")
      .fill("Category page test");
    await page.getByPlaceholder("write a Price").fill("99");
    await page.getByPlaceholder("write a quantity").fill("4");

    await page.locator(".ant-select-selector").nth(1).click();
    await page.locator(".ant-select-item-option", { hasText: "Yes" }).click();

    await page.getByRole("button", { name: "CREATE PRODUCT" }).click();
    await page.waitForTimeout(1000);

    await context.close();
  });

  test("should display products under category", async ({ page }) => {
    await page.goto(`http://localhost:3000/category/${categorySlug}`);

    await expect(page.getByText(`Category - Electronics`)).toBeVisible();
    await expect(page.getByText(productName)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "More Details" }).first()
    ).toBeVisible();
  });

  test("should navigate to product details from category page", async ({
    page,
  }) => {
    await page.goto(`http://localhost:3000/category/${categorySlug}`);

    await page.getByRole("button", { name: "More Details" }).first().click();
    await expect(page).toHaveURL(/\/product\//);
    await expect(page.getByText(productName)).toBeVisible();
  });

  test("should show 0 results for non-existent category", async ({ page }) => {
    const fakeCategorySlug = "unknown-category";

    await page.goto(`http://localhost:3000/category/${fakeCategorySlug}`);

    await expect(page.getByText("Category -")).toBeVisible();
    await expect(page.getByText("0 result found")).toBeVisible();
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
          { method: "DELETE" }
        );

        if (!deleteResponse.ok) {
          throw new Error(
            `Failed to delete product. Status: ${deleteResponse.status}`
          );
        }
      }
    } catch (e) {
      console.error("Cleanup failed:", e.message);
    }
  });
});
