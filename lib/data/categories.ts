import "server-only";

import { cache } from "react";

import { withNetworkRetry } from "@/lib/data/resilient";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/observability/logger";
import type { Category } from "@/lib/types/app";

const CATEGORY_FALLBACK: Category[] = [
  { id: "product-design", name: "Product Design", sort_order: 1 },
  { id: "web-design", name: "Web Design", sort_order: 2 },
  { id: "mobile-design", name: "Mobile Design", sort_order: 3 },
  { id: "branding", name: "Branding", sort_order: 4 },
  { id: "illustration", name: "Illustration", sort_order: 5 },
  { id: "animation", name: "Animation", sort_order: 6 },
];

/**
 * Categories only drive filter labels and the "choose a category" select. A
 * transient Supabase/DNS blip must not take the whole page down with it, so a
 * failed read falls back to the ids seeded by 0003_shots.sql.
 */
export const getCategories = cache(async (): Promise<Category[]> => {
  try {
    const data = await withNetworkRetry(async () => {
      const supabase = await createClient();
      const result = await supabase
        .from("categories")
        .select("id, name, sort_order")
        .order("sort_order", { ascending: true });

      if (result.error) {
        throw result.error;
      }

      return result.data ?? [];
    });

    return data.length > 0 ? data : CATEGORY_FALLBACK;
  } catch (error) {
    logError("data.categories", error, { fallback: "static-categories" });
    return CATEGORY_FALLBACK;
  }
});
