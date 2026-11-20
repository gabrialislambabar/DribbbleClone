import { expect, test } from "@playwright/test";

import { USERS, openFirstShot, signIn } from "./helpers/auth";

const realtimeEnabled = process.env.PLAYWRIGHT_REALTIME === "1";

test.describe("realtime", () => {
  test.skip(
    !realtimeEnabled,
    "Set PLAYWRIGHT_REALTIME=1 and enable Realtime in Supabase to run these tests.",
  );

  test("a comment appears for another viewer without a reload", async ({ browser }) => {
    const viewerContext = await browser.newContext();
    const authorContext = await browser.newContext();
    const viewerPage = await viewerContext.newPage();
    const authorPage = await authorContext.newPage();

    await signIn(viewerPage, USERS.sana);
    const href = await openFirstShot(viewerPage, USERS.leo.username);

    await signIn(authorPage, USERS.maya);
    await authorPage.goto(href);

    const body = `Live comment ${Date.now()}`;
    await authorPage.getByPlaceholder("Add a comment…").fill(body);
    await authorPage.getByRole("button", { name: "Post comment" }).click();

    await expect(viewerPage.getByText(body)).toBeVisible({ timeout: 15_000 });

    await viewerContext.close();
    await authorContext.close();
  });

  test("a like updates the count for another viewer", async ({ browser }) => {
    const viewerContext = await browser.newContext();
    const likerContext = await browser.newContext();
    const viewerPage = await viewerContext.newPage();
    const likerPage = await likerContext.newPage();

    await signIn(viewerPage, USERS.sana);
    const href = await openFirstShot(viewerPage, USERS.leo.username);

    const viewerButton = viewerPage
      .getByRole("button", { name: /Like this shot/i })
      .first();
    const before = Number.parseInt((await viewerButton.innerText()).trim(), 10);

    await signIn(likerPage, USERS.maya);
    await likerPage.goto(href);
    const likerButton = likerPage
      .getByRole("button", { name: /Like this shot/i })
      .first();

    await likerButton.click();

    await expect(viewerButton).toHaveText(new RegExp(String(before + 1)), {
      timeout: 15_000,
    });

    await viewerContext.close();
    await likerContext.close();
  });
});
