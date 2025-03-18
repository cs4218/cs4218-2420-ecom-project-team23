// @ts-check
const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:3000/register");
});

test("should trigger toaster when signing up with existing user", async ({
  page,
}) => {
  await fillDefaultData(page);

  await page.getByRole("button", { name: "REGISTER" }).click();

  const toaster = await page.waitForSelector(
    "text=Unable to register. If you already have an account, please log in",
    {
      state: "visible",
      timeout: 5000,
    }
  );
  expect(await toaster.isVisible()).toBeTruthy();
});

test("should trigger toaster when signing up with invalid email", async ({
  page,
}) => {
  await fillDefaultData(page);

  await page.getByRole("textbox", { name: "Enter Your Email" }).click();
  await page
    .getByRole("textbox", { name: "Enter Your Email" })
    .fill("example@gmail.c");

  await page.getByRole("button", { name: "REGISTER" }).click();

  const toaster = await page.waitForSelector(
    "text=Invalid Email Format (hint: example@gmail.com)",
    {
      state: "visible",
      timeout: 5000,
    }
  );
  expect(await toaster.isVisible()).toBeTruthy();
});

test("should trigger toaster when signing up with invalid password", async ({
  page,
}) => {
  await fillDefaultData(page);

  await page.getByRole("textbox", { name: "Enter Your Password" }).click();
  await page
    .getByRole("textbox", { name: "Enter Your Password" })
    .fill("12345");

  await page.getByRole("button", { name: "REGISTER" }).click();

  const toaster = await page.waitForSelector(
    "text=Password must be at least 6 characters",
    {
      state: "visible",
      timeout: 5000,
    }
  );
  expect(await toaster.isVisible()).toBeTruthy();
});

test("should trigger toaster when signing up with invalid phone", async ({
  page,
}) => {
  await fillDefaultData(page);
  await page.getByRole("textbox", { name: "Enter Your Phone" }).click();
  await page.getByRole("textbox", { name: "Enter Your Phone" }).fill("912");

  await page.getByRole("button", { name: "REGISTER" }).click();

  const toaster = await page.waitForSelector(
    "text=Oops! Please enter a valid phone number in the format: +[country code] [8–12 digits]",
    {
      state: "visible",
      timeout: 5000,
    }
  );
  expect(await toaster.isVisible()).toBeTruthy();
});

async function fillDefaultData(page) {
  await page.getByRole("textbox", { name: "Enter Your Name" }).click();
  await page.getByRole("textbox", { name: "Enter Your Name" }).fill("John Doe");
  await page.getByRole("textbox", { name: "Enter Your Email" }).click();
  await page
    .getByRole("textbox", { name: "Enter Your Email" })
    .fill("example@gmail.com");
  await page.getByRole("textbox", { name: "Enter Your Password" }).click();
  await page
    .getByRole("textbox", { name: "Enter Your Password" })
    .fill("example");
  await page.getByRole("textbox", { name: "Enter Your Phone" }).click();
  await page
    .getByRole("textbox", { name: "Enter Your Phone" })
    .fill("91234567");
  await page.getByRole("textbox", { name: "Enter Your Address" }).click();
  await page
    .getByRole("textbox", { name: "Enter Your Address" })
    .fill("example");
  await page.getByPlaceholder("Enter Your DOB").click();
  await page.getByPlaceholder("Enter Your DOB").fill("2000-12-12");
  await page
    .getByRole("textbox", { name: "What is Your Favorite sports" })
    .click();
  await page
    .getByRole("textbox", { name: "What is Your Favorite sports" })
    .fill("answer");
}
