// lib/supabase/database.types.ts
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
          created_at: string
          user_id: string
          start_time: string
          end_time: string | null
          duration: number | null
          task_name: string | null
          category: string | null
          is_completed: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          start_time: string
          end_time?: string | null
          duration?: number | null
          task_name?: string | null
          category?: string | null
          is_completed?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          start_time?: string
          end_time?: string | null
          duration?: number | null
          task_name?: string | null
          category?: string | null
          is_completed?: boolean
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}