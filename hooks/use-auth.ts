"use client";

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { TaskService } from '@/lib/tasks';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Create user profile in background, don't block UI
      if (session?.user) {
        createUserProfile(session.user).catch(console.error);
        // Preload today's tasks for faster dashboard loading
        TaskService.preloadTodayTasks(session.user.id).catch(console.error);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Don't await these - let them happen in background
          createUserProfile(session.user).catch(console.error);
          TaskService.preloadTodayTasks(session.user.id).catch(console.error);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const createUserProfile = async (user: User) => {
    try {
      // Check if user profile already exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        // Detect user's timezone
        let userTimezone = 'UTC';
        try {
          userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch (error) {
          console.warn('Could not detect timezone, using UTC:', error);
        }

        // Get user name - handle both OAuth and email/password users
        let userName = null;
        if (user.user_metadata?.full_name || user.user_metadata?.name) {
          // OAuth user
          userName = user.user_metadata?.full_name || user.user_metadata?.name;
        } else if (user.email) {
          // Email/password user - use email prefix as name
          userName = user.email.split('@')[0];
        }

        // Create new user profile
        const { error } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: user.email!,
            name: userName,
            timezone: userTimezone,
            trial_started_at: new Date().toISOString(),
            is_pro_user: false
          });

        if (error) {
          console.error('Error creating user profile:', error);
        }
      }
    } catch (error) {
      console.error('Error in createUserProfile:', error);
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    if (error) throw error;
  };

  const signInWithMicrosoft = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    if (error) throw error;
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    });
    if (error) throw error;
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return {
    user,
    loading,
    signInWithGoogle,
    signInWithMicrosoft,
    signUpWithEmail,
    signInWithEmail,
    signOut
  };
}