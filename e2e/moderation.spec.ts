import { expect, test } from "@playwright/test";

import { USERS, openFirstShot, signIn } from "./helpers/auth";

const adminEmail = process.env.PLAYWRIGHT_ADMIN_EMAIL;
const adminPassword = process.env.PLAYWRIGHT_ADMIN_PASSWORD;

test.describe("moderation", () => {
  test("non-admins cannot open the moderation page", async ({ page }) => {
    await signIn(page, USERS.alex);
    await page.goto("/moderation");

    await expect(
      page.getByRole("heading", { name: "We could not find that page" }),
    ).toBeVisible();
  });

  test("an admin can take down a reported comment", async ({ browser }) => {
    test.skip(
      !adminEmail || !adminPassword,
      "Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD to run admin tests.",
    );
    test.slow();

    const userContext = await browser.newContext();
    const adminContext = await browser.newContext();
    const userPage = await userContext.newPage();
    const adminPage = await adminContext.newPage();

    await signIn(userPage, USERS.alex);
    const shotHref = await openFirstShot(userPage, USERS.leo.username);

    const body = `Reported comment ${Date.now()}`;
    await userPage.getByPlaceholder("Add a comment…").fill(body);
    await userPage.getByRole("button", { name: "Post comment" }).click();
    await expect(userPage.getByPlaceholder("Add a comment…")).toHaveValue("");

    const commentRow = userPage.locator("li", { hasText: body }).first();
    await commentRow.getByText("Report", { exact: true }).click();
    await commentRow.getByRole("button", { name: "Submit report" }).click();
    await expect(
      commentRow.getByText("Thanks — our moderators will take a look."),
    ).toBeVisible();

    await adminPage.goto("/sign-in");
    await adminPage.getByLabel("Email").fill(adminEmail!);
    await adminPage.getByLabel("Password").fill(adminPassword!);
    await adminPage.getByRole("button", { name: "Sign in" }).click();
    await expect(adminPage).not.toHaveURL(/\/sign-in/);

    await adminPage.goto("/moderation");
    const reportCard = adminPage.locator("li", { hasText: body }).first();
    await expect(reportCard).toBeVisible();
    await reportCard.getByRole("button", { name: "Take down" }).click();
    await expect(reportCard.getByText("Content taken down.")).toBeVisible({
      timeout: 15_000,
    });

    await userPage.goto(shotHref);
    await expect(userPage.getByText(body)).toHaveCount(0);

    await userContext.close();
    await adminContext.close();
  });
});
