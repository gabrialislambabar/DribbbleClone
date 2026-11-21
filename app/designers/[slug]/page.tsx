import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DesignerProfile } from "@/components/designers/designer-profile";
import { getDesignerBySlug, getDesigners } from "@/lib/designers/data";

type DesignerPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getDesigners().map((designer) => ({ slug: designer.slug }));
}

export async function generateMetadata({ params }: DesignerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const designer = getDesignerBySlug(slug);

  if (!designer) {
    return { title: "Designer not found" };
  }

  return {
    title: `${designer.name} — Freelance designer`,
    description: designer.tagline,
  };
}

export default async function DesignerPage({ params }: DesignerPageProps) {
  const { slug } = await params;
  const designer = getDesignerBySlug(slug);

  if (!designer) {
    notFound();
  }

  return <DesignerProfile designer={designer} />;
}
