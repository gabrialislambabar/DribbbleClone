export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ShotStatus = "draft" | "published";

export type ShotFeedRow = {
  id: string;
  title: string;
  cover_image_path: string;
  category_id: string;
  category_name: string;
  creator_id: string;
  creator_username: string;
  creator_display_name: string;
  creator_avatar_path: string | null;
  published_at: string;
  like_count: number;
  comment_count: number;
  rank_score: number | null;
  tags: { id: number; name: string }[] | null;
};

export type DesignerSearchRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_path: string | null;
  bio: string | null;
  follower_count: number;
  rank_score: number | null;
};

export type FollowListRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_path: string | null;
  follower_count: number;
  following_count: number;
  is_following: boolean;
  followed_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          bio: string | null;
          portfolio_url: string | null;
          avatar_path: string | null;
          follower_count: number;
          following_count: number;
          search_vector: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          bio?: string | null;
          portfolio_url?: string | null;
          avatar_path?: string | null;
          follower_count?: number;
          following_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string;
          bio?: string | null;
          portfolio_url?: string | null;
          avatar_path?: string | null;
          follower_count?: number;
          following_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          sort_order: number;
        };
        Insert: {
          id: string;
          name: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          name?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: number;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      shots: {
        Row: {
          id: string;
          creator_id: string;
          category_id: string;
          title: string;
          description: string | null;
          cover_image_path: string;
          status: ShotStatus;
          like_count: number;
          comment_count: number;
          tags_text: string;
          search_vector: unknown;
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          creator_id: string;
          category_id: string;
          title: string;
          description?: string | null;
          cover_image_path: string;
          status?: ShotStatus;
          like_count?: number;
          comment_count?: number;
          tags_text?: string;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Update: {
          id?: string;
          creator_id?: string;
          category_id?: string;
          title?: string;
          description?: string | null;
          cover_image_path?: string;
          status?: ShotStatus;
          like_count?: number;
          comment_count?: number;
          tags_text?: string;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "shots_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shots_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      shot_tags: {
        Row: {
          shot_id: string;
          tag_id: number;
        };
        Insert: {
          shot_id: string;
          tag_id: number;
        };
        Update: {
          shot_id?: string;
          tag_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "shot_tags_shot_id_fkey";
            columns: ["shot_id"];
            isOneToOne: false;
            referencedRelation: "shots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shot_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      shot_likes: {
        Row: {
          user_id: string;
          shot_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          shot_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          shot_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shot_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shot_likes_shot_id_fkey";
            columns: ["shot_id"];
            isOneToOne: false;
            referencedRelation: "shots";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          id: string;
          shot_id: string;
          author_id: string;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shot_id: string;
          author_id: string;
          body: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shot_id?: string;
          author_id?: string;
          body?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_shot_id_fkey";
            columns: ["shot_id"];
            isOneToOne: false;
            referencedRelation: "shots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follows_following_id_fkey";
            columns: ["following_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      create_shot: {
        Args: {
          p_title: string;
          p_description: string | null;
          p_category_id: string;
          p_tags: string[];
          p_cover_path: string;
        };
        Returns: string;
      };
      update_shot: {
        Args: {
          p_shot_id: string;
          p_title: string;
          p_description: string | null;
          p_category_id: string;
          p_tags: string[];
          p_cover_path: string;
        };
        Returns: undefined;
      };
      set_shot_status: {
        Args: {
          p_shot_id: string;
          p_status: ShotStatus;
        };
        Returns: undefined;
      };
      set_shot_tags: {
        Args: {
          p_shot_id: string;
          p_tags: string[];
        };
        Returns: undefined;
      };
      get_shots_feed: {
        Args: {
          p_sort?: string;
          p_category_id?: string | null;
          p_tag?: string | null;
          p_creator?: string | null;
          p_days?: number | null;
          p_cursor_score?: number | null;
          p_cursor_time?: string | null;
          p_cursor_id?: string | null;
          p_limit?: number;
        };
        Returns: ShotFeedRow[];
      };
      search_shots: {
        Args: {
          p_query: string;
          p_category_id?: string | null;
          p_creator?: string | null;
          p_cursor_rank?: number | null;
          p_cursor_time?: string | null;
          p_cursor_id?: string | null;
          p_limit?: number;
        };
        Returns: ShotFeedRow[];
      };
      search_designers: {
        Args: {
          p_query: string;
          p_cursor_rank?: number | null;
          p_cursor_username?: string | null;
          p_limit?: number;
        };
        Returns: DesignerSearchRow[];
      };
      get_followers: {
        Args: {
          p_profile_id: string;
          p_cursor_time?: string | null;
          p_cursor_id?: string | null;
          p_limit?: number;
        };
        Returns: FollowListRow[];
      };
      get_following: {
        Args: {
          p_profile_id: string;
          p_cursor_time?: string | null;
          p_cursor_id?: string | null;
          p_limit?: number;
        };
        Returns: FollowListRow[];
      };
      shot_tags_json: {
        Args: {
          p_shot_id: string;
        };
        Returns: Json;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
