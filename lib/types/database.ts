export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ShotStatus = "draft" | "published";

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
