// @ts-check
const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await login(page);
  await navigateToProfilePage(page);
});

test("should display initial update profile form data", async ({ page }) => {
  const formHeader = page.getByRole("heading", { name: "USER PROFILE" });
  const nameInput = page.getByRole("textbox", { name: "Enter Your Name" });
  const emailInput = page.getByRole("textbox", { name: "Enter Your Email" });
  const currentPasswordInput = page.getByRole("textbox", {
    name: "Enter Your Current Password",
  });
  const newPasswordInput = page.getByRole("textbox", {
    name: "Enter Your New Password",
  });
  const phoneInput = page.getByRole("textbox", { name: "Enter Your Phone" });
  const addressInput = page.getByRole("textbox", {
    name: "Enter Your Address",
  });

  await expect(formHeader).toBeVisible();

  await expect(nameInput).toBeVisible();
  await expect(nameInput).toHaveValue("john doe");

  await expect(emailInput).toBeVisible();
  await expect(emailInput).toBeDisabled();
  await expect(emailInput).toHaveValue("example@gmail.com");

  await expect(currentPasswordInput).toBeVisible();
  await expect(currentPasswordInput).toHaveValue("");

  await expect(newPasswordInput).toBeVisible();
  await expect(newPasswordInput).toHaveValue("");

  await expect(phoneInput).toBeVisible();
  await expect(phoneInput).toHaveValue("91234583");

  await expect(addressInput).toBeVisible();
  await expect(addressInput).toHaveValue("example street");
});

test.describe("should trigger toaster on successful update", () => {
  test("should update profile successfully", async ({ page }) => {
    await fillDefaultData(page);

    await page.getByRole("button", { name: "UPDATE" }).click();

    const toaster = await page.waitForSelector(
      "text=Profile Updated Successfully",
      {
        state: "visible",
        timeout: 5000,
      }
    );
    expect(await toaster.isVisible()).toBeTruthy();
  });
});

test.describe("should trigger toaster on invalid inputs", () => {
  test("should trigger toaster on invalid current password", async ({
    page,
  }) => {
    const currentPasswordInput = page.getByRole("textbox", {
      name: "Enter Your Current Password",
    });
    await currentPasswordInput.click();
    await currentPasswordInput.fill("wrongPassword");

    await page.getByRole("button", { name: "UPDATE" }).click();

    const toaster = await page.waitForSelector("text=Unauthorized to update.", {
      state: "visible",
      timeout: 5000,
    });

    expect(await toaster.isVisible()).toBeTruthy();
  });

  test("should trigger toaster on invalid new password", async ({ page }) => {
    await fillDefaultData(page);

    const newPasswordInput = page.getByRole("textbox", {
      name: "Enter Your New Password",
    });
    await newPasswordInput.click();
    await newPasswordInput.fill("short");

    await page.getByRole("button", { name: "UPDATE" }).click();

    const toaster = await page.waitForSelector(
      "text=Password should be at least 6",
      { state: "visible", timeout: 5000 }
    );
    expect(await toaster.isVisible()).toBeTruthy();
  });

  test("should trigger toaster on invalid new phone", async ({ page }) => {
    await fillDefaultData(page);

    const phoneInput = page.getByRole("textbox", {
      name: "Enter Your Phone",
    });

    await phoneInput.click();
    await phoneInput.fill("9123");

    await page.getByRole("button", { name: "UPDATE" }).click();

    const toaster = await page.waitForSelector(
      "text=Oops! Please enter a valid",
      {
        state: "visible",
        timeout: 5000,
      }
    );
    expect(await toaster.isVisible()).toBeTruthy();
  });
});

async function login(page) {
  await page.goto("http://localhost:3000/login");
  await page.getByRole("textbox", { name: "Enter Your Email" }).click();
  await page
    .getByRole("textbox", { name: "Enter Your Email" })
    .fill("example@gmail.com");
  await page.getByRole("textbox", { name: "Enter Your Password" }).click();
  await page
    .getByRole("textbox", { name: "Enter Your Password" })
    .fill("example");
  await page.getByRole("button", { name: "LOGIN" }).click();
  await page.waitForURL("http://localhost:3000/");
}

async function navigateToProfilePage(page) {
  await page.getByRole("button", { name: "john doe" }).click();
  await page.getByRole("link", { name: "Dashboard" }).click();
  await page.waitForURL("http://localhost:3000/dashboard/user");

  await page.getByRole("link", { name: "Profile" }).click();
  await page.waitForURL("http://localhost:3000/dashboard/user/profile");
}

async function fillDefaultData(page) {
  const currentPasswordInput = page.getByRole("textbox", {
    name: "Enter Your Current Password",
  });
  await currentPasswordInput.click();
  await currentPasswordInput.fill("example");
}
