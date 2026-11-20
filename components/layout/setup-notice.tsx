export function SetupNotice() {
  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-16">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-lg font-semibold text-amber-900">
          Connect Supabase to get started
        </h1>
        <p className="mt-2 text-sm text-amber-900/80">
          This app is scaffolded and ready. Add your Supabase project credentials, then
          run the SQL migrations.
        </p>

        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-amber-900/90">
          <li>
            Create a project at{" "}
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline"
            >
              supabase.com/dashboard
            </a>
            .
          </li>
          <li>
            Copy <code className="rounded bg-white/70 px-1">.env.local.example</code> to{" "}
            <code className="rounded bg-white/70 px-1">.env.local</code> and fill in the
            URL, anon key, and service role key.
          </li>
          <li>
            Run the migrations in{" "}
            <code className="rounded bg-white/70 px-1">supabase/migrations</code> in the
            SQL editor, in filename order.
          </li>
          <li>
            In Authentication → URL Configuration, set the Site URL to{" "}
            <code className="rounded bg-white/70 px-1">http://localhost:3000</code> and
            allow{" "}
            <code className="rounded bg-white/70 px-1">http://localhost:3000/**</code> as
            a redirect URL.
          </li>
          <li>Restart the dev server.</li>
        </ol>

        <p className="mt-5 text-sm text-amber-900/80">
          The project README has the full setup notes. Restart the dev server after
          changing <code className="rounded bg-white/70 px-1">.env.local</code>.
        </p>
      </div>
    </section>
  );
}
