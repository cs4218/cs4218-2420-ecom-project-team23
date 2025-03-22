// @ts-check
// Requirement: The database is populated with the JSON data files provided by the course
const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await login(page);
});

test.describe("Display Orders", () => {
  test("should display order in orders page after successfully making payment for it", async ({
    page,
  }) => {
    test.setTimeout(90000);

    // Add items to cart, then navigate to cart page, then make payment, then navigate to orders page
    await addItemsToCart(page);
    await navigateToCartPage(page);
    await makePayment(page);
    await navigateToOrdersPage(page); // required even though successful payment auto navgiates to orders page because braintree payment returns 500 when it takes in too many requests simultaneously (3 browsers), so cannot rely on toaster message or auto navigation

    // Assert that headers are present in orders page
    await expect(page.locator("h1")).toContainText("All Orders");
    await expect(page.getByRole("main")).toContainText("#");
    await expect(page.getByRole("main")).toContainText("Status");
    await expect(page.getByRole("main")).toContainText("Buyer");
    await expect(page.getByRole("main")).toContainText("Date");
    await expect(page.getByRole("main")).toContainText("Payment");
    await expect(page.getByRole("main")).toContainText("Quantity");

    // Assert that the products are present in orders page
    await expect(page.getByRole("main")).toContainText("Not Process");
    await expect(page.getByRole("main")).toContainText("CS 4218 Test Account");
    await expect(page.getByRole("main")).toContainText("Success");
    await expect(page.getByRole("main")).toContainText("3");
    await expect(page.getByRole("main")).toContainText(
      "NovelA bestselling novelPrice : 14.99"
    );
    await expect(page.getByRole("main")).toContainText(
      "The Law of Contract in SingaporeA bestselling book in SingaporPrice : 54.99"
    );
    await expect(page.getByRole("main")).toContainText(
      "NUS T-shirtPlain NUS T-shirt for salePrice : 4.99"
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

async function makePayment(page) {
  await page.getByRole("button", { name: "Paying with Card" }).click();
  await page.getByText("Card Number", { exact: true }).click();
  await page
    .locator('iframe[name="braintree-hosted-field-number"]')
    .contentFrame()
    .getByRole("textbox", { name: "Credit Card Number" })
    .fill("4111 1111 1111 1111");
  await page
    .locator('iframe[name="braintree-hosted-field-expirationDate"]')
    .contentFrame()
    .getByRole("textbox", { name: "Expiration Date" })
    .click();
  await page
    .locator('iframe[name="braintree-hosted-field-expirationDate"]')
    .contentFrame()
    .getByRole("textbox", { name: "Expiration Date" })
    .fill("1230");
  await page
    .locator('iframe[name="braintree-hosted-field-cvv"]')
    .contentFrame()
    .getByRole("textbox", { name: "CVV" })
    .click();
  await page
    .locator('iframe[name="braintree-hosted-field-cvv"]')
    .contentFrame()
    .getByRole("textbox", { name: "CVV" })
    .fill("123");
  await page.getByRole("button", { name: "Make Payment" }).click();
  await page.waitForTimeout(15000); // manual timeout needed to ensure the payment process finishes, because braintree payment returns 500 when it takes in too many requests simultaneously (3 browsers), so cannot rely on toaster message or auto navigation
}

async function navigateToOrdersPage(page) {
  await page.getByRole("button", { name: "CS 4218 Test Account" }).click();
  await page.getByRole("link", { name: "Dashboard" }).click();
  await page.waitForURL("http://localhost:3000/dashboard/user");

  await page.getByRole("link", { name: "Orders" }).click();
  await page.waitForURL("http://localhost:3000/dashboard/user/orders");
}
