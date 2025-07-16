import { supabase } from './supabase';
import type { Database } from './supabase';

export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

export class ProfileService {
  /**
   * Get the current user's profile
   */
  static async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getCurrentUserProfile:', error);
      return null;
    }
  }

  /**
   * Update the current user's profile
   */
  static async updateProfile(updates: UserProfileUpdate): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateProfile:', error);
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

  /**
   * Fallback polling mechanism when real-time fails
   */
  private static setupPollingFallback(userId: string, callback: (profile: UserProfile) => void) {
    let lastProfile: UserProfile | null = null;
    
    const pollInterval = setInterval(async () => {
      try {
        const profile = await this.getCurrentUserProfile();
        if (profile && JSON.stringify(profile) !== JSON.stringify(lastProfile)) {
          lastProfile = profile;
          callback(profile);
        }
      } catch (error) {
        console.error('Polling fallback error:', error);
      }
    }, 5000); // Poll every 5 seconds

    // Return a mock subscription object for compatibility
    return {
      unsubscribe: () => {
        clearInterval(pollInterval);
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