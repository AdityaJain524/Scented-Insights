export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_extracted_notes: {
        Row: {
          created_at: string
          extracted_emotions: Json | null
          extracted_notes: Json
          id: string
          post_id: string
          processed_at: string | null
          processing_status: string
        }
        Insert: {
          created_at?: string
          extracted_emotions?: Json | null
          extracted_notes: Json
          id?: string
          post_id: string
          processed_at?: string | null
          processing_status?: string
        }
        Update: {
          created_at?: string
          extracted_emotions?: Json | null
          extracted_notes?: Json
          id?: string
          post_id?: string
          processed_at?: string | null
          processing_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_extracted_notes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "fragrance_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          badge_type: string
          description: string | null
          earned_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          badge_type: string
          description?: string | null
          earned_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          badge_type?: string
          description?: string | null
          earned_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "fragrance_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_endorsements: {
        Row: {
          comment: string | null
          created_at: string | null
          endorsement_type: string
          expert_id: string
          id: string
          post_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          endorsement_type: string
          expert_id: string
          id?: string
          post_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          endorsement_type?: string
          expert_id?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_endorsements_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "fragrance_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      flagged_posts: {
        Row: {
          created_at: string | null
          details: string | null
          flagged_by: string
          id: string
          post_id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          flagged_by: string
          id?: string
          post_id: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          flagged_by?: string
          id?: string
          post_id?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flagged_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "fragrance_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      fragrance_collection: {
        Row: {
          collection_name: string
          created_at: string
          id: string
          notes: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          collection_name?: string
          created_at?: string
          id?: string
          notes?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          collection_name?: string
          created_at?: string
          id?: string
          notes?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fragrance_collection_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "fragrance_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      fragrance_notes: {
        Row: {
          id: string
          name: string
          note_type: Database["public"]["Enums"]["note_type"]
          post_id: string
        }
        Insert: {
          id?: string
          name: string
          note_type: Database["public"]["Enums"]["note_type"]
          post_id: string
        }
        Update: {
          id?: string
          name?: string
          note_type?: Database["public"]["Enums"]["note_type"]
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fragrance_notes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "fragrance_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      fragrance_posts: {
        Row: {
          author_id: string
          brand_name: string | null
          comments_count: number | null
          content: string
          created_at: string
          credibility_rating: number | null
          expert_endorsement_count: number | null
          fragrance_name: string
          helpful_count: number | null
          id: string
          image_url: string | null
          is_verified: boolean | null
          likes_count: number | null
          longevity: number | null
          post_type: Database["public"]["Enums"]["post_type"]
          projection: number | null
          saves_count: number | null
          sustainability_notes: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          brand_name?: string | null
          comments_count?: number | null
          content: string
          created_at?: string
          credibility_rating?: number | null
          expert_endorsement_count?: number | null
          fragrance_name: string
          helpful_count?: number | null
          id?: string
          image_url?: string | null
          is_verified?: boolean | null
          likes_count?: number | null
          longevity?: number | null
          post_type?: Database["public"]["Enums"]["post_type"]
          projection?: number | null
          saves_count?: number | null
          sustainability_notes?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          brand_name?: string | null
          comments_count?: number | null
          content?: string
          created_at?: string
          credibility_rating?: number | null
          expert_endorsement_count?: number | null
          fragrance_name?: string
          helpful_count?: number | null
          id?: string
          image_url?: string | null
          is_verified?: boolean | null
          likes_count?: number | null
          longevity?: number | null
          post_type?: Database["public"]["Enums"]["post_type"]
          projection?: number | null
          saves_count?: number | null
          sustainability_notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      helpful_votes: {
        Row: {
          created_at: string | null
          id: string
          is_helpful: boolean
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_helpful: boolean
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_helpful?: boolean
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "helpful_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "fragrance_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      hidden_posts: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hidden_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "fragrance_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_achievements: {
        Row: {
          achievement_type: string
          description: string | null
          earned_at: string
          icon: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          achievement_type: string
          description?: string | null
          earned_at?: string
          icon?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          achievement_type?: string
          description?: string | null
          earned_at?: string
          icon?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_modules: {
        Row: {
          content: string
          created_at: string
          id: string
          order_index: number
          path_id: string
          quiz_questions: Json | null
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          order_index?: number
          path_id: string
          quiz_questions?: Json | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          order_index?: number
          path_id?: string
          quiz_questions?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_modules_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          category: string
          cover_image_url: string | null
          created_at: string
          description: string
          difficulty: Database["public"]["Enums"]["expertise_level"]
          estimated_hours: number
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          cover_image_url?: string | null
          created_at?: string
          description: string
          difficulty?: Database["public"]["Enums"]["expertise_level"]
          estimated_hours?: number
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string
          difficulty?: Database["public"]["Enums"]["expertise_level"]
          estimated_hours?: number
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      learning_streaks: {
        Row: {
          current_streak: number
          id: string
          last_activity_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string
          comment_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          post_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id: string
          comment_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          post_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string
          comment_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          post_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "fragrance_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_emotions: {
        Row: {
          emotion: string
          id: string
          post_id: string
        }
        Insert: {
          emotion: string
          id?: string
          post_id: string
        }
        Update: {
          emotion?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_emotions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "fragrance_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "fragrance_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_occasions: {
        Row: {
          id: string
          occasion: string
          post_id: string
        }
        Insert: {
          id?: string
          occasion: string
          post_id: string
        }
        Update: {
          id?: string
          occasion?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_occasions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "fragrance_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_saves: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "fragrance_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          credibility_score: number | null
          display_name: string
          expertise_level: Database["public"]["Enums"]["expertise_level"] | null
          followers_count: number | null
          following_count: number | null
          id: string
          interested_in_sustainability: boolean | null
          location: string | null
          preferred_language: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          credibility_score?: number | null
          display_name: string
          expertise_level?:
            | Database["public"]["Enums"]["expertise_level"]
            | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          interested_in_sustainability?: boolean | null
          location?: string | null
          preferred_language?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          credibility_score?: number | null
          display_name?: string
          expertise_level?:
            | Database["public"]["Enums"]["expertise_level"]
            | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          interested_in_sustainability?: boolean | null
          location?: string | null
          preferred_language?: string | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      user_interests: {
        Row: {
          created_at: string
          id: string
          interest_type: string
          interest_value: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interest_type: string
          interest_value: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interest_type?: string
          interest_value?: string
          user_id?: string
        }
        Relationships: []
      }
      user_learning_progress: {
        Row: {
          completed_at: string | null
          completed_modules: string[] | null
          current_module_id: string | null
          id: string
          path_id: string
          quiz_scores: Json | null
          started_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_modules?: string[] | null
          current_module_id?: string | null
          id?: string
          path_id: string
          quiz_scores?: Json | null
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_modules?: string[] | null
          current_module_id?: string | null
          id?: string
          path_id?: string
          quiz_scores?: Json | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_learning_progress_current_module_id_fkey"
            columns: ["current_module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_learning_progress_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_credibility_score: {
        Args: { target_user_id: string }
        Returns: number
      }
      check_and_award_badges: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_follow_counts: {
        Args: { followed: string; follower: string; is_follow: boolean }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      expertise_level: "beginner" | "explorer" | "enthusiast" | "expert"
      note_type: "top" | "heart" | "base"
      post_type: "review" | "story" | "comparison" | "educational"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      expertise_level: ["beginner", "explorer", "enthusiast", "expert"],
      note_type: ["top", "heart", "base"],
      post_type: ["review", "story", "comparison", "educational"],
    },
  },
} as const
