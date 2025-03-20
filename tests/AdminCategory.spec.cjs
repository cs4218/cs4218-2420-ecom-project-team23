// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Admin Create Category Page", () => {
  let page;
  const adminEmail = "admin@test.sg";

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    await page.goto("http://localhost:3000/login");
    await loginAsAdmin(page, adminEmail);
    await page.goto("http://localhost:3000/dashboard/admin/create-category");
  });

  test("should create, edit, and delete a specific category successfully", async () => {
    const categoryName = `TestCategory-${Date.now()}`;
    const updatedCategoryName = `Updated-${categoryName}`;

    await page
      .getByRole("textbox", { placeholder: "Enter new category" })
      .fill(categoryName);
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText(`${categoryName} is created`)).toBeVisible();
    await expect(page.locator("table")).toContainText(categoryName);

    const row = page.locator(`tr:has-text("${categoryName}")`);
    const editButton = row.locator("button.btn-primary");
    await editButton.click();

    // ✅ Use modal dialog to find the correct input field
    const modal = page.locator(".ant-modal");
    const modalInput = modal.getByRole("textbox", {
      name: "Enter new category",
    });
    await modalInput.fill(updatedCategoryName);
    await modal.getByRole("button", { name: "Submit" }).click();

    await expect(
      page.getByText(`${updatedCategoryName} is updated`)
    ).toBeVisible();
    await expect(page.locator("table")).toContainText(updatedCategoryName);

    const deleteButton = row.locator("button.btn-danger");
    await deleteButton.click();
    await expect(page.getByText("category is deleted")).toBeVisible();
    await expect(page.locator("table")).not.toContainText(updatedCategoryName);
  });
});

async function loginAsAdmin(page, email) {
  await page.getByRole("textbox", { name: "Enter Your Email" }).fill(email);
  await page.getByRole("textbox", { name: "Enter Your Password" }).fill(email);
  await page.getByRole("button", { name: "LOGIN" }).click();
  await page.waitForURL("http://localhost:3000/");
}
