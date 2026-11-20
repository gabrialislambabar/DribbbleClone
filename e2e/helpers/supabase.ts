import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export async function signInSupabase(
  email: string,
  password: string,
): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase env vars are required for direct client checks.");
  }

  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(`Could not sign in ${email}: ${error.message}`);
  }

  return client;
}

export async function getFirstPublishedShotId(client: SupabaseClient) {
  const { data, error } = await client
    .from("shots")
    .select("id, title, description, category_id, cover_image_path")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getFirstPublishedShotNotOwnedBy(
  client: SupabaseClient,
  username: string,
) {
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error(profileError?.message ?? `Profile ${username} not found`);
  }

  const { data, error } = await client
    .from("shots")
    .select("id, title, description, category_id, cover_image_path")
    .eq("status", "published")
    .neq("creator_id", profile.id)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
