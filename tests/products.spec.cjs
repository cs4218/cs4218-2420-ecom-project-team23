// @ts-check
const { test, expect } = require("@playwright/test");
const {
  loginAsAdmin,
  createProduct,
  deleteProduct,
} = require("../utilities/testUtils");

test.describe.configure({ mode: "serial" });

test.describe("Product Details Page", () => {
  const productName = `PlaywrightDetailProduct-${Date.now()}`;
  let createdProduct = null;
  let adminToken = null;

  test.beforeAll(async () => {
    adminToken = await loginAsAdmin();

    createdProduct = await createProduct({
      name: productName,
      description: "Playwright detail product",
      price: 123,
      quantity: 5,
      shipping: 1,
      token: adminToken,
    });

    if (!createdProduct?.id || !createdProduct?.slug) {
      throw new Error("Product creation failed or slug missing");
    }
  });

  test("should display product details correctly", async ({ page }) => {
    await page.goto(`http://localhost:3000/product/${createdProduct.slug}`);

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
    if (createdProduct?.id) {
      await deleteProduct(createdProduct.id);
    }
  });
});
