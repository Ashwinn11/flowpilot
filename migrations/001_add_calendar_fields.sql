-- Migration script to add calendar integration fields to tasks table
-- Run this in your Supabase SQL editor

-- Add new columns to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS start_time timestamp,
ADD COLUMN IF NOT EXISTS end_time timestamp,
ADD COLUMN IF NOT EXISTS calendar_event_id text,
ADD COLUMN IF NOT EXISTS calendar_task_id text,
ADD COLUMN IF NOT EXISTS calendar_sync_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS completed_at timestamp,
ADD COLUMN IF NOT EXISTS skipped_count integer DEFAULT 0;

-- Add check constraint for calendar_sync_status
ALTER TABLE tasks 
ADD CONSTRAINT check_calendar_sync_status 
CHECK (calendar_sync_status IN ('pending', 'synced', 'failed', 'conflict'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_calendar_event_id ON tasks(calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_tasks_calendar_task_id ON tasks(calendar_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_sync_status ON tasks(calendar_sync_status);
CREATE INDEX IF NOT EXISTS idx_tasks_start_time ON tasks(start_time);

-- Update existing tasks to have default sync status
UPDATE tasks 
SET calendar_sync_status = 'pending' 
WHERE calendar_sync_status IS NULL;

COMMENT ON COLUMN tasks.calendar_event_id IS 'Google Calendar event ID for tasks added to calendar';
COMMENT ON COLUMN tasks.calendar_task_id IS 'Google Tasks ID for calendar tasks';
COMMENT ON COLUMN tasks.calendar_sync_status IS 'Sync status: pending, synced, failed, conflict';
COMMENT ON COLUMN tasks.start_time IS 'Scheduled start time for the task';
COMMENT ON COLUMN tasks.end_time IS 'Scheduled end time for the task';
COMMENT ON COLUMN tasks.completed_at IS 'Timestamp when task was completed';
COMMENT ON COLUMN tasks.skipped_count IS 'Number of times task was skipped';
