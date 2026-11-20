import Link from "next/link";

import { buttonClasses } from "@/components/ui/button";

type LoadMoreProps = {
  href: string;
  label?: string;
};

export function LoadMore({ href, label = "Load more" }: LoadMoreProps) {
  return (
    <div className="mt-10 flex justify-center">
      <Link href={href} className={buttonClasses("secondary")}>
        {label}
      </Link>
    </div>
  );
}
