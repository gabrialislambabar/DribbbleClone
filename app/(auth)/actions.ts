"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isUsernameTaken } from "@/lib/data/profiles";
import { getSiteUrl } from "@/lib/env";
import { toSafeMessage } from "@/lib/errors";
import { anonRateLimitError } from "@/lib/rate-limit/server";
import { createClient } from "@/lib/supabase/server";
import {
  firstZodError,
  safeRedirectPath,
  signInSchema,
  signUpSchema,
} from "@/lib/validation/profile";

export type AuthState = {
  error?: string;
  success?: string;
};

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function signUp(
  _previousState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const limited = await anonRateLimitError("signUp");
  if (limited) {
    return { error: limited };
  }

  const parsed = signUpSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password"),
    username: formString(formData, "username"),
    display_name: formString(formData, "display_name"),
  });

  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const { email, password, username, display_name } = parsed.data;

  if (await isUsernameTaken(username)) {
    return { error: "That username is taken. Try another one." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, display_name },
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (
      message.includes("database error saving new user") ||
      message.includes("duplicate key")
    ) {
      return { error: "That username is taken. Try another one." };
    }
    return { error: toSafeMessage(error, "We could not create your account.") };
  }

  return {
    success: "Check your email to confirm your account, then sign in.",
  };
}

export async function signIn(
  _previousState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const limited = await anonRateLimitError("auth");
  if (limited) {
    return { error: limited };
  }

  const parsed = signInSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password"),
  });

  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return { error: "Confirm your email before signing in." };
    }
    return { error: "We could not sign you in with those credentials." };
  }

  const next = safeRedirectPath(formString(formData, "next"));
  revalidatePath("/", "layout");
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
