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
      ai_conversations: {
        Row: {
          ai_type: string
          created_at: string
          id: string
          messages: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_type: string
          created_at?: string
          id?: string
          messages?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_type?: string
          created_at?: string
          id?: string
          messages?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      discipline_activity_log: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string
          duration_seconds: number | null
          id: string
          input_length: number | null
          user_id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          input_length?: number | null
          user_id: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          input_length?: number | null
          user_id?: string
        }
        Relationships: []
      }
      discipline_challenges: {
        Row: {
          challenge_name: string
          created_at: string
          daily_requirement: Json
          days_completed: number
          days_missed: number
          description: string | null
          duration_days: number
          ends_at: string
          id: string
          is_exclusive: boolean
          started_at: string
          status: Database["public"]["Enums"]["challenge_status"]
          title_reward: string | null
          updated_at: string
          user_id: string
          xp_reward: number
          zero_tolerance: boolean
        }
        Insert: {
          challenge_name: string
          created_at?: string
          daily_requirement: Json
          days_completed?: number
          days_missed?: number
          description?: string | null
          duration_days: number
          ends_at: string
          id?: string
          is_exclusive?: boolean
          started_at?: string
          status?: Database["public"]["Enums"]["challenge_status"]
          title_reward?: string | null
          updated_at?: string
          user_id: string
          xp_reward?: number
          zero_tolerance?: boolean
        }
        Update: {
          challenge_name?: string
          created_at?: string
          daily_requirement?: Json
          days_completed?: number
          days_missed?: number
          description?: string | null
          duration_days?: number
          ends_at?: string
          id?: string
          is_exclusive?: boolean
          started_at?: string
          status?: Database["public"]["Enums"]["challenge_status"]
          title_reward?: string | null
          updated_at?: string
          user_id?: string
          xp_reward?: number
          zero_tolerance?: boolean
        }
        Relationships: []
      }
      discipline_profiles: {
        Row: {
          completion_rate: number
          created_at: string
          current_rank: Database["public"]["Enums"]["discipline_rank"]
          current_season: number
          current_streak: number
          days_inactive: number
          decay_rate: number
          difficulty_multiplier: number
          effort_quality: number
          honesty_factor: number
          id: string
          last_activity_at: string | null
          legacy_modifier: number
          longest_streak: number
          mastered_tasks: Json | null
          permanent_debuffs: Json | null
          rank_progress: number
          recovery_factor: number
          season_survived: boolean
          season_xp: number
          shadow_score: number
          total_failures: number
          total_tasks_completed: number
          total_tasks_missed: number
          total_xp: number
          updated_at: string
          user_id: string
          weekly_xp: number
        }
        Insert: {
          completion_rate?: number
          created_at?: string
          current_rank?: Database["public"]["Enums"]["discipline_rank"]
          current_season?: number
          current_streak?: number
          days_inactive?: number
          decay_rate?: number
          difficulty_multiplier?: number
          effort_quality?: number
          honesty_factor?: number
          id?: string
          last_activity_at?: string | null
          legacy_modifier?: number
          longest_streak?: number
          mastered_tasks?: Json | null
          permanent_debuffs?: Json | null
          rank_progress?: number
          recovery_factor?: number
          season_survived?: boolean
          season_xp?: number
          shadow_score?: number
          total_failures?: number
          total_tasks_completed?: number
          total_tasks_missed?: number
          total_xp?: number
          updated_at?: string
          user_id: string
          weekly_xp?: number
        }
        Update: {
          completion_rate?: number
          created_at?: string
          current_rank?: Database["public"]["Enums"]["discipline_rank"]
          current_season?: number
          current_streak?: number
          days_inactive?: number
          decay_rate?: number
          difficulty_multiplier?: number
          effort_quality?: number
          honesty_factor?: number
          id?: string
          last_activity_at?: string | null
          legacy_modifier?: number
          longest_streak?: number
          mastered_tasks?: Json | null
          permanent_debuffs?: Json | null
          rank_progress?: number
          recovery_factor?: number
          season_survived?: boolean
          season_xp?: number
          shadow_score?: number
          total_failures?: number
          total_tasks_completed?: number
          total_tasks_missed?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
          weekly_xp?: number
        }
        Relationships: []
      }
      discipline_seasons: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean
          name: string
          rank_retention_threshold: Database["public"]["Enums"]["discipline_rank"]
          season_number: number
          started_at: string
          survival_xp_threshold: number
          theme: string | null
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          rank_retention_threshold?: Database["public"]["Enums"]["discipline_rank"]
          season_number: number
          started_at?: string
          survival_xp_threshold?: number
          theme?: string | null
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          rank_retention_threshold?: Database["public"]["Enums"]["discipline_rank"]
          season_number?: number
          started_at?: string
          survival_xp_threshold?: number
          theme?: string | null
        }
        Relationships: []
      }
      discipline_tasks: {
        Row: {
          acceptable_miss_limit: number
          base_xp: number
          consecutive_completions: number
          created_at: string
          current_difficulty: number
          current_period_completions: number
          current_period_misses: number
          id: string
          is_active: boolean
          last_completion_at: string | null
          minimum_duration_minutes: number | null
          period_start_at: string | null
          requires_proof: boolean
          requires_reflection: boolean
          target_frequency: number
          task_name: string
          task_type: string
          times_mastered: number
          total_completions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          acceptable_miss_limit?: number
          base_xp?: number
          consecutive_completions?: number
          created_at?: string
          current_difficulty?: number
          current_period_completions?: number
          current_period_misses?: number
          id?: string
          is_active?: boolean
          last_completion_at?: string | null
          minimum_duration_minutes?: number | null
          period_start_at?: string | null
          requires_proof?: boolean
          requires_reflection?: boolean
          target_frequency?: number
          task_name: string
          task_type: string
          times_mastered?: number
          total_completions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          acceptable_miss_limit?: number
          base_xp?: number
          consecutive_completions?: number
          created_at?: string
          current_difficulty?: number
          current_period_completions?: number
          current_period_misses?: number
          id?: string
          is_active?: boolean
          last_completion_at?: string | null
          minimum_duration_minutes?: number | null
          period_start_at?: string | null
          requires_proof?: boolean
          requires_reflection?: boolean
          target_frequency?: number
          task_name?: string
          task_type?: string
          times_mastered?: number
          total_completions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exploit_detections: {
        Row: {
          details: Json | null
          detected_at: string
          detection_type: string
          id: string
          penalty_type: string | null
          penalty_value: number | null
          user_id: string
        }
        Insert: {
          details?: Json | null
          detected_at?: string
          detection_type: string
          id?: string
          penalty_type?: string | null
          penalty_value?: number | null
          user_id: string
        }
        Update: {
          details?: Json | null
          detected_at?: string
          detection_type?: string
          id?: string
          penalty_type?: string | null
          penalty_value?: number | null
          user_id?: string
        }
        Relationships: []
      }
      food_logs: {
        Row: {
          calories: number | null
          carbohydrates: number | null
          created_at: string
          fats: number | null
          food_name: string
          id: string
          image_url: string | null
          logged_at: string
          notes: string | null
          protein: number | null
          user_id: string
        }
        Insert: {
          calories?: number | null
          carbohydrates?: number | null
          created_at?: string
          fats?: number | null
          food_name: string
          id?: string
          image_url?: string | null
          logged_at?: string
          notes?: string | null
          protein?: number | null
          user_id: string
        }
        Update: {
          calories?: number | null
          carbohydrates?: number | null
          created_at?: string
          fats?: number | null
          food_name?: string
          id?: string
          image_url?: string | null
          logged_at?: string
          notes?: string | null
          protein?: number | null
          user_id?: string
        }
        Relationships: []
      }
      habit_streaks: {
        Row: {
          created_at: string
          current_streak: number
          habit_name: string
          habit_type: string | null
          id: string
          last_completed_at: string | null
          longest_streak: number
          points_earned: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          habit_name: string
          habit_type?: string | null
          id?: string
          last_completed_at?: string | null
          longest_streak?: number
          points_earned?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          habit_name?: string
          habit_type?: string | null
          id?: string
          last_completed_at?: string | null
          longest_streak?: number
          points_earned?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      houses: {
        Row: {
          area_sqft: number | null
          created_at: string
          description: string | null
          features: string[] | null
          id: string
          images: string[] | null
          is_approved: boolean
          is_available: boolean
          latitude: number | null
          location: string
          longitude: number | null
          nearby_places: string[] | null
          owner_id: string
          rental_price: number
          title: string
          updated_at: string
        }
        Insert: {
          area_sqft?: number | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          images?: string[] | null
          is_approved?: boolean
          is_available?: boolean
          latitude?: number | null
          location: string
          longitude?: number | null
          nearby_places?: string[] | null
          owner_id: string
          rental_price: number
          title: string
          updated_at?: string
        }
        Update: {
          area_sqft?: number | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          images?: string[] | null
          is_approved?: boolean
          is_available?: boolean
          latitude?: number | null
          location?: string
          longitude?: number | null
          nearby_places?: string[] | null
          owner_id?: string
          rental_price?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      medals: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          points_required: number
        }
        Insert: {
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
          points_required?: number
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          points_required?: number
        }
        Relationships: []
      }
      owner_admin_messages: {
        Row: {
          created_at: string
          house_id: string | null
          id: string
          is_from_admin: boolean
          message: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          house_id?: string | null
          id?: string
          is_from_admin?: boolean
          message: string
          sender_id: string
        }
        Update: {
          created_at?: string
          house_id?: string | null
          id?: string
          is_from_admin?: boolean
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_admin_messages_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      task_completions: {
        Row: {
          completed_at: string
          created_at: string
          duration_minutes: number | null
          effort_score: number | null
          id: string
          is_valid: boolean
          proof_url: string | null
          reflection_text: string | null
          task_id: string | null
          user_id: string
          xp_awarded: number
        }
        Insert: {
          completed_at?: string
          created_at?: string
          duration_minutes?: number | null
          effort_score?: number | null
          id?: string
          is_valid?: boolean
          proof_url?: string | null
          reflection_text?: string | null
          task_id?: string | null
          user_id: string
          xp_awarded?: number
        }
        Update: {
          completed_at?: string
          created_at?: string
          duration_minutes?: number | null
          effort_score?: number | null
          id?: string
          is_valid?: boolean
          proof_url?: string | null
          reflection_text?: string | null
          task_id?: string | null
          user_id?: string
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "discipline_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_levels: {
        Row: {
          current_level: number
          id: string
          last_activity_date: string | null
          total_points: number
          updated_at: string
          user_id: string
          weekly_points: number
        }
        Insert: {
          current_level?: number
          id?: string
          last_activity_date?: string | null
          total_points?: number
          updated_at?: string
          user_id: string
          weekly_points?: number
        }
        Update: {
          current_level?: number
          id?: string
          last_activity_date?: string | null
          total_points?: number
          updated_at?: string
          user_id?: string
          weekly_points?: number
        }
        Relationships: []
      }
      user_medals: {
        Row: {
          earned_at: string
          id: string
          medal_id: string
          user_id: string
        }
        Insert: {
          earned_at?: string
          id?: string
          medal_id: string
          user_id: string
        }
        Update: {
          earned_at?: string
          id?: string
          medal_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_medals_medal_id_fkey"
            columns: ["medal_id"]
            isOneToOne: false
            referencedRelation: "medals"
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
      user_titles: {
        Row: {
          can_be_lost: boolean
          earned_at: string
          earned_from: string | null
          id: string
          is_active: boolean
          source_id: string | null
          title_description: string | null
          title_name: string
          user_id: string
        }
        Insert: {
          can_be_lost?: boolean
          earned_at?: string
          earned_from?: string | null
          id?: string
          is_active?: boolean
          source_id?: string | null
          title_description?: string | null
          title_name: string
          user_id: string
        }
        Update: {
          can_be_lost?: boolean
          earned_at?: string
          earned_from?: string | null
          id?: string
          is_active?: boolean
          source_id?: string | null
          title_description?: string | null
          title_name?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "house_owner" | "admin"
      challenge_status: "active" | "completed" | "failed" | "abandoned"
      discipline_rank: "Iron" | "Steel" | "Titan" | "Ascendant" | "Immortal"
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
      app_role: ["user", "house_owner", "admin"],
      challenge_status: ["active", "completed", "failed", "abandoned"],
      discipline_rank: ["Iron", "Steel", "Titan", "Ascendant", "Immortal"],
    },
  },
} as const
