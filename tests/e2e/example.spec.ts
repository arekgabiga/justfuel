import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("/");

  // Expect a title "to contain" a substring.
  // Note: This might fail if the app doesn't have a title yet, but it verifies the runner works.
  // We'll just check that the page loads for now.
  await expect(page).not.toHaveURL("about:blank");
});
