"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { TaskService } from '@/lib/tasks';
import { sessionMonitor } from '@/lib/session-monitor';
import { RateLimit } from '@/lib/auth-validation';
import { logger } from '@/lib/logger';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithMicrosoft: () => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ user: User; session: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const createUserProfile = useCallback(async (user: User) => {
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
        logger.error('Error checking for existing profile', { userId: user.id, error: selectError.message }, selectError);
        return;
      }

      if (!existingProfile && (isNoRows || is406 || !selectError)) {
        // Detect user's timezone
        let userTimezone = 'UTC';
        try {
          userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch (error) {
          logger.warn('Could not detect timezone, using UTC', { userId: user.id, error: (error as Error).message });
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

        logger.info('Creating user profile', { userId: user.id, email: user.email, name: userName });
        
        // Create new user profile with default work hours
        const { error: insertError, status: insertStatus } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: user.email!,
            name: userName,
            timezone: userTimezone,
            work_hours: {
              start: '09:00',
              end: '17:00',
              days: [1, 2, 3, 4, 5] // Mon-Fri
            },
            trial_started_at: new Date().toISOString(),
            is_pro_user: false
          });

        if (insertError && insertStatus !== 409) { // 409 = duplicate, ignore
          logger.error('Error creating user profile', { 
            userId: user.id, 
            error: insertError instanceof Error ? insertError.message : JSON.stringify(insertError),
            status: insertStatus 
          }, insertError instanceof Error ? insertError : new Error(JSON.stringify(insertError)));
        }
      }
    } catch (error) {
      logger.error('Error in createUserProfile', { userId: user.id, error: (error as Error).message }, error as Error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      
      logger.debug('Initial session check', { 
        hasSession: !!session, 
        userEmail: session?.user?.email || 'no session' 
      });
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Create user profile in background, don't block UI
      if (session?.user) {
        createUserProfile(session.user).catch(error => {
          logger.error('Failed to create user profile in background', { userId: session.user.id }, error);
        });
        // Preload today's tasks for faster dashboard loading
        TaskService.preloadTodayTasks(session.user.id).catch(error => {
          logger.error('Failed to preload today\'s tasks', { userId: session.user.id }, error);
        });
        
        // Start session monitoring for authenticated users
        sessionMonitor.startMonitoring();
        
        // Set up cross-tab session sync (only in browser)
        if (typeof window !== 'undefined') {
          sessionMonitor.setupCrossTabSync();
        }
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (event === 'SIGNED_IN' && session?.user) {
          logger.info('User signed in', { 
            userId: session.user.id, 
            email: session.user.email, 
            emailConfirmed: !!session.user.email_confirmed_at 
          });
          
          // Don't await these - let them happen in background
          createUserProfile(session.user).catch(error => {
            logger.error('Failed to create user profile after sign in', { userId: session.user.id }, error);
          });
          TaskService.preloadTodayTasks(session.user.id).catch(error => {
            logger.error('Failed to preload today\'s tasks after sign in', { userId: session.user.id }, error);
          });
          
          // Start session monitoring
          sessionMonitor.startMonitoring();
          
          // Set up cross-tab session sync
          if (typeof window !== 'undefined') {
            sessionMonitor.setupCrossTabSync();
          }
          
          // Check if this is the first sign-in after email verification
          // We can detect this by checking if the user was recently created AND
          // if they just verified their email (email_confirmed_at is very recent)
          const userCreatedAt = new Date(session.user.created_at);
          const emailConfirmedAt = session.user.email_confirmed_at ? new Date(session.user.email_confirmed_at) : null;
          const now = new Date();
          const timeDiff = now.getTime() - userCreatedAt.getTime();
          const isRecentSignup = timeDiff < 24 * 60 * 60 * 1000; // Within 24 hours
          
          // Only show welcome message if email was confirmed very recently (within last 5 minutes)
          const isRecentlyVerified = emailConfirmedAt && (now.getTime() - emailConfirmedAt.getTime()) < 5 * 60 * 1000; // Within 5 minutes
          
          if (isRecentSignup && isRecentlyVerified) {
            // This is likely a first-time sign-in after email verification
            // We'll show a success message in the dashboard component
            // Store a flag in sessionStorage with timestamp to show the welcome message
            if (typeof window !== 'undefined') {
              const timestamp = Date.now();
              logger.debug('Setting welcome message flag for new user', { 
                userId: session.user.id, 
                email: session.user.email, 
                timestamp 
              });
              sessionStorage.setItem('showWelcomeMessage', timestamp.toString());
              sessionStorage.setItem('isNewUser', 'true');
            }
          } else {
            // This is a returning user or OAuth user
            if (typeof window !== 'undefined') {
              const timestamp = Date.now();
              logger.debug('Setting welcome message flag for returning user', { 
                userId: session.user.id, 
                email: session.user.email, 
                timestamp 
              });
              sessionStorage.setItem('showWelcomeMessage', timestamp.toString());
              sessionStorage.setItem('isNewUser', 'false');
            }
          }
        } else if (event === 'SIGNED_OUT') {
          logger.info('User signed out');
          // Stop session monitoring when user signs out
          sessionMonitor.stopMonitoring();
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      // Clean up session monitoring
      sessionMonitor.stopMonitoring();
    };
  }, [createUserProfile]);

  const signInWithGoogle = useCallback(async () => {
    try {
      // Rate limiting for OAuth attempts
      const clientIP = typeof window !== 'undefined' ? 'client' : 'server';
      if (RateLimit.isRateLimited(`oauth_google_${clientIP}`, 3, 15 * 60 * 1000)) { // 3 attempts per 15 minutes
        logger.warn('Google OAuth rate limited', { clientIP });
        return { 
          success: false, 
          error: 'Too many Google sign-in attempts. Please try again later.' 
        };
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        logger.error('Google OAuth error', { error: error.message }, error);
        return { success: false, error: error.message || 'Google sign-in failed. Please try again.' };
      }
      
      // Clear rate limit on successful initiation
      RateLimit.clearRateLimit(`oauth_google_${clientIP}`);
      logger.info('Google OAuth initiated successfully');
      return { success: true };
    } catch (err: any) {
      logger.error('Google OAuth unexpected error', { error: err.message }, err);
      return { success: false, error: err.message || 'Unexpected error during Google sign-in.' };
    }
  }, []);

  const signInWithMicrosoft = useCallback(async () => {
    try {
      // Rate limiting for OAuth attempts
      const clientIP = typeof window !== 'undefined' ? 'client' : 'server';
      if (RateLimit.isRateLimited(`oauth_microsoft_${clientIP}`, 3, 15 * 60 * 1000)) { // 3 attempts per 15 minutes
        logger.warn('Microsoft OAuth rate limited', { clientIP });
        return { 
          success: false, 
          error: 'Too many Microsoft sign-in attempts. Please try again later.' 
        };
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          queryParams: {
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        logger.error('Microsoft OAuth error', { error: error.message }, error);
        return { success: false, error: error.message || 'Microsoft sign-in failed. Please try again.' };
      }
      
      // Clear rate limit on successful initiation
      RateLimit.clearRateLimit(`oauth_microsoft_${clientIP}`);
      logger.info('Microsoft OAuth initiated successfully');
      return { success: true };
    } catch (err: any) {
      logger.error('Microsoft OAuth unexpected error', { error: err.message }, err);
      return { success: false, error: err.message || 'Unexpected error during Microsoft sign-in.' };
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        logger.error('Email signup error', { email, error: error.message }, error);
        throw error;
      }

      logger.info('Email signup initiated successfully', { email });
    } catch (error) {
      logger.error('Email signup failed', { email, error: (error as Error).message }, error as Error);
      throw error;
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        logger.error('Email signin error', { email, error: error.message }, error);
        throw error;
      }

      if (!data.user || !data.session) {
        logger.error('No user or session returned from email signin', { email });
        throw new Error('Sign-in failed. Please try again.');
      }

      logger.info('Email signin successful', { userId: data.user.id, email });
      return data;
    } catch (error) {
      logger.error('Email signin failed', { email, error: (error as Error).message }, error as Error);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.error('Signout error', { error: error.message }, error);
        throw error;
      }
      logger.info('User signed out successfully');
    } catch (error) {
      logger.error('Signout failed', { error: (error as Error).message }, error as Error);
      throw error;
    }
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    signInWithGoogle,
    signInWithMicrosoft,
    signUpWithEmail,
    signInWithEmail,
    signOut
  }), [user, loading, signInWithGoogle, signInWithMicrosoft, signUpWithEmail, signInWithEmail, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
