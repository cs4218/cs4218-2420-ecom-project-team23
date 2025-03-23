// @ts-check
const { test, expect } = require("@playwright/test");
import { Prices } from "../client/src/components/Prices";

const mockProductPage1 = {
  products: [
    {
      _id: "1",
      name: "Product 1",
      slug: "product-1",
      description:
        "Product 1 is so awesome, buy this right now, buy buy buy! Pls buy bro, I need money",
      price: 69.69,
    },
    {
      _id: "2",
      name: "Product 2",
      slug: "Product-2",
      description: "Don't buy this, this sucks",
      price: 420.42,
    },
  ],
};

const mockProductPage2 = {
  products: [
    {
      _id: "3",
      name: "Product 3",
      slug: "product-3",
      description:
        "Product 3 is so awesome, buy this right now, buy buy buy! Pls buy bro, I need money",
      price: 1234,
    },
    {
      _id: "4",
      name: "Product 4",
      slug: "product-4",
      description: "Buy this, this is good",
      price: 100000,
    },
  ],
};

const mockCats = {
  success: true,
  category: [
    {
      _id: "1",
      name: "Cat 1",
      slug: "cat1",
    },
    {
      _id: "2",
      name: "Cat 2",
      slug: "cat2",
    },
  ],
};

const filteredProducts = {
  products: [
    {
      _id: "5",
      name: "Product 5",
      slug: "product-6",
      description:
        "Product 5 doesn't exist in the main arrays, but this is a test that these two shows up in the website",
      price: 1,
    },
    {
      _id: "6",
      name: "Product 6",
      slug: "product-6",
      description:
        "Product 6 doesn't exist in the main arrays, but this is a test that these two shows up in the website",
      price: 2,
    },
  ],
};

test.describe("About Component UI Tests with mocked API response", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/category/get-category", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockCats),
      });
    });

    await page.route("**/api/v1/product/product-list/1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockProductPage1),
      });
    });

    await page.route("**/api/v1/product/product-list/2", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockProductPage2),
      });
    });

    await page.route("**/api/v1/product/product-count", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ total: 4 }),
      });
    });

    await page.route("**/api/v1/product/product-filters", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(filteredProducts),
      });
    });

    await page.goto("http://localhost:3000");
  });

  test("should have banner image", async ({ page }) => {
    const bannerImage = page.locator(".banner-img");

    await expect(bannerImage).toBeVisible();
    await expect(bannerImage).toHaveAttribute("alt", "banner image");
  });

  test("should have filters name", async ({ page }) => {
    await expect(page.getByText("Filter By Category")).toBeVisible();
    await expect(page.getByText("Filter By Price")).toBeVisible();
    await expect(page.getByText("RESET FILTERS")).toBeVisible();
  });

  test("should have categories checkboxes", async ({ page }) => {
    const filters = page.locator(".filters");
    const checkboxes = filters.locator(".ant-checkbox-label");
    const allCheckboxes = await checkboxes.all();

    await expect(checkboxes).toHaveCount(2);

    for (const checkbox of allCheckboxes) {
      await expect(checkbox).toBeVisible();
    }

    await expect(checkboxes.nth(0)).toHaveText("Cat 1");
    await expect(checkboxes.nth(1)).toHaveText("Cat 2");
  });

  test("should have prices checkboxes", async ({ page }) => {
    const filters = page.locator(".filters");
    const radios = filters.locator(".ant-radio-label");
    const allRadios = await radios.all();

    await expect(radios).toHaveCount(6);
    for (const radio of allRadios) {
      await expect(radio).toBeVisible();
    }

    for (let i = 0; i < Prices.length; i++) {
      await expect(radios.nth(i)).toHaveText(Prices[i].name);
    }
  });

  test("should have products and each of their details", async ({ page }) => {
    await expect(page.getByText("All Products")).toBeVisible();

    const products = page.locator(".home-page .card");

    await expect(products).toHaveCount(2);

    await productLocatorTest(page, mockProductPage1.products);
  });

  test("should be able to show more products", async ({ page }) => {
    const showMoreButton = page.locator("button.loadmore");
    await expect(showMoreButton).toBeVisible();

    await showMoreButton.click();

    const products = page.locator(".home-page .card");
    await expect(products).toHaveCount(4);

    const allProducts = [
      ...mockProductPage1.products,
      ...mockProductPage2.products,
    ];

    await productLocatorTest(page, allProducts);
  });

  test("should allow filtering by category", async ({ page }) => {
    const filters = page.locator(".filters");
    const filteredCat = filters.getByRole("checkbox", { name: /cat 1/i });

    await filteredCat.check();

    const products = page.locator(".home-page .card");
    await expect(products).toHaveCount(2);

    await productLocatorTest(page, filteredProducts.products);
  });

  test("should allow filtering by price", async ({ page }) => {
    const filters = page.locator(".filters");
    const filteredCat = filters.getByRole("radio", { name: "$0 to 19" });

    await filteredCat.check();

    const products = page.locator(".home-page .card");
    await expect(products).toHaveCount(2);

    await productLocatorTest(page, filteredProducts.products);
  });

  test("should add product to cart", async ({ page }) => {
    const addToCartButton = page
      .getByRole("button", { name: /add to cart/i })
      .first();

    await addToCartButton.click();

    // checks for toaster message
    await expect(page.getByText(/item added to cart/i)).toBeVisible();

    const cart = JSON.parse(
      await page.evaluate(() => localStorage.getItem("cart"))
    );

    expect(cart.length).toBe(1);
    expect(cart[0].name).toBe("Product 1");
  });

  test("should navigate to product details", async ({ page }) => {
    const moreDetailsButton = page
      .getByRole("button", { name: /more details/i })
      .first();

    await moreDetailsButton.click();

    await expect(page).toHaveURL("http://localhost:3000/product/product-1");
  });

  test("should reset filters", async ({ page }) => {
    // apply filters
    const filters = page.locator(".filters");
    const filteredCat = filters
      .locator(".ant-checkbox-label")
      .getByText("Cat 1");

    await filteredCat.click();

    const filteredPrice = filters
      .locator(".ant-radio-label")
      .getByText("$0 to 19");

    await filteredPrice.click();

    // make sure filters are applied
    await productLocatorTest(page, filteredProducts.products);

    // reset filters
    await page.getByRole("button", { name: /reset filters/i }).click();

    // make sure filters are reset by checking for original products
    const products = page.locator(".home-page .card");
    await expect(products).toHaveCount(2);

    await productLocatorTest(page, mockProductPage1.products);
  });
});

