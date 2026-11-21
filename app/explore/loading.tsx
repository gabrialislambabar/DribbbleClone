export default function ExploreLoading() {
  return (
    <div
      className="mx-auto w-full max-w-6xl px-4 py-8"
      aria-busy="true"
      aria-label="Loading projects"
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-10 w-32 animate-pulse rounded-full bg-surface" />
        <div className="h-10 min-w-40 flex-1 animate-pulse rounded-full bg-surface" />
        <div className="h-10 w-28 animate-pulse rounded-full bg-surface" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[4/3] animate-pulse rounded-2xl bg-surface"
          />
        ))}
      </div>
    </div>
  );
}
