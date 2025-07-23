-- Migration script to add calendar integration fields to existing tasks table
-- Run this in your Supabase SQL editor if the fields don't exist yet

-- Add new columns to tasks table (only if they don't exist)
DO $$ 
BEGIN
    -- Add calendar_event_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='calendar_event_id') THEN
        ALTER TABLE tasks ADD COLUMN calendar_event_id text;
    END IF;
    
    -- Add calendar_task_id if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='calendar_task_id') THEN
        ALTER TABLE tasks ADD COLUMN calendar_task_id text;
    END IF;
    
    -- Add calendar_sync_status if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='calendar_sync_status') THEN
        ALTER TABLE tasks ADD COLUMN calendar_sync_status text DEFAULT 'pending';
    END IF;
    
    -- Add completed_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='completed_at') THEN
        ALTER TABLE tasks ADD COLUMN completed_at timestamp;
    END IF;
    
    -- Add skipped_count if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='skipped_count') THEN
        ALTER TABLE tasks ADD COLUMN skipped_count integer DEFAULT 0;
    END IF;
    
    -- Add start_time if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='start_time') THEN
        ALTER TABLE tasks ADD COLUMN start_time timestamp;
    END IF;
    
    -- Add end_time if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='end_time') THEN
        ALTER TABLE tasks ADD COLUMN end_time timestamp;
    END IF;
END $$;

-- Add check constraint for calendar_sync_status (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage 
                   WHERE constraint_name = 'check_calendar_sync_status') THEN
        ALTER TABLE tasks 
        ADD CONSTRAINT check_calendar_sync_status 
        CHECK (calendar_sync_status IN ('pending', 'synced', 'failed', 'conflict'));
    END IF;
END $$;

-- Create indexes for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_tasks_calendar_event_id ON tasks(calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_tasks_calendar_task_id ON tasks(calendar_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_sync_status ON tasks(calendar_sync_status);
CREATE INDEX IF NOT EXISTS idx_tasks_start_time ON tasks(start_time);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);

-- Update existing tasks to have default sync status
UPDATE tasks 
SET calendar_sync_status = 'pending' 
WHERE calendar_sync_status IS NULL;

-- Update existing tasks to have default skipped_count
UPDATE tasks 
SET skipped_count = 0 
WHERE skipped_count IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN tasks.calendar_event_id IS 'Google Calendar event ID for tasks added to calendar';
COMMENT ON COLUMN tasks.calendar_task_id IS 'Google Tasks ID for calendar tasks';
COMMENT ON COLUMN tasks.calendar_sync_status IS 'Sync status: pending, synced, failed, conflict';
COMMENT ON COLUMN tasks.start_time IS 'Scheduled start time for the task';
COMMENT ON COLUMN tasks.end_time IS 'Scheduled end time for the task';
COMMENT ON COLUMN tasks.completed_at IS 'Timestamp when task was completed';
COMMENT ON COLUMN tasks.skipped_count IS 'Number of times task was skipped';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
  AND column_name IN ('calendar_event_id', 'calendar_task_id', 'calendar_sync_status', 'completed_at', 'skipped_count', 'start_time', 'end_time')
ORDER BY column_name;
