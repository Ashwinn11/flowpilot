import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create Supabase client with optimized configuration for browser
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'flowpilot-web'
    }
  }
})

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          timezone: string
          work_hours: {
            start: string
            end: string
            days: number[]
          }
          trial_started_at: string | null
          is_pro_user: boolean
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          timezone?: string
          work_hours?: {
            start: string
            end: string
            days: number[]
          }
          trial_started_at?: string | null
          is_pro_user?: boolean
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          timezone?: string
          work_hours?: {
            start: string
            end: string
            days: number[]
          }
          trial_started_at?: string | null
          is_pro_user?: boolean
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          duration: number
          priority: 'low' | 'medium' | 'high' | 'urgent'
          archetype: 'deep' | 'admin' | 'creative' | 'reactive' | 'collaborative' | 'analytical'
          status: 'pending' | 'in_progress' | 'completed' | 'skipped'
          scheduled_at: string | null
          completed_at: string | null
          skipped_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          duration?: number
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          archetype?: 'deep' | 'admin' | 'creative' | 'reactive' | 'collaborative' | 'analytical'
          status?: 'pending' | 'in_progress' | 'completed' | 'skipped'
          scheduled_at?: string | null
          completed_at?: string | null
          skipped_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          duration?: number
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          archetype?: 'deep' | 'admin' | 'creative' | 'reactive' | 'collaborative' | 'analytical'
          status?: 'pending' | 'in_progress' | 'completed' | 'skipped'
          scheduled_at?: string | null
          completed_at?: string | null
          skipped_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_calendar_events: {
        Row: {
          id: string
          user_id: string
          provider: 'google' | 'outlook'
          event_id: string
          title: string
          description: string | null
          start_time: string
          end_time: string
          is_busy: boolean
          location: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: 'google' | 'outlook'
          event_id: string
          title: string
          description?: string | null
          start_time: string
          end_time: string
          is_busy?: boolean
          location?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: 'google' | 'outlook'
          event_id?: string
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          is_busy?: boolean
          location?: string | null
          created_at?: string
        }
      }
      task_logs: {
        Row: {
          id: string
          task_id: string
          user_id: string
          action: 'created' | 'started' | 'completed' | 'skipped' | 'rescheduled'
          metadata: any | null
          timestamp: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          action: 'created' | 'started' | 'completed' | 'skipped' | 'rescheduled'
          metadata?: any | null
          timestamp?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          action?: 'created' | 'started' | 'completed' | 'skipped' | 'rescheduled'
          metadata?: any | null
          timestamp?: string
        }
      }
      daily_feedback: {
        Row: {
          id: string
          user_id: string
          date: string
          productivity_rating: number | null
          completed_big_thing: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          productivity_rating?: number | null
          completed_big_thing?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          productivity_rating?: number | null
          completed_big_thing?: boolean
          notes?: string | null
          created_at?: string
        }
      }
      nudges: {
        Row: {
          id: string
          user_id: string
          message: string
          type: 'behavioral' | 'productivity' | 'insight' | 'reminder'
          resolved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          type: 'behavioral' | 'productivity' | 'insight' | 'reminder'
          resolved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          type?: 'behavioral' | 'productivity' | 'insight' | 'reminder'
          resolved?: boolean
          created_at?: string
        }
      }
      calendar_tokens: {
        Row: {
          id: string
          user_id: string
          provider: 'google' | 'outlook'
          access_token: string
          refresh_token: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: 'google' | 'outlook'
          access_token: string
          refresh_token?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: 'google' | 'outlook'
          access_token?: string
          refresh_token?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}