import { ShotCard } from "@/components/shots/shot-card";
import type { ShotListItem } from "@/lib/types/app";

type ShotGridProps = {
  shots: ShotListItem[];
  likeable?: boolean;
  signedIn?: boolean;
};

export function ShotGrid({ shots, likeable, signedIn }: ShotGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {shots.map((shot) => (
        <ShotCard key={shot.id} shot={shot} likeable={likeable} signedIn={signedIn} />
      ))}
    </div>
  );
}
