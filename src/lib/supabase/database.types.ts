// src/lib/supabase/database.types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          username: string | null
          avatar_url: string | null
          total_focus_time: number
          streak_days: number
          last_active_date: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          username?: string | null
          avatar_url?: string | null
          total_focus_time?: number
          streak_days?: number
          last_active_date?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          username?: string | null
          avatar_url?: string | null
          total_focus_time?: number
          streak_days?: number
          last_active_date?: string | null
        }
      }
      focus_sessions: {
        Row: {
          id: string
          user_id: string
          task_id: string | null
          start_time: string
          end_time: string | null
          duration_minutes: number | null
          technique_id: string | null
          is_completed: boolean | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          task_id?: string | null
          start_time: string
          end_time?: string | null
          duration_minutes?: number | null
          technique_id?: string | null
          is_completed?: boolean | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string | null
          start_time?: string
          end_time?: string | null
          duration_minutes?: number | null
          technique_id?: string | null
          is_completed?: boolean | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      study_rooms: {
        Row: {
          id: string
          created_at: string
          name: string
          creator_id: string
          is_private: boolean
          access_code: string | null
          current_participants: number
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          creator_id: string
          is_private?: boolean
          access_code?: string | null
          current_participants?: number
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          creator_id?: string
          is_private?: boolean
          access_code?: string | null
          current_participants?: number
        }
      }
      room_participants: {
        Row: {
          id: string
          created_at: string
          room_id: string
          user_id: string
          joined_at: string
          left_at: string | null
          focus_time: number
        }
        Insert: {
          id?: string
          created_at?: string
          room_id: string
          user_id: string
          joined_at?: string
          left_at?: string | null
          focus_time?: number
        }
        Update: {
          id?: string
          created_at?: string
          room_id?: string
          user_id?: string
          joined_at?: string
          left_at?: string | null
          focus_time?: number
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          status: string
          priority: string | null
          duration_minutes: number | null
          completed_at: string | null
          created_at: string | null
          updated_at: string | null
          deleted: boolean | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          status?: string
          priority?: string | null
          duration_minutes?: number | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted?: boolean | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          status?: string
          priority?: string | null
          duration_minutes?: number | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted?: boolean | null
        }
      }
      time_management_techniques: {
        Row: {
          id: string
          name: string
          description: string
          focus_time: number
          break_length: number
          target_sessions: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          name: string
          description: string
          focus_time: number
          break_length: number
          target_sessions: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string
          focus_time?: number
          break_length?: number
          target_sessions?: number
          created_at?: string | null
          updated_at?: string | null
        }
      }
      timer_settings: {
        Row: {
          id: string
          user_id: string
          technique_id: string
          focus_time: number
          break_length: number
          target_sessions: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          technique_id: string
          focus_time: number
          break_length: number
          target_sessions: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          technique_id?: string
          focus_time?: number
          break_length?: number
          target_sessions?: number
          created_at?: string | null
          updated_at?: string | null
        }
      }
      achievements: {
        Row: {
          id: string
          name: string
          description: string
          icon_name: string
          category: string
          requirement_type: string
          requirement_value: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          icon_name: string
          category: string
          requirement_type: string
          requirement_value: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon_name?: string
          category?: string
          requirement_type?: string
          requirement_value?: number
          created_at?: string
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          progress: number
          unlocked: boolean
          unlocked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          progress?: number
          unlocked?: boolean
          unlocked_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          progress?: number
          unlocked?: boolean
          unlocked_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_focus_time: {
        Args: {
          minutes_to_add: number
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Achievement types for frontend use
export type Achievement = Database['public']['Tables']['achievements']['Row'];
export type UserAchievement = Database['public']['Tables']['user_achievements']['Row'] & {
  achievement: Achievement
};

// Achievement with progress information
export type AchievementWithProgress = Achievement & {
  progress: number;
  unlocked: boolean;
  unlocked_at: string | null;
};