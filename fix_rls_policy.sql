-- Fix missing RLS policy for user_profiles table
-- This allows users to insert their own profile during signup

-- Add the missing insert policy
create policy "Users can insert their own profile"
  on user_profiles for insert
  with check (auth.uid() = id);

-- Verify the policy was created
select 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies 
where tablename = 'user_profiles'; 