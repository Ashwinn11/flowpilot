-- user_profiles table
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text,
  timezone text default 'UTC',
  work_hours jsonb,
  trial_started_at timestamp,
  is_pro_user boolean default false,
  stripe_customer_id text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- user_integrations table
create table if not exists user_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  provider text not null, -- 'google', 'outlook', etc.
  access_token text not null,
  refresh_token text,
  expires_at timestamp,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- tasks table
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  start_time timestamp,
  end_time timestamp,
  scheduled_at timestamp,
  duration integer, -- in minutes
  archetype text, -- e.g., 'reactive', 'deep work'
  priority text, -- 'high', 'medium', 'low'
  status text, -- 'pending', 'completed', 'skipped'
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- task_logs table
create table if not exists task_logs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  completion_timestamp timestamp,
  skipped_count integer default 0,
  created_at timestamp with time zone default now()
);

-- schedules table
create table if not exists schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  snapshot jsonb,
  created_at timestamp with time zone default now()
);

-- calendar_tokens table
create table if not exists calendar_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  provider text not null, -- 'google', 'outlook'
  access_token text not null,
  refresh_token text,
  expires_at timestamp,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- daily_feedback table
create table if not exists daily_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  productivity_rating integer,
  completed_big_thing boolean,
  notes text,
  created_at timestamp with time zone default now()
);

-- Indexes for performance (optional but recommended)
create index if not exists idx_user_profiles_email on user_profiles(email);
create index if not exists idx_tasks_user_id on tasks(user_id);
create index if not exists idx_task_logs_user_id on task_logs(user_id);
create index if not exists idx_schedules_user_id on schedules(user_id);
create index if not exists idx_calendar_tokens_user_id on calendar_tokens(user_id);
create index if not exists idx_daily_feedback_user_id on daily_feedback(user_id);



-- Enable RLS and add policies for user_profiles
alter table user_profiles enable row level security;

create policy "Users can view their own profile"
  on user_profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own tasks"
  on tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on user_profiles for update
  using (auth.uid() = id);

-- Enable RLS and add policies for user_integrations
alter table user_integrations enable row level security;

create policy "Users can manage their own integrations"
  on user_integrations for all
  using (auth.uid() = user_id);

-- Enable RLS and add policies for tasks
alter table tasks enable row level security;

create policy "Users can manage their own tasks"
  on tasks for all
  using (auth.uid() = user_id);

-- Enable RLS and add policies for task_logs
alter table task_logs enable row level security;

create policy "Users can manage their own task logs"
  on task_logs for all
  using (auth.uid() = user_id);

-- Enable RLS and add policies for schedules
alter table schedules enable row level security;

create policy "Users can manage their own schedules"
  on schedules for all
  using (auth.uid() = user_id);

-- Enable RLS and add policies for calendar_tokens
alter table calendar_tokens enable row level security;

create policy "Users can manage their own calendar tokens"
  on calendar_tokens for all
  using (auth.uid() = user_id);

-- Enable RLS and add policies for daily_feedback
alter table daily_feedback enable row level security;

create policy "Users can manage their own daily feedback"
  on daily_feedback for all
  using (auth.uid() = user_id);



  create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Attach to tables
create trigger set_updated_at
before update on user_profiles
for each row
execute procedure update_updated_at_column();

create trigger set_updated_at
before update on user_integrations
for each row
execute procedure update_updated_at_column();

create trigger set_updated_at
before update on tasks
for each row
execute procedure update_updated_at_column();

create trigger set_updated_at
before update on calendar_tokens
for each row
execute procedure update_updated_at_column();

