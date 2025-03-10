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

  expect(formHeader).toBeVisible();

  expect(nameInput).toBeVisible();
  expect(nameInput).toHaveValue("john doe");

  expect(emailInput).toBeVisible();
  expect(emailInput).toBeDisabled();
  expect(emailInput).toHaveValue("example@gmail.com");

  expect(currentPasswordInput).toBeVisible();
  expect(currentPasswordInput).toHaveValue("");

  expect(newPasswordInput).toBeVisible();
  expect(newPasswordInput).toHaveValue("");

  expect(phoneInput).toBeVisible();
  expect(phoneInput).toHaveValue("91234583");

  expect(addressInput).toBeVisible();
  expect(addressInput).toHaveValue("example street");
});

test.describe("should trigger toaster on successful update", () => {
  test("should update profile successfully", async ({ page }) => {
    await fillDefaultData(page);

    await page.getByRole("button", { name: "UPDATE" }).click();
    await page.waitForTimeout(1000);

    expect(page.getByText("Profile Updated Successfully")).toBeVisible();
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
    await page.waitForTimeout(1000);

    expect(page.getByText("Unauthorized to update.")).toBeVisible();
  });

  test("should trigger toaster on invalid new password", async ({ page }) => {
    const newPasswordInput = page.getByRole("textbox", {
      name: "Enter Your New Password",
    });
    await newPasswordInput.click();
    await newPasswordInput.fill("short");

    await page.getByRole("button", { name: "UPDATE" }).click();
    await page.waitForTimeout(1000);

    expect(page.getByText("Password should be at least 6")).toBeVisible();
  });

  test("should trigger toaster on invalid new phone", async ({ page }) => {
    const phoneInput = page.page.getByRole("textbox", {
      name: "Enter Your Phone",
    });

    await phoneInput.click();
    await phoneInput.fill("9123");

    await page.getByRole("button", { name: "UPDATE" }).click();
    await page.waitForTimeout(1000);

    expect(getByText("Oops! Please enter a valid")).toBeVisible();
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
