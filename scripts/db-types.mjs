import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const projectId = process.env.SUPABASE_PROJECT_ID;

if (!projectId) {
  console.error("SUPABASE_PROJECT_ID is not set.");
  process.exit(1);
}

const output = execFileSync(
  "npx",
  [
    "supabase",
    "gen",
    "types",
    "typescript",
    "--project-id",
    projectId,
    "--schema",
    "public",
  ],
  { encoding: "utf8", shell: process.platform === "win32" },
);

writeFileSync("lib/types/database.ts", output, "utf8");
console.log("Wrote lib/types/database.ts");
