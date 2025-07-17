import { supabase } from './supabase';
import type { Database } from './supabase';
import { toast } from 'sonner';

export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

export class ProfileService {
  /**
   * Get the current user's profile
   */
  static async getCurrentUserProfile(): Promise<UserProfile | null> {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DEBUG] getCurrentUserProfile called', new Date().toISOString());
    }
    console.trace('[DEBUG] getCurrentUserProfile stack trace');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.id) {
        console.warn('[Profile Fetch] [UserID: none] No user or user.id found, skipping profile fetch.');
        return null;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error(`[Profile Fetch] [UserID: ${user.id}] Error:`, error);
        return null;
      }

      return data;
    } catch (error) {
      console.error(`[Profile Fetch] [UserID: unknown] Error:`, error);
      return null;
    }
  }

  /**
   * Update the current user's profile
   */
  static async updateProfile(updates: UserProfileUpdate): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.id) {
        console.warn('[Profile Update] [UserID: none] No user or user.id found, skipping profile update.');
        return null;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error(`[Profile Update] [UserID: ${user.id}] Error:`, error);
        return null;
      }

      return data;
    } catch (error) {
      console.error(`[Profile Update] [UserID: unknown] Error:`, error);
      return null;
    }
  }

  /**
   * Get trial days remaining for the current user
   */
  static async getTrialDaysRemaining(): Promise<number> {
    try {
      const profile = await this.getCurrentUserProfile();
      if (!profile || !profile.trial_started_at || profile.is_pro_user) {
        return 0;
      }

      const trialStart = new Date(profile.trial_started_at);
      const now = new Date();
      const daysElapsed = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
      const trialDaysRemaining = Math.max(0, 7 - daysElapsed);

      return trialDaysRemaining;
    } catch (error) {
      console.error('Error calculating trial days:', error);
      return 0;
    }
  }

  /**
   * Subscribe to real-time profile changes with fallback
   */
  static subscribeToProfileChanges(userId: string, callback: (profile: UserProfile) => void) {
    try {
      const channel = supabase
        .channel(`user_profile_${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_profiles',
            filter: `id=eq.${userId}`
          },
          (payload) => {
            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
              callback(payload.new as UserProfile);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.warn('Real-time subscription failed, falling back to polling');
            // Fallback to polling if real-time fails
            this.setupPollingFallback(userId, callback);
          }
        });

      return channel;
    } catch (error) {
      console.warn('Real-time subscription setup failed, using polling fallback:', error);
      return this.setupPollingFallback(userId, callback);
    }
  }

  // Track polling intervals per user to prevent duplicates
  private static pollingMap: Map<string, { interval: NodeJS.Timeout, stop: () => void }> = new Map();

  /**
   * Fallback polling mechanism when real-time fails
   */
  private static setupPollingFallback(userId: string, callback: (profile: UserProfile) => void) {
    // If a poller already exists for this user, do not start another
    if (this.pollingMap.has(userId)) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Polling Fallback] Poller already running for user ${userId}`);
      }
      return {
        unsubscribe: this.pollingMap.get(userId)!.stop
      };
    }

    let lastProfile: UserProfile | null = null;
    let consecutiveErrors = 0;
    const maxErrors = 5;
    let isPolling = false;
    let retryToastId: string | number | undefined = undefined;

    const poll = async () => {
      try {
        const profile = await this.getCurrentUserProfile();
        if (profile && JSON.stringify(profile) !== JSON.stringify(lastProfile)) {
          lastProfile = profile;
          callback(profile);
        }
        consecutiveErrors = 0; // Reset on success
      } catch (error) {
        consecutiveErrors++;
        console.error(`[Polling Fallback] [UserID: ${userId}] Error:`, error);
        if (consecutiveErrors >= maxErrors) {
          stopPolling();
          if (process.env.NODE_ENV !== 'production') {
            console.warn(`[Polling Fallback] [UserID: ${userId}] Stopped after too many errors.`);
          }
          toast.error(
            'We lost connection to your profile updates. Try refreshing the page, and if this keeps happening, please contact support@flowpilot.com.',
            { duration: 10000 }
          );
        }
      }
    };

    const startPolling = () => {
      if (isPolling) return;
      isPolling = true;
      toast.warning('We’re having trouble staying in sync. Profile updates might be a little slower right now.');
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Polling Fallback] Starting poller for user ${userId}`);
      }
      const interval = setInterval(poll, 300000); // 5 minutes
      // Save stop function in map
      this.pollingMap.set(userId, {
        interval,
        stop: stopPolling
      });
    };

    const stopPolling = () => {
      if (!isPolling) return;
      isPolling = false;
      const poller = this.pollingMap.get(userId);
      if (poller) {
        clearInterval(poller.interval);
        this.pollingMap.delete(userId);
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[Polling Fallback] Stopped poller for user ${userId}`);
        }
      }
    };

    // Retry handler for the toast button
    const retryPollingFallback = () => {
      if (!isPolling) {
        consecutiveErrors = 0;
        startPolling();
        if (retryToastId) toast.dismiss(retryToastId);
      }
    };

    // Handle tab visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start polling initially if tab is visible
    if (!document.hidden) {
      startPolling();
    }

    // Return a mock subscription object for compatibility
    return {
      unsubscribe: () => {
        stopPolling();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }

  /**
   * Get user's OAuth profile information
   */
  static async getOAuthProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Map provider names to user-friendly names
      const getProviderName = (provider: string) => {
        switch (provider) {
          case 'google':
            return 'google';
          case 'azure':
            return 'microsoft';
          default:
            return provider;
        }
      };

      // Handle both OAuth and email/password users
      const isOAuthUser = user.app_metadata?.provider;
      const provider = isOAuthUser ? getProviderName(user.app_metadata?.provider || '') : null;

      return {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        provider: provider
      };
    } catch (error) {
      console.error('Error getting OAuth profile:', error);
      return null;
    }
  }
} 