test.describe("About Component UI Tests with actual API", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000", {waitUntil: "domcontentloaded"});
  });

  test("should have categories checkboxes", async ({ page }) => {
    await page.waitForSelector(".filters .ant-checkbox-label");

    const filters = page.locator(".filters");
    const checkboxes = filters.locator(".ant-checkbox-label");
    const allCheckboxes = await checkboxes.all();

    expect(await checkboxes.count()).toBeGreaterThan(0);

    for (const checkbox of allCheckboxes) {
      await expect(checkbox).toBeVisible();
    }
  });

  test("should have products and each of their details", async ({ page }) => {
    await page.waitForSelector(".home-page .card");

    const products = page.locator(".home-page .card");

    expect(await products.count()).toBeGreaterThan(0);

    await expect(products.nth(0).locator(".card-title").first()).toBeVisible();
  });

  test("should be able to show more products", async ({ page }) => {
    await page.waitForSelector(".home-page .card");

    const initialProducts = await page.locator(".home-page .card").count();
    const showMoreButton = page.locator("button.loadmore");

    await expect(showMoreButton).toBeVisible();
    await showMoreButton.click();

    await page.waitForResponse("**/api/v1/product/product-list/2");

    const products = await page.locator(".home-page .card").count();
    expect(products).toBeGreaterThan(initialProducts);
  });

  test("should allow filtering by category", async ({ page }) => {
    await page.waitForSelector(".filters .ant-checkbox-label");

    const filters = page.getByRole("checkbox");

    expect(await filters.count()).toBeGreaterThan(0);

    await filters.first().check();

    await page.waitForResponse("**/api/v1/product/product-filters");

    const products = page.locator(".home-page .card");
    for (let i = 0; i < await products.count(); i++) {
      await expect(products.nth(i)).toBeVisible();
    }
  });

  test("should allow filtering by price", async ({ page }) => {
    const filters = page.locator(".filters");
    const filteredCat = filters.getByRole("radio", { name: "$0 to 19" });

    await filteredCat.check();

    await page.waitForResponse("**/api/v1/product/product-filters");

    const products = page.locator(".home-page .card");

    for (let i = 0; i < await products.count(); i++) {
      await expect(products.nth(i)).toBeVisible();

      const productPrice = await products.nth(i).locator(".card-title.card-price").innerText();
      const price = parseFloat(productPrice.replace("$", ""));

      expect(price).toBeLessThanOrEqual(19);
      expect(price).toBeGreaterThanOrEqual(0);
    }
  });
});

async function productLocatorTest(page, productArray) {
  const products = page.locator(".home-page .card");

  for (let i = 0; i < productArray.length; i++) {
    const product = productArray[i];
    const productImage = products.nth(i).locator(".card-img-top");
    const productTitle = products.nth(i).locator(".card-title").first();
    const productPrice = products.nth(i).locator(".card-title.card-price");
    const productDescription = products.nth(i).locator(".card-text");

    await expect(products.nth(i)).toBeVisible();

    // test image
    await expect(productImage).toBeVisible();
    await expect(productImage).toHaveAttribute("alt", product.name);

    // test title
    await expect(productTitle).toBeVisible();
    await expect(productTitle).toHaveText(product.name);

    // test price
    await expect(productPrice).toBeVisible();
    await expect(productPrice).toHaveText(
      product.price.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      })
    );

    // test description
    await expect(productDescription).toBeVisible();
    await expect(productDescription).toHaveText(
      product.description.substring(0, 60) + "..."
    );
  }
}
