import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/app";

export const getProfileByUsername = cache(
  async (username: string): Promise<Profile | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username.trim().toLowerCase())
      .maybeSingle();

    return data;
  },
);

export async function isUsernameTaken(username: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username.trim().toLowerCase())
    .maybeSingle();

  return Boolean(data);
}
