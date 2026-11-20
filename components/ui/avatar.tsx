import Image from "next/image";

import { cn } from "@/lib/utils";

type AvatarProps = {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
};

export function Avatar({ src, name, size = 36, className }: AvatarProps) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?";

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        unoptimized={src.startsWith("blob:") || src.startsWith("data:")}
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <span
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.34) }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-brand/10 font-semibold text-brand",
        className,
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
