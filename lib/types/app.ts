import type { Tables } from "@/lib/types/database";

export type Profile = Tables<"profiles">;
export type Category = Tables<"categories">;
export type Tag = Tables<"tags">;
export type Shot = Tables<"shots">;

export type ShotListItem = {
  id: string;
  title: string;
  description: string | null;
  cover_image_path: string;
  status: Shot["status"];
  category_id: string;
  category_name: string;
  created_at: string;
  published_at: string | null;
  creator: {
    id: string;
    username: string;
    display_name: string;
    avatar_path: string | null;
  };
  tags: { id: number; name: string }[];
};
