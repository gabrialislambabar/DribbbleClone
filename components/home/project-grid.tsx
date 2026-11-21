import { ProjectCard } from "@/components/home/project-card";
import type { ShotListItem } from "@/lib/types/app";

type ProjectGridProps = {
  shots: ShotListItem[];
  signedIn: boolean;
};

const PRO_CREATORS = new Set(["maya_designs", "leo_ui", "sana_brand"]);

export function ProjectGrid({ shots, signedIn }: ProjectGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {shots.map((shot) => (
        <ProjectCard
          key={shot.id}
          shot={shot}
          signedIn={signedIn}
          pro={PRO_CREATORS.has(shot.creator.username)}
        />
      ))}
    </div>
  );
}
