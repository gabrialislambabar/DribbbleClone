function decodeJwt(token) {
  if (!token || !token.includes(".")) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
    );
    return {
      role: typeof payload.role === "string" ? payload.role : null,
      ref: typeof payload.ref === "string" ? payload.ref : null,
    };
  } catch {
    return null;
  }
}

function projectRefFromUrl(url) {
  if (!url) {
    return null;
  }

  try {
    return new URL(url).hostname.split(".")[0] ?? null;
  } catch {
    return null;
  }
}

export function checkSupabaseEnv(env = process.env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  const expectedRef = projectRefFromUrl(url);
  const anon = decodeJwt(anonKey);
  const service = decodeJwt(serviceKey);

  const problems = [];

  if (!url) {
    problems.push("NEXT_PUBLIC_SUPABASE_URL is missing.");
  }

  if (!anonKey) {
    problems.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.");
  }

  if (!serviceKey) {
    problems.push("SUPABASE_SERVICE_ROLE_KEY is missing.");
  }

  if (expectedRef && anon?.ref && anon.ref !== expectedRef) {
    problems.push(
      `Anon key belongs to project "${anon.ref}" but the URL is "${expectedRef}".`,
    );
  }

  if (expectedRef && service?.ref && service.ref !== expectedRef) {
    problems.push(
      `Service role key belongs to project "${service.ref}" but the URL is "${expectedRef}".`,
    );
  }

  if (anon && anon.role !== "anon") {
    problems.push(`The anon key has role "${anon.role}", expected "anon".`);
  }

  if (anonKey?.startsWith("sb_publishable_")) {
    if (serviceKey?.startsWith("sb_publishable_")) {
      problems.push(
        "SUPABASE_SERVICE_ROLE_KEY is a publishable key; it must be the secret key.",
      );
    }
  }

  return {
    url,
    projectRef: expectedRef,
    anonRef: anon?.ref ?? null,
    serviceRef: service?.ref ?? null,
    serviceIsPublishable: Boolean(serviceKey?.startsWith("sb_publishable_")),
    problems,
  };
}

export function describeSupabaseFix(result) {
  const lines = ["Supabase environment is inconsistent:"];
  for (const problem of result.problems) {
    lines.push(`  - ${problem}`);
  }
  lines.push("");
  lines.push("Open your Supabase project → Settings → API and copy both keys");
  lines.push("from the SAME project as NEXT_PUBLIC_SUPABASE_URL:");
  lines.push("  NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon or publishable key>");
  lines.push("  SUPABASE_SERVICE_ROLE_KEY=<secret service role key>");
  lines.push("Then re-run. Never commit these values.");
  return lines.join("\n");
}
