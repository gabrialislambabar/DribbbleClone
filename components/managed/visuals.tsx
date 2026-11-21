export function RosterVisual() {
  const people = [
    { name: "Designer 01", role: "Brand", tint: "from-fuchsia-200 to-rose-200" },
    { name: "Designer 02", role: "Motion", tint: "from-sky-200 to-indigo-200" },
    { name: "Designer 03", role: "Web", tint: "from-emerald-200 to-teal-200" },
    { name: "Designer 04", role: "Print", tint: "from-amber-200 to-orange-200" },
  ];

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">Your Studio roster</p>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
          Approved
        </span>
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-3">
        {people.map((person) => (
          <li
            key={person.name}
            className="flex min-w-0 items-center gap-2 rounded-xl border border-border p-2"
          >
            <span
              aria-hidden="true"
              className={`h-8 w-8 shrink-0 rounded-full bg-gradient-to-br ${person.tint}`}
            />
            <span className="min-w-0">
              <span className="block truncate text-xs font-medium text-foreground">
                {person.name}
              </span>
              <span className="block truncate text-[11px] text-muted">{person.role}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
        <p className="text-xs text-muted">20–30 designers matched to your brand</p>
      </div>
    </div>
  );
}

export function ShortlistVisual() {
  const rows = [
    { name: "Designer A", note: "Campaign key visuals", score: "1 of 8" },
    { name: "Designer B", note: "Social and paid ads", score: "2 of 8" },
    { name: "Designer C", note: "Motion and video", score: "3 of 8" },
  ];

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <p className="text-sm font-semibold text-foreground">Campaign shortlist</p>
      <ul className="mt-3 divide-y divide-border">
        {rows.map((row, index) => (
          <li key={row.name} className="flex items-center justify-between gap-3 py-2.5">
            <span className="min-w-0">
              <span className="block truncate text-xs font-medium text-foreground">
                {row.name}
              </span>
              <span className="block truncate text-[11px] text-muted">{row.note}</span>
            </span>
            <span
              className={
                index === 0
                  ? "shrink-0 rounded-full bg-brand px-2 py-0.5 text-[11px] font-medium text-white"
                  : "shrink-0 text-[11px] text-muted"
              }
            >
              {index === 0 ? "Pick as lead" : row.score}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TrackerVisual() {
  const stages = [
    { label: "Concept", state: "done" },
    { label: "Draft", state: "done" },
    { label: "Final", state: "review" },
  ];

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">Holiday campaign</p>
        <span className="text-[11px] text-muted">3 files</span>
      </div>

      <ol className="mt-4 space-y-2">
        {stages.map((stage, index) => (
          <li
            key={stage.label}
            className="flex items-center gap-3 rounded-xl border border-border px-3 py-2"
          >
            <span
              aria-hidden="true"
              className={
                stage.state === "done"
                  ? "flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white"
                  : "flex h-5 w-5 items-center justify-center rounded-full border border-border text-[11px] font-semibold text-muted"
              }
            >
              {stage.state === "done" ? "✓" : index + 1}
            </span>
            <span className="flex-1 text-xs font-medium text-foreground">
              {stage.label}
            </span>
            <span
              className={
                stage.state === "done"
                  ? "text-[11px] text-emerald-700"
                  : "text-[11px] text-amber-700"
              }
            >
              {stage.state === "done" ? "Done" : "In review"}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function CalendarVisual() {
  const events = [
    { day: "Mon", label: "Product launch", tint: "bg-brand/15 text-brand" },
    { day: "Thu", label: "Seasonal sale", tint: "bg-indigo-50 text-indigo-700" },
    { day: "Sat", label: "Event promo", tint: "bg-emerald-50 text-emerald-700" },
  ];

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <p className="text-sm font-semibold text-foreground">Campaign calendar</p>
      <div className="mt-3 grid grid-cols-7 gap-1" aria-hidden="true">
        {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
          <span key={index} className="text-center text-[10px] text-muted">
            {day}
          </span>
        ))}
        {Array.from({ length: 21 }).map((_, index) => (
          <span
            key={index}
            className={
              [3, 10, 17].includes(index)
                ? "aspect-square rounded-md bg-brand/15"
                : "aspect-square rounded-md bg-surface"
            }
          />
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {events.map((event) => (
          <li key={event.label} className="flex items-center gap-2">
            <span
              className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${event.tint}`}
            >
              {event.day}
            </span>
            <span className="min-w-0 truncate text-xs text-foreground">
              {event.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
