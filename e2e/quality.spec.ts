import { expect, test } from "@playwright/test";

import { USERS, openFirstShot, signIn } from "./helpers/auth";

test.describe("cache and limits", () => {
  test("profile edits are visible on the public profile immediately", async ({
    page,
  }) => {
    await signIn(page, USERS.maya);
    await page.goto("/settings");

    const name = `Maya E2E ${Date.now()}`;
    await page.getByLabel("Display name").fill(name);
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Profile updated.")).toBeVisible();

    await page.goto(`/u/${USERS.maya.username}`);
    await expect(page.getByRole("heading", { name })).toBeVisible();
  });

  test("health endpoint reports a database check", async ({ request }) => {
    const response = await request.get("/api/health");
    expect([200, 503]).toContain(response.status());

    const body = (await response.json()) as {
      ok: boolean;
      checks: { supabase: string };
    };

    expect(body).toHaveProperty("checks.supabase");
    expect(["ok", "error", "unconfigured"]).toContain(body.checks.supabase);
  });

  test("unsplash proxy validates the query before calling upstream", async ({
    request,
  }) => {
    const response = await request.get("/api/unsplash/search?query=a");
    expect(response.status()).toBe(400);
  });

  test("comment rate limit returns a friendly message", async ({ page }) => {
    test.slow();
    await signIn(page, USERS.omar);
    await openFirstShot(page, USERS.leo.username);

    const textarea = page.getByPlaceholder("Add a comment…");
    const submit = page.getByRole("button", { name: "Post comment" });

    for (let index = 0; index < 10; index += 1) {
      await textarea.fill(`Rate limit ${Date.now()}-${index}`);
      await submit.click();
      await expect(textarea).toHaveValue("");
    }

    await textarea.fill("One comment too many.");
    await submit.click();
    await expect(page.getByText(/doing that too often/i)).toBeVisible();
  });
});
