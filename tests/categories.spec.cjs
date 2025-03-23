// @ts-check
// Requirement: The database is populated with the JSON data files provided by the course
const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await login(page);
});

test.describe("Categories", () => {
  test("should display all stored categories correctly", async ({ page }) => {
    // Navigate to categories page
    await navigateToCategoriesPage(page);

    // Assert that all stored categories are displayed
    await expect(page.getByRole("main")).toContainText("Book");
    await expect(page.getByRole("main")).toContainText("Clothing");
    await expect(page.getByRole("main")).toContainText("Electronics");
  });

  test("should display all products of a selected category", async ({
    page,
  }) => {
    // Navigate to categories page
    await navigateToCategoriesPage(page);

    // Assert that all stored categories are displayed
    await expect(page.getByRole("main")).toContainText("Book");
    await expect(page.getByRole("main")).toContainText("Clothing");
    await expect(page.getByRole("main")).toContainText("Electronics");

    // // Click into the book category
    await page.getByRole("link", { name: "Book" }).click();
    await expect(page.getByRole("main")).toContainText("Category - Book");
    await expect(page.locator("h6")).toContainText("3 result found");
    await expect(page.getByRole("main")).toContainText(
      "Textbook$79.99A comprehensive textbook...More Details"
    );
    await expect(page.getByRole("main")).toContainText(
      "Novel$14.99A bestselling novel...More Details"
    );
    await expect(page.getByRole("main")).toContainText(
      "The Law of Contract in Singapore$54.99A bestselling book in Singapore...More Details"
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

async function navigateToCategoriesPage(page) {
  await page.getByRole("link", { name: "Categories" }).click();
  await page.getByRole("link", { name: "All Categories" }).click();
  await page.waitForURL("http://localhost:3000/categories");
}
