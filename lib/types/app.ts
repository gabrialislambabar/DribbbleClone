import type { Tables } from "@/lib/types/database";

export type Profile = Omit<Tables<"profiles">, "search_vector">;
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
  like_count: number;
  comment_count: number;
  liked_by_me?: boolean;
  creator: {
    id: string;
    username: string;
    display_name: string;
    avatar_path: string | null;
  };
  tags: { id: number; name: string }[];
};

export type CommentItem = {
  id: string;
  shot_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar_path: string | null;
  };
};

export type DesignerListItem = {
  id: string;
  username: string;
  display_name: string;
  avatar_path: string | null;
  bio: string | null;
  follower_count: number;
  is_following?: boolean;
};

export type FollowListItem = {
  id: string;
  username: string;
  display_name: string;
  avatar_path: string | null;
  follower_count: number;
  following_count: number;
  is_following: boolean;
  followed_at: string;
};
