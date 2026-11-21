export function RibbonBand({
  variant = "top",
  className,
}: {
  variant?: "top" | "middle" | "bottom";
  className?: string;
}) {
  const gradientId = `ribbon-${variant}`;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 overflow-hidden ${className ?? ""}`}
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 1440 240"
        preserveAspectRatio="none"
        role="presentation"
        focusable="false"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f7b6d2" />
            <stop offset="45%" stopColor="#f3d2e4" />
            <stop offset="72%" stopColor="#cfd4f3" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>

        {variant === "top" ? (
          <path
            d="M-40 190 C 260 40, 520 20, 760 96 C 1000 172, 1240 210, 1480 150 L 1480 260 L -40 260 Z"
            fill={`url(#${gradientId})`}
          />
        ) : null}

        {variant === "middle" ? (
          <path
            d="M-40 210 C 320 60, 620 30, 860 110 C 1080 182, 1260 60, 1480 40 L 1480 210 C 1200 240, 980 150, 760 200 C 500 260, 200 170, -40 260 Z"
            fill={`url(#${gradientId})`}
          />
        ) : null}

        {variant === "bottom" ? (
          <path
            d="M-40 60 C 240 210, 520 200, 780 130 C 1020 66, 1260 30, 1480 110 L 1480 260 L -40 260 Z"
            fill={`url(#${gradientId})`}
          />
        ) : null}
      </svg>
    </div>
  );
}
