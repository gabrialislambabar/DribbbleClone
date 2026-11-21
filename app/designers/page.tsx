import type { Metadata } from "next";

import { DesignerDirectory } from "@/components/designers/designer-directory";
import { getDesigners } from "@/lib/designers/data";
import { buildDesignerHref, parseDesignerFilters } from "@/lib/designers/filters";

export const metadata: Metadata = {
  title: "Browse designers",
  description: "Find freelance designers and agencies for your next project.",
};

type DesignersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DesignersPage({ searchParams }: DesignersPageProps) {
  const filters = parseDesignerFilters(await searchParams);

  return (
    <DesignerDirectory
      key={buildDesignerHref(filters)}
      designers={getDesigners()}
      initialFilters={filters}
    />
  );
}
