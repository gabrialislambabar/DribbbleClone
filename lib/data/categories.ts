import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/observability/logger";
import type { Category } from "@/lib/types/app";

export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    logError("data.categories", error);
    throw new Error("We couldn't load this content right now.");
  }

  return data ?? [];
});
