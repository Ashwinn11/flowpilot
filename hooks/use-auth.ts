"use client";

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { TaskService } from '@/lib/tasks';

export function useAuth() {
  console.log('[DEBUG] useAuth hook run', new Date().toISOString());
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      
      setUser(session?.user ?? null);
      setLoading(false);
      console.log('[DEBUG] useAuth setUser', session?.user);
      console.log('[DEBUG] useAuth setLoading', false);
      
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
        console.log('[DEBUG] useAuth setUser', session?.user);
        console.log('[DEBUG] useAuth setLoading', false);
        
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
      const { data: existingProfile, error: selectError, status } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      const isNoRows = selectError && selectError.code === 'PGRST116';
      const is406 = status === 406;

      // Only skip insert if selectError is a real error (not 406 or PGRST116)
      if (selectError && !isNoRows && !is406) {
        console.error('Error checking for existing profile:', selectError);
        return;
      }

      if (!existingProfile && (isNoRows || is406 || !selectError)) {
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
        const { error: insertError, status: insertStatus } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: user.email!,
            name: userName,
            timezone: userTimezone,
            trial_started_at: new Date().toISOString(),
            is_pro_user: false
          });

        if (insertError && insertStatus !== 409) { // 409 = duplicate, ignore
          if (insertError instanceof Error) {
            console.error('Error creating user profile:', insertError.message, insertError.stack);
          } else if (typeof insertError === 'object') {
            console.error('Error creating user profile:', JSON.stringify(insertError));
          } else {
            console.error('Error creating user profile:', insertError);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error in createUserProfile:', error.message, error.stack);
      } else if (typeof error === 'object') {
        console.error('Error in createUserProfile:', JSON.stringify(error));
      } else {
        console.error('Error in createUserProfile:', error);
      }
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) {
        console.error('Google OAuth error:', error);
        return { success: false, error: error.message || 'Google sign-in failed. Please try again.' };
      }
      return { success: true };
    } catch (err: any) {
      console.error('Google OAuth unexpected error:', err);
      return { success: false, error: err.message || 'Unexpected error during Google sign-in.' };
    }
  };

  const signInWithMicrosoft = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) {
        console.error('Microsoft OAuth error:', error);
        return { success: false, error: error.message || 'Microsoft sign-in failed. Please try again.' };
      }
      return { success: true };
    } catch (err: any) {
      console.error('Microsoft OAuth unexpected error:', err);
      return { success: false, error: err.message || 'Unexpected error during Microsoft sign-in.' };
    }
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