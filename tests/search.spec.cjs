// @ts-check
const { test, expect } = require("@playwright/test");
const {
  loginAsAdmin,
  createProduct,
  deleteProduct,
} = require("../utilities/testUtils");

test.describe.configure({ mode: "serial" });

test.describe("Search Page", () => {
  const productName = `PlaywrightSearchProduct-${Date.now()}`;
  let createdProduct;
  let adminToken;

  test.beforeAll(async () => {
    adminToken = await loginAsAdmin();
    createdProduct = await createProduct({
      name: productName,
      token: adminToken,
    });
    if (!createdProduct?.id) throw new Error("Product creation failed");
  });

  test("should show results when searching for created product", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000", {waitUntil: "domcontentloaded"});
    await page.getByPlaceholder("Search").fill(productName);
    await page.getByRole("button", { name: "Search" }).click();
    await page.waitForURL("**/search");
    await expect(page.getByText("Search Results")).toBeVisible();
    await expect(page.getByText(/Found 1/)).toBeVisible();
    await expect(page.getByText(productName)).toBeVisible();
  });

  test("should show no products found when there are no results", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000", {waitUntil: "domcontentloaded"});
    await page.getByPlaceholder("Search").fill("nonexistent-product-keyword");
    await page.getByRole("button", { name: "Search" }).click();
    await page.waitForURL("**/search");
    await expect(page.getByText("Search Results")).toBeVisible();
    await expect(page.getByText("No Products Found")).toBeVisible();
  });

  test.afterAll(async () => {
    if (createdProduct?.id) {
      await deleteProduct(createdProduct.id);
    }
  });
});
