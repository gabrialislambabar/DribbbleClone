import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center bg-surface px-4 py-16">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
