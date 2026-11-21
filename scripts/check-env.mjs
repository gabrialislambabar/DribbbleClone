import { checkSupabaseEnv, describeSupabaseFix } from "./supabase-env.mjs";

const result = checkSupabaseEnv();

console.log("DribbbleClone environment check\n");
console.log("  Supabase URL      :", result.url ?? "(missing)");
console.log("  Project ref       :", result.projectRef ?? "(unknown)");
console.log("  Anon key project  :", result.anonRef ?? "(publishable / unknown)");
console.log("  Service key project:", result.serviceRef ?? "(publishable / unknown)");
console.log("  Unsplash key      :", process.env.UNSPLASH_ACCESS_KEY ? "set" : "missing");
console.log("  Sentry DSN        :", process.env.SENTRY_DSN ? "set" : "missing");

if (result.problems.length > 0) {
  console.error(`\n${describeSupabaseFix(result)}`);
  process.exit(1);
}

console.log("\n  All Supabase credentials belong to the same project.");

const url = result.url;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function probe(path, label, key) {
  try {
    const response = await fetch(`${url}/rest/v1/${path}`, {
      headers: { apikey: key, authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 200) {
      console.log(`  ${label}: ok`);
      return true;
    }

    const body = await response.text();

    if (body.includes("PGRST205")) {
      console.error(`  ${label}: table missing — apply supabase/migrations/0001…0012`);
    } else if (response.status === 401 || response.status === 403) {
      console.error(
        `  ${label}: permission denied — apply supabase/migrations/0012_service_role_grants.sql`,
      );
    } else {
      console.error(`  ${label}: HTTP ${response.status} ${body.slice(0, 120)}`);
    }

    return false;
  } catch (error) {
    console.error(`  ${label}: ${error.message}`);
    return false;
  }
}

console.log("\nPublic reads (anon key):");
let ok = true;
ok = (await probe("profiles?select=id&limit=1", "profiles", anonKey)) && ok;
ok = (await probe("shots?select=id&limit=1", "shots", anonKey)) && ok;
ok = (await probe("categories?select=id&limit=1", "categories", anonKey)) && ok;

console.log("\nProtected tables (service key):");
ok = (await probe("reports?select=id&limit=1", "reports", serviceKey)) && ok;
ok = (await probe("notifications?select=id&limit=1", "notifications", serviceKey)) && ok;
ok = (await probe("rate_limits?select=key&limit=1", "rate_limits", serviceKey)) && ok;

if (!ok) {
  process.exit(1);
}

console.log("\nEnvironment is ready.");
