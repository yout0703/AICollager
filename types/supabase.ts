// Supabase TypeScript 类型定义
// 这个文件将通过 supabase gen types 命令自动生成
// 手动创建的基础类型，之后可以被自动生成的类型覆盖

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
      ac_users: {
        Row: {
          id: number
          uuid: string
          clerk_id: string
          email: string
          username: string | null
          avatar_url: string | null
          display_name: string | null
          credits: number
          total_earned_credits: number
          total_used_credits: number
          trial_start_date: string | null
          trial_usage_count: number
          is_premium: boolean
          premium_expires_at: string | null
          status: string
          last_login_at: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: never
          uuid?: string
          clerk_id: string
          email: string
          username?: string | null
          avatar_url?: string | null
          display_name?: string | null
          credits?: number
          total_earned_credits?: number
          total_used_credits?: number
          trial_start_date?: string | null
          trial_usage_count?: number
          is_premium?: boolean
          premium_expires_at?: string | null
          status?: string
          last_login_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: never
          uuid?: string
          clerk_id?: string
          email?: string
          username?: string | null
          avatar_url?: string | null
          display_name?: string | null
          credits?: number
          total_earned_credits?: number
          total_used_credits?: number
          trial_start_date?: string | null
          trial_usage_count?: number
          is_premium?: boolean
          premium_expires_at?: string | null
          status?: string
          last_login_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      ac_collages: {
        Row: {
          id: number
          uuid: string
          user_id: string | null
          session_id: string | null
          title: string
          description: string | null
          canvas_config: Json
          elements: Json
          preview_url: string | null
          full_image_url: string | null
          thumbnail_url: string | null
          status: string
          generation_status: string
          visibility: string
          view_count: number
          download_count: number
          like_count: number
          ai_processing_time: number | null
          ai_model: string | null
          ai_cost: number
          metadata: Json
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: never
          uuid?: string
          user_id?: string | null
          session_id?: string | null
          title: string
          description?: string | null
          canvas_config?: Json
          elements?: Json
          preview_url?: string | null
          full_image_url?: string | null
          thumbnail_url?: string | null
          status?: string
          generation_status?: string
          visibility?: string
          view_count?: number
          download_count?: number
          like_count?: number
          ai_processing_time?: number | null
          ai_model?: string | null
          ai_cost?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: never
          uuid?: string
          user_id?: string | null
          session_id?: string | null
          title?: string
          description?: string | null
          canvas_config?: Json
          elements?: Json
          preview_url?: string | null
          full_image_url?: string | null
          thumbnail_url?: string | null
          status?: string
          generation_status?: string
          visibility?: string
          view_count?: number
          download_count?: number
          like_count?: number
          ai_processing_time?: number | null
          ai_model?: string | null
          ai_cost?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      ac_credit_transactions: {
        Row: {
          id: number
          uuid: string
          user_id: string
          amount: number
          balance_after: number
          transaction_type: string
          title: string | null
          description: string | null
          related_entity_type: string | null
          related_entity_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: never
          uuid?: string
          user_id: string
          amount: number
          balance_after: number
          transaction_type: string
          title?: string | null
          description?: string | null
          related_entity_type?: string | null
          related_entity_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: never
          uuid?: string
          user_id?: string
          amount?: number
          balance_after?: number
          transaction_type?: string
          title?: string | null
          description?: string | null
          related_entity_type?: string | null
          related_entity_id?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      ac_icons: {
        Row: {
          id: number
          uuid: string
          icon_id: string
          name: string
          category: string | null
          subcategory: string | null
          svg_data: string
          tags: string[] | null
          keywords: string[] | null
          style: string | null
          color_scheme: string | null
          size_info: Json
          status: string
          usage_count: number
          popularity_score: number
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: never
          uuid?: string
          icon_id: string
          name: string
          category?: string | null
          subcategory?: string | null
          svg_data: string
          tags?: string[] | null
          keywords?: string[] | null
          style?: string | null
          color_scheme?: string | null
          size_info?: Json
          status?: string
          usage_count?: number
          popularity_score?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: never
          uuid?: string
          icon_id?: string
          name?: string
          category?: string | null
          subcategory?: string | null
          svg_data?: string
          tags?: string[] | null
          keywords?: string[] | null
          style?: string | null
          color_scheme?: string | null
          size_info?: Json
          status?: string
          usage_count?: number
          popularity_score?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 