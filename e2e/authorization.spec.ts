import { expect, test } from "@playwright/test";

import { USERS, openFirstShot, signIn } from "./helpers/auth";
import { getFirstPublishedShotNotOwnedBy, signInSupabase } from "./helpers/supabase";

test.describe("authorization", () => {
  test("anonymous visitors get a read-only shot page", async ({ page }) => {
    await openFirstShot(page, USERS.maya.username);
    await expect(page.getByText("Sign in to join the conversation.")).toBeVisible();
  });

  test("a different user cannot open the edit page for someone else's shot", async ({
    page,
  }) => {
    await signIn(page, USERS.leo);
    const href = await openFirstShot(page, USERS.maya.username);
    await page.goto(`${href}/edit`);

    await expect(
      page.getByRole("heading", { name: "We could not find that page" }),
    ).toBeVisible();
  });

  test("a different user cannot update another shot through the RPC", async () => {
    const client = await signInSupabase(USERS.leo.email, USERS.leo.password);
    const shot = await getFirstPublishedShotNotOwnedBy(client, USERS.leo.username);

    expect(shot).not.toBeNull();

    const { error } = await client.rpc("update_shot", {
      p_shot_id: shot!.id,
      p_title: "Unauthorized update",
      p_description: shot!.description,
      p_category_id: shot!.category_id,
      p_tags: [],
      p_cover_path: shot!.cover_image_path,
    });

    expect(error?.message).toContain("not_owner");
  });

  test("a different user cannot update another user's comment", async () => {
    const client = await signInSupabase(USERS.leo.email, USERS.leo.password);

    const { data: profile } = await client
      .from("profiles")
      .select("id")
      .eq("username", USERS.leo.username)
      .maybeSingle();

    const { data: comment } = await client
      .from("comments")
      .select("id, author_id")
      .neq("author_id", profile!.id)
      .limit(1)
      .maybeSingle();

    expect(comment).not.toBeNull();

    const { data: updated } = await client
      .from("comments")
      .update({ body: "Unauthorized edit" })
      .eq("id", comment!.id)
      .select("id");

    expect(updated ?? []).toHaveLength(0);
  });
});
