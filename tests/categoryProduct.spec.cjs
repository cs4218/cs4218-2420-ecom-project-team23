// @ts-check
const { test, expect } = require("@playwright/test");
const {
  loginAsAdmin,
  createProduct,
  deleteProduct,
} = require("../utilities/testUtils");

test.describe.configure({ mode: "serial" });

test.describe("Category Product Page", () => {
  const productName = `PlaywrightCategoryProduct-${Date.now()}`;
  const categorySlug = "electronics";
  let createdProduct = null;
  let adminToken = null;

  test.beforeAll(async () => {
    adminToken = await loginAsAdmin();
    createdProduct = await createProduct({
      name: productName,
      description: "Category page test",
      price: 99,
      quantity: 4,
      shipping: 1,
      token: adminToken,
    });

    if (!createdProduct?.id) {
      throw new Error("Product creation failed");
    }
  });

  test("should display products under category", async ({ page }) => {
    await page.goto(`http://localhost:3000/category/${categorySlug}`);

    await expect(page.getByText(`Category - Electronics`)).toBeVisible();
    await expect(page.getByText(productName).first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: "More Details" }).first()
    ).toBeVisible();
  });

  test("should navigate to product details from category page", async ({
    page,
  }) => {
    await page.goto(`http://localhost:3000/category/${categorySlug}`);

    const productCard = page.locator(".card", { hasText: productName });
    await expect(productCard).toBeVisible();

    await productCard.getByRole("button", { name: "More Details" }).click();

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
    if (createdProduct?.id) {
      await deleteProduct(createdProduct.id);
    }
  });
});
