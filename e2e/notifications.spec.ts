import { expect, test } from "@playwright/test";

import { USERS, openFirstShot, signIn } from "./helpers/auth";
import { signInSupabase } from "./helpers/supabase";

test.describe("notifications", () => {
  test("a follow notifies the recipient", async ({ browser }) => {
    const mayaContext = await browser.newContext();
    const alexContext = await browser.newContext();
    const mayaPage = await mayaContext.newPage();
    const alexPage = await alexContext.newPage();

    await signIn(mayaPage, USERS.maya);
    await signIn(alexPage, USERS.alex);

    await mayaPage.goto(`/u/${USERS.alex.username}`);

    const following = mayaPage.getByRole("button", {
      name: "Following",
      exact: true,
    });

    if (await following.isVisible()) {
      await following.click();
      await expect(
        mayaPage.getByRole("button", { name: "Follow", exact: true }),
      ).toBeVisible();
    }

    await mayaPage.getByRole("button", { name: "Follow", exact: true }).click();

    await alexPage.goto("/notifications");
    await expect(alexPage.getByText("Maya Chen")).toBeVisible();
    await expect(
      alexPage.getByRole("link", { name: /Notifications \(\d+ unread\)/ }),
    ).toBeVisible();

    await alexPage.getByRole("button", { name: "Mark all read" }).click();
    await expect(alexPage.getByText("You're all caught up.")).toBeVisible();

    await mayaContext.close();
    await alexContext.close();
  });

  test("a comment notifies the shot owner", async ({ browser }) => {
    const alexContext = await browser.newContext();
    const sanaContext = await browser.newContext();
    const alexPage = await alexContext.newPage();
    const sanaPage = await sanaContext.newPage();

    await signIn(alexPage, USERS.alex);
    await openFirstShot(alexPage, USERS.sana.username);

    const body = `Notification ${Date.now()}`;
    await alexPage.getByPlaceholder("Add a comment…").fill(body);
    await alexPage.getByRole("button", { name: "Post comment" }).click();
    await expect(alexPage.getByPlaceholder("Add a comment…")).toHaveValue("");

    await signIn(sanaPage, USERS.sana);
    await sanaPage.goto("/notifications");

    await expect(sanaPage.getByText("Alex Rivera")).toBeVisible();
    await expect(sanaPage.getByText(body)).toBeVisible();

    await alexContext.close();
    await sanaContext.close();
  });

  test("notification preferences are persisted", async ({ page }) => {
    await signIn(page, USERS.sana);
    await page.goto("/settings");

    const follows = page.getByRole("checkbox", { name: /New followers/ });
    await follows.uncheck();
    await page.getByRole("button", { name: "Save notification settings" }).click();
    await expect(page.getByText("Notification settings updated.")).toBeVisible();

    const client = await signInSupabase(USERS.sana.email, USERS.sana.password);
    const { data } = await client
      .from("notification_preferences")
      .select("follows")
      .eq("user_id", (await client.auth.getUser()).data.user!.id)
      .maybeSingle();

    expect(data?.follows).toBe(false);

    await follows.check();
    await page.getByRole("button", { name: "Save notification settings" }).click();
    await expect(page.getByText("Notification settings updated.")).toBeVisible();
  });
});
