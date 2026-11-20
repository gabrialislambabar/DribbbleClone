import type { Tables } from "@/lib/types/database";

export type Profile = Omit<Tables<"profiles">, "search_vector" | "is_admin">;
export type Category = Tables<"categories">;
export type Tag = Tables<"tags">;
export type Shot = Tables<"shots">;

export type CoverCredit = {
  name: string;
  url: string;
  photoUrl: string;
  provider: string;
};

export type ShotListItem = {
  id: string;
  title: string;
  description: string | null;
  cover_image_path: string;
  cover_credit: CoverCredit | null;
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

export type ReportTargetType = "shot" | "comment" | "profile";
export type ReportReason = "spam" | "abuse" | "copyright" | "other";
export type ReportStatus = "open" | "reviewed" | "dismissed" | "actioned";

export type ReportItem = {
  id: string;
  target_type: ReportTargetType;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  reporter: {
    username: string;
    display_name: string;
  } | null;
  shot: {
    id: string;
    title: string;
    status: string;
    creator_username: string;
    creator_display_name: string;
  } | null;
  comment: {
    id: string;
    body: string;
    shot_id: string;
    author_username: string;
    author_display_name: string;
  } | null;
  profile: {
    username: string;
    display_name: string;
  } | null;
};

export type NotificationType = "follow" | "comment";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  read_at: string | null;
  created_at: string;
  shot_id: string | null;
  comment_id: string | null;
  actor: {
    username: string;
    display_name: string;
    avatar_path: string | null;
  } | null;
  shot: {
    id: string;
    title: string;
  } | null;
  comment: {
    id: string;
    body: string;
  } | null;
  href: string;
};

export type NotificationPreferences = {
  follows: boolean;
  comments: boolean;
};
