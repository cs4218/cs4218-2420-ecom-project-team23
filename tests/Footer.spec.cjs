// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Footer Component UI Tests", () => {
  const footerLinks = [
    { name: /about/i, href: "/about" },
    { name: /contact/i, href: "/contact" },
    { name: /privacy policy/i, href: "/policy" },
  ];
  
  test("should display copyright text", async ({ page }) => {
    await page.goto("http://localhost:3000");
    const footer = page.locator(".footer");
    await expect(footer.locator("h4").first()).toHaveText(
      "All Rights Reserved \u00A9 TestingComp"
    );
  });

  test("should have correct navigation links", async ({ page }) => {
    await page.goto("http://localhost:3000");
    const footer = page.locator(".footer");
    const linksP = footer.locator("p.text-center.mt-3");

    // check links are present
    for (const link of footerLinks) {
      const linkElement = linksP.getByRole("link", { name: link.name });
      await expect(linkElement).toHaveAttribute("href", link.href);
    }

    // check links navs correctly
    for (const link of footerLinks) {
      const linkElement = linksP.getByRole("link", { name: link.name });
      await linkElement.click();
      await expect(page).toHaveURL(`http://localhost:3000${link.href}`)
      await page.goBack();
    }
  });
});
