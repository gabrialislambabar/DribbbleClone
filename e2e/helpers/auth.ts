import { expect, type Page } from "@playwright/test";

export const USERS = {
  maya: { email: "maya@example.com", password: "password123", username: "maya_designs" },
  leo: { email: "leo@example.com", password: "password123", username: "leo_ui" },
  sana: { email: "sana@example.com", password: "password123", username: "sana_brand" },
  alex: { email: "alex@example.com", password: "password123", username: "alex_rivera" },
  nina: { email: "nina@example.com", password: "password123", username: "nina_k" },
  omar: { email: "omar@example.com", password: "password123", username: "omar_studio" },
};

export type TestUser = (typeof USERS)[keyof typeof USERS];

export async function signIn(page: Page, user: TestUser) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/\/sign-in/);
}

export async function signOut(page: Page) {
  await page.getByRole("button", { name: "Sign out" }).click();
}

export async function openFirstShot(page: Page, username: string): Promise<string> {
  await page.goto(`/u/${username}`);
  const link = page.locator('article a[href^="/shots/"]').first();
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");

  if (!href) {
    throw new Error(`No shots found for @${username}`);
  }

  await page.goto(href);
  return href;
}
