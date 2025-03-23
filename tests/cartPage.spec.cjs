// @ts-check
const { test, expect } = require("@playwright/test");
const {
  loginAsAdmin,
  createProduct,
  deleteProduct,
} = require("../utilities/testUtils");

test.describe.configure({ mode: "serial" });

let adminToken;
let createdProducts = [];

test.beforeAll(async () => {
  adminToken = await loginAsAdmin();

  const productInputs = [
    {
      name: "BYD Seal",
      description: "EV Car",
      price: 14.99,
      quantity: 10,
      shipping: 1,
    },
    {
      name: "Tesla Model Y",
      description: "Bad Car",
      price: 54.99,
      quantity: 5,
      shipping: 1,
    },
    {
      name: "Hyundai Ioniq 3",
      description: "Amazing vehicle",
      price: 4.99,
      quantity: 15,
      shipping: 1,
    },
  ];

  for (const input of productInputs) {
    const product = await createProduct({
      ...input,
      token: adminToken,
    });
    createdProducts.push({
      ...product,
      ...input,
    });
  }
});

test.afterAll(async () => {
  for (const product of createdProducts) {
    await deleteProduct(product.id);
  }
});

test.describe("Display Products", () => {
  test("should display products in cart page after adding to cart", async ({
    page,
  }) => {
    await loginUser(page);
    await addProductsToCart(page, createdProducts);
    await navigateToCartPage(page);

    await expect(page.getByText(/You have 3 items/)).toBeVisible();

    for (const product of createdProducts) {
      const card = page.locator(".card", { hasText: product.name });
      await expect(card).toContainText(product.description);
      await expect(card).toContainText(`Price : ${product.price}`);
    }

    const total = createdProducts
      .reduce((sum, p) => sum + p.price, 0)
      .toFixed(2);

    await expect(page.getByRole("main")).toContainText(`Total : $${total}`);
    await expect(page.getByRole("main")).toContainText("Choose a way to pay");
    await expect(
      page.getByRole("button", { name: "Make Payment" })
    ).toBeVisible();
  });

  test("should display 1 less product after removing from cart", async ({
    page,
  }) => {
    await loginUser(page);
    await addProductsToCart(page, createdProducts);
    await navigateToCartPage(page);

    await expect(page.getByText(/You have 3 items/)).toBeVisible();

    // Remove the first item from the cart
    const first = createdProducts[0];
    await page
      .locator(".card", { hasText: first.name })
      .getByRole("button", { name: "Remove" })
      .click();

    await expect(page.getByText(/You have 2 items/)).toBeVisible();

    const remainingTotal = createdProducts
      .slice(1)
      .reduce((sum, p) => sum + p.price, 0)
      .toFixed(2);

    await expect(page.getByRole("main")).toContainText(
      `Total : $${remainingTotal}`
    );
  });
});

test.describe("Address", () => {
  test("should update address properly and display it", async ({ page }) => {
    await loginUser(page);
    await navigateToCartPage(page);

    await page.getByRole("button", { name: "Update Address" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Current Password" })
      .fill("cs4218@test.com");
    await page
      .getByRole("textbox", { name: "Enter Your Address" })
      .fill("2 Computing Drive");
    await page.getByRole("button", { name: "UPDATE" }).click();

    await navigateToCartPage(page);
    await expect(page.getByRole("main")).toContainText(
      "Current Address2 Computing DriveUpdate Address"
    );

    // Revert address back to original
    await page.getByRole("button", { name: "Update Address" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Current Password" })
      .fill("cs4218@test.com");
    await page
      .getByRole("textbox", { name: "Enter Your Address" })
      .fill("1 Computing Drive");
    await page.getByRole("button", { name: "UPDATE" }).click();

    await navigateToCartPage(page);
    await expect(page.getByRole("main")).toContainText(
      "Current Address1 Computing DriveUpdate Address"
    );
  });
});

async function loginUser(page) {
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Enter Your Email").fill("cs4218@test.com");
  await page.getByPlaceholder("Enter Your Password").fill("cs4218@test.com");
  await page.getByRole("button", { name: "LOGIN" }).click();
  await page.waitForURL("http://localhost:3000/");
}

async function addProductsToCart(page, products) {
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    await page.goto(`http://localhost:3000/product/${product.slug}`);

    // Wait until product name is visible, ensures product data has loaded
    await expect(
      page.getByRole("heading", { name: product.name })
    ).toBeVisible();

    await page.getByRole("button", { name: "ADD TO CART" }).first().click();

    // Wait for cart to reflect correct count
    await page.waitForFunction((expectedCount) => {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        return cart.length === expectedCount;
      } catch {
        return false;
      }
    }, i + 1);
  }

  await page.reload();
}

async function navigateToCartPage(page) {
  await page.getByRole("link", { name: "Cart" }).click();
  await page.waitForURL("http://localhost:3000/cart");
}
