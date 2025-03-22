// @ts-check
// Requirement: The database is populated with the JSON data files provided by the course
const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await login(page);
});

test.describe("Display Products", () => {
  test("should display products in cart page after adding to cart", async ({
    page,
  }) => {
    // Add items to cart and then navigate to cart page
    await addItemsToCart(page);
    await navigateToCartPage(page);

    // Assert that products' details appear in cart page
    await expect(page.locator("h1")).toContainText(
      "Hello  CS 4218 Test AccountYou have 3 items in your cart"
    );
    await expect(page.getByRole("img", { name: "Novel" })).toBeVisible();
    await expect(page.getByRole("main")).toContainText(
      "NovelA bestselling novelPrice : 14.99"
    );
    await expect(
      page
        .locator("div")
        .filter({ hasText: /^NovelA bestselling novelPrice : 14\.99Remove$/ })
        .getByRole("button")
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: "The Law of Contract in" })
    ).toBeVisible();
    await expect(page.getByRole("main")).toContainText(
      "The Law of Contract in SingaporeA bestselling book in SingaporPrice : 54.99"
    );
    await expect(
      page.getByRole("button", { name: "Remove" }).nth(1)
    ).toBeVisible();
    await expect(page.getByRole("img", { name: "NUS T-shirt" })).toBeVisible();
    await expect(page.getByRole("main")).toContainText(
      "NUS T-shirtPlain NUS T-shirt for salePrice : 4.99"
    );
    await expect(
      page
        .locator("div")
        .filter({
          hasText: /^NUS T-shirtPlain NUS T-shirt for salePrice : 4\.99Remove$/,
        })
        .getByRole("button")
    ).toBeVisible();

    // Assert that the total cost is correct
    await expect(page.getByRole("main")).toContainText("Total : $74.97");

    // Assert the make payment UI is present
    await page.waitForTimeout(5000);
    await expect(page.getByRole("main")).toContainText("Choose a way to pay");
    await expect(page.getByText("Edit Choose a way to pay")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Paying with Card" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Paying with PayPal" })
    ).toBeVisible();
    await expect(page.getByRole("main")).toContainText(
      "Paypal option is currently unavailable as product is still in development"
    );
    await expect(
      page.getByRole("button", { name: "Make Payment" })
    ).toBeVisible();
  });

  test("should display 1 less product after removing from cart", async ({
    page,
  }) => {
    // Add items to cart and then navigate to cart page
    await addItemsToCart(page);
    await navigateToCartPage(page);

    // Assert that there are 3 items in the cart
    await expect(page.locator("h1")).toContainText(
      "Hello  CS 4218 Test AccountYou have 3 items in your cart"
    );
    await expect(page.getByRole("main")).toContainText("Total : $74.97");

    // Remove the first item from the cart
    await page
      .locator("div")
      .filter({ hasText: /^NovelA bestselling novelPrice : 14\.99Remove$/ })
      .getByRole("button")
      .click();

    // Assert that there are 2 items in the cart, with updated total price
    await expect(page.locator("h1")).toContainText(
      "Hello CS 4218 Test AccountYou have 2 items in your cart"
    );
    await expect(page.getByRole("main")).toContainText("Total : $59.98");
  });
});

test.describe("Address", () => {
  test("should update address properly and display it", async ({ page }) => {
    // Navigate to cart page
    await navigateToCartPage(page);

    // Update address and assert that it is reflected
    await page.getByRole("button", { name: "Update Address" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Current Password" })
      .click();
    await page
      .getByRole("textbox", { name: "Enter Your Current Password" })
      .fill("cs4218@test.com");
    await page.getByRole("textbox", { name: "Enter Your Address" }).click();
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
      .click();
    await page
      .getByRole("textbox", { name: "Enter Your Current Password" })
      .fill("cs4218@test.com");
    await page.getByRole("textbox", { name: "Enter Your Address" }).click();
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

async function login(page) {
  await page.goto("http://localhost:3000/login");
  await page.getByRole("textbox", { name: "Enter Your Email" }).click();
  await page
    .getByRole("textbox", { name: "Enter Your Email" })
    .fill("cs4218@test.com");
  await page.getByRole("textbox", { name: "Enter Your Password" }).click();
  await page
    .getByRole("textbox", { name: "Enter Your Password" })
    .fill("cs4218@test.com");
  await page.getByRole("button", { name: "LOGIN" }).click();
  await page.waitForURL("http://localhost:3000/");
}

async function addItemsToCart(page) {
  await page.locator(".card-name-price > button:nth-child(2)").first().click();
  await page
    .locator(
      "div:nth-child(2) > .card-body > div:nth-child(3) > button:nth-child(2)"
    )
    .click();
  await page
    .locator(
      "div:nth-child(3) > .card-body > div:nth-child(3) > button:nth-child(2)"
    )
    .click();
}

async function navigateToCartPage(page) {
  await page.getByRole("link", { name: "Cart" }).click();
  await page.waitForURL("http://localhost:3000/cart");
}
