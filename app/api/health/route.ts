import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, checks: { supabase: "unconfigured" } },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  try {
    const supabase = createPublicClient();
    const { error } = await supabase.from("categories").select("id").limit(1);

    if (error) {
      return NextResponse.json(
        { ok: false, checks: { supabase: "error" } },
        { status: 503, headers: { "cache-control": "no-store" } },
      );
    }

    return NextResponse.json(
      { ok: true, checks: { supabase: "ok" } },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false, checks: { supabase: "error" } },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
