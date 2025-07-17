"use client";

import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { ProfileService, UserProfile } from '@/lib/profiles';
import { toast } from 'sonner';

export function useProfile() {
  console.log('[DEBUG] useProfile hook run', new Date().toISOString());
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Load initial profile data
  useEffect(() => {
    if (user) {
      loadProfile();
      loadTrialDays();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const subscription = ProfileService.subscribeToProfileChanges(
      user.id,
      (updatedProfile) => {
        setProfile(updatedProfile);
        // Recalculate trial days when profile updates
        loadTrialDays();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const loadProfile = async () => {
    console.log('[DEBUG] loadProfile called', new Date().toISOString());
    if (!user) {
      console.warn('loadProfile: No user found, skipping profile fetch.');
      return;
    }

    try {
      setLoading(true);
      setProfileError(null);
      console.log('loadProfile: Fetching profile for user:', user.id, user.email);
      const userProfile = await ProfileService.getCurrentUserProfile();
      setProfile(userProfile);
      setProfileError(null);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('We couldn’t load your profile. Please check your internet connection and try again.');
      setProfileError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const retryProfileFetch = () => {
    loadProfile();
  };

  const loadTrialDays = async () => {
    if (!user) return;

    try {
      const days = await ProfileService.getTrialDaysRemaining();
      setTrialDaysLeft(days);
    } catch (error) {
      console.error('Error loading trial days:', error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    try {
      setSaving(true);
      const updatedProfile = await ProfileService.updateProfile(updates);
      
      if (updatedProfile) {
        setProfile(updatedProfile);
        toast.success('Your profile has been updated!');
        return updatedProfile;
      } else {
        toast.error('Failed to update profile');
        return null;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('We couldn’t update your profile. Please try again in a moment.');
      // Optionally, you could add retry logic for updates as well
      return null;
    } finally {
      setSaving(false);
    }
  };

  const getOAuthInfo = () => {
    if (!user) return null;

    return {
      name: user.user_metadata?.full_name || user.user_metadata?.name,
      email: user.email,
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
      provider: user.app_metadata?.provider
    };
  };

  return {
    profile,
    loading,
    saving,
    trialDaysLeft,
    updateProfile,
    getOAuthInfo,
    refreshProfile: loadProfile,
    retryProfileFetch,
    profileError,
  };
} 