-- Drop unnecessary tables if they exist
DROP TABLE IF EXISTS user_integrations CASCADE;
DROP TABLE IF EXISTS task_logs CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS daily_feedback CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;

-- user_profiles table (users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  timezone text DEFAULT 'UTC',
  work_hours jsonb,
  trial_started_at timestamp,
  is_pro_user boolean DEFAULT false,
  stripe_customer_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  mfa_enabled boolean DEFAULT false,
  mfa_secret text -- encrypted in app logic, nullable
);

-- thoughts table
CREATE TABLE IF NOT EXISTS thoughts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  processed boolean DEFAULT false,
  extracted_tasks jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- tasks table (with parent_task_id for subtasks)
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  start_time timestamp,
  end_time timestamp,
  scheduled_at timestamp,
  duration integer, -- in minutes
  archetype text, -- e.g., 'reactive', 'deep work'
  priority text, -- 'high', 'medium', 'low'
  status text, -- 'pending', 'completed', 'skipped'
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- focus_sessions table
CREATE TABLE IF NOT EXISTS focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  start_time timestamp,
  end_time timestamp,
  timer_type text, -- 'pomodoro', 'custom', 'open'
  tab_switch_count integer DEFAULT 0,
  idle_time integer DEFAULT 0, -- in seconds
  manual_distractions jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- distractions table
CREATE TABLE IF NOT EXISTS distractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  focus_session_id uuid REFERENCES focus_sessions(id) ON DELETE CASCADE,
  type text, -- 'tab_switch', 'manual', 'idle'
  timestamp timestamp,
  notes text
);

-- energy_logs table
CREATE TABLE IF NOT EXISTS energy_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  focus_session_id uuid REFERENCES focus_sessions(id) ON DELETE CASCADE,
  rating_before integer,
  rating_after integer,
  timestamp timestamp with time zone DEFAULT now()
);

-- calendar_tokens table
CREATE TABLE IF NOT EXISTS calendar_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL, -- 'google', 'outlook'
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamp,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_thoughts_user_id ON thoughts(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_task_id ON focus_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_distractions_user_id ON distractions(user_id);
CREATE INDEX IF NOT EXISTS idx_distractions_focus_session_id ON distractions(focus_session_id);
CREATE INDEX IF NOT EXISTS idx_energy_logs_user_id ON energy_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_energy_logs_focus_session_id ON energy_logs(focus_session_id);
CREATE INDEX IF NOT EXISTS idx_calendar_tokens_user_id ON calendar_tokens(user_id);

-- Enable RLS and add policies for all user tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own profile"
  ON user_profiles FOR ALL
  USING (auth.uid() = id);

ALTER TABLE thoughts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own thoughts"
  ON thoughts FOR ALL
  USING (auth.uid() = user_id);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own tasks"
  ON tasks FOR ALL
  USING (auth.uid() = user_id);

ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own focus sessions"
  ON focus_sessions FOR ALL
  USING (auth.uid() = user_id);

ALTER TABLE distractions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own distractions"
  ON distractions FOR ALL
  USING (auth.uid() = user_id);

ALTER TABLE energy_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own energy logs"
  ON energy_logs FOR ALL
  USING (auth.uid() = user_id);

ALTER TABLE calendar_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own calendar tokens"
  ON calendar_tokens FOR ALL
  USING (auth.uid() = user_id);

-- Updated trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Attach to tables with updated_at
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON calendar_tokens
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

