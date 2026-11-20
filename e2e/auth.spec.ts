import { expect, test } from "@playwright/test";

import { USERS, signIn } from "./helpers/auth";

test.describe("authentication", () => {
  test("signs in with seeded credentials", async ({ page }) => {
    await signIn(page, USERS.maya);
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
  });

  test("shows a friendly error for bad credentials", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(USERS.maya.email);
    await page.getByLabel("Password").fill("definitely-not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(
      page.getByText("We could not sign you in with those credentials."),
    ).toBeVisible();
  });

  test("redirects anonymous users away from protected routes", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/sign-in\?next=%2Fdashboard/);
  });

  test("redirects signed-in users away from auth pages", async ({ page }) => {
    await signIn(page, USERS.maya);
    await page.goto("/sign-in");
    await expect(page).toHaveURL("/");
  });

  test("validates sign-up fields on the server", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByLabel("Username").fill("ab");
    await page.getByLabel("Display name").fill("A");
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText(/Username must be at least 3 characters/)).toBeVisible();
  });
});
