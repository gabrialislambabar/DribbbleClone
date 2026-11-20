import { expect, test } from "@playwright/test";

import { USERS, openFirstShot, signIn } from "./helpers/auth";

test.describe("social interactions", () => {
  test("liking is idempotent from the UI", async ({ page }) => {
    await signIn(page, USERS.maya);
    await openFirstShot(page, USERS.leo.username);

    const likeButton = page.getByRole("button", { name: /Like this shot/i }).first();
    await expect(likeButton).toBeVisible();
    await likeButton.click();
    await expect(
      page.getByRole("button", { name: /Unlike this shot/i }).first(),
    ).toBeVisible();
    await page
      .getByRole("button", { name: /Unlike this shot/i })
      .first()
      .click();
    await expect(
      page.getByRole("button", { name: /Like this shot/i }).first(),
    ).toBeVisible();
  });

  test("posts a comment and shows it in the list", async ({ page }) => {
    await signIn(page, USERS.maya);
    await openFirstShot(page, USERS.leo.username);

    const body = `E2E comment ${Date.now()}`;
    await page.getByPlaceholder("Add a comment…").fill(body);
    await page.getByRole("button", { name: "Post comment" }).click();

    await expect(page.getByText(body)).toBeVisible();
  });

  test("rejects a whitespace-only comment", async ({ page }) => {
    await signIn(page, USERS.maya);
    await openFirstShot(page, USERS.leo.username);

    await page.getByPlaceholder("Add a comment…").fill("   ");
    await page.getByRole("button", { name: "Post comment" }).click();

    await expect(page.getByText("Comment cannot be empty.")).toBeVisible();
  });

  test("rejects a comment longer than the limit", async ({ page }) => {
    await signIn(page, USERS.maya);
    await openFirstShot(page, USERS.leo.username);

    const textarea = page.getByPlaceholder("Add a comment…");
    await textarea.evaluate((element, value) => {
      (element as HTMLTextAreaElement).value = value;
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }, "a".repeat(1001));

    await page.getByRole("button", { name: "Post comment" }).click();
    await expect(
      page.getByText("Comment must be 1,000 characters or fewer."),
    ).toBeVisible();
  });

  test("follows and unfollows a profile", async ({ page }) => {
    await signIn(page, USERS.maya);
    await page.goto(`/u/${USERS.alex.username}`);

    const follow = page.getByRole("button", { name: "Follow", exact: true });

    if (await follow.isVisible()) {
      await follow.click();
    }

    const following = page.getByRole("button", { name: "Following", exact: true });
    await expect(following).toBeVisible();
    await following.click();
    await expect(page.getByRole("button", { name: "Follow", exact: true })).toBeVisible();
  });
});
