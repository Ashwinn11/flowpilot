-- FlowPilot Database Schema
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  timezone TEXT DEFAULT 'UTC',
  work_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00", "days": [1,2,3,4,5]}',
  trial_started_at TIMESTAMP WITH TIME ZONE,
  is_pro_user BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER DEFAULT 60, -- in minutes
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  archetype TEXT CHECK (archetype IN ('deep', 'admin', 'creative', 'reactive', 'collaborative', 'analytical')) DEFAULT 'reactive',
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')) DEFAULT 'pending',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  skipped_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar events table
CREATE TABLE IF NOT EXISTS user_calendar_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  provider TEXT CHECK (provider IN ('google', 'outlook')) NOT NULL,
  event_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_busy BOOLEAN DEFAULT TRUE,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider, event_id)
);

-- Task logs for analytics
CREATE TABLE IF NOT EXISTS task_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT CHECK (action IN ('created', 'started', 'completed', 'skipped', 'rescheduled')) NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily feedback table
CREATE TABLE IF NOT EXISTS daily_feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  productivity_rating INTEGER CHECK (productivity_rating >= 1 AND productivity_rating <= 10),
  completed_big_thing BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Nudges table for micro-insights
CREATE TABLE IF NOT EXISTS nudges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('behavioral', 'productivity', 'insight', 'reminder')) NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar integration tokens
CREATE TABLE IF NOT EXISTS calendar_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  provider TEXT CHECK (provider IN ('google', 'outlook')) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Row Level Security (RLS) Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_tokens ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Tasks policies
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Calendar events policies
CREATE POLICY "Users can view own calendar events" ON user_calendar_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar events" ON user_calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar events" ON user_calendar_events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar events" ON user_calendar_events
  FOR DELETE USING (auth.uid() = user_id);

-- Task logs policies
CREATE POLICY "Users can view own task logs" ON task_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task logs" ON task_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Daily feedback policies
CREATE POLICY "Users can view own daily feedback" ON daily_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily feedback" ON daily_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily feedback" ON daily_feedback
  FOR UPDATE USING (auth.uid() = user_id);

-- Nudges policies
CREATE POLICY "Users can view own nudges" ON nudges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nudges" ON nudges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nudges" ON nudges
  FOR UPDATE USING (auth.uid() = user_id);

-- Calendar tokens policies
CREATE POLICY "Users can view own calendar tokens" ON calendar_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar tokens" ON calendar_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar tokens" ON calendar_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar tokens" ON calendar_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_at ON tasks(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON user_calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON user_calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_task_logs_user_id ON task_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_timestamp ON task_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_daily_feedback_user_date ON daily_feedback(user_id, date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_tokens_updated_at BEFORE UPDATE ON calendar_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 