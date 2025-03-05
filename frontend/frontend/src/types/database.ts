export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string
          name: string
          description: string
          creator_id: string
          slack_channel_id: string | null
          status: 'pending' | 'active' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          creator_id: string
          slack_channel_id?: string | null
          status?: 'pending' | 'active' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          creator_id?: string
          slack_channel_id?: string | null
          status?: 'pending' | 'active' | 'suspended'
          created_at?: string
          updated_at?: string
        }
      }
      plans: {
        Row: {
          id: string
          group_id: string
          name: string
          description: string
          price: number
          features: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          name: string
          description: string
          price: number
          features?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          name?: string
          description?: string
          price?: number
          features?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: string
          current_period_start: string
          current_period_end: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          status?: string
          current_period_start: string
          current_period_end: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          status?: string
          current_period_start?: string
          current_period_end?: string
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
      group_status: 'pending' | 'active' | 'suspended'
    }
  }
} 