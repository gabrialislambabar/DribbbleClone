export function SearchForm({ className }: { className?: string }) {
  return (
    <form action="/search" method="get" className={className}>
      <input
        type="search"
        name="q"
        placeholder="Search shots or designers"
        aria-label="Search shots or designers"
        className="h-9 w-full rounded-full border border-border bg-surface px-4 text-sm text-foreground outline-none placeholder:text-muted/70 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
      />
    </form>
  );
}
