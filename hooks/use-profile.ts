"use client";

import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { ProfileService, UserProfile } from '@/lib/profiles';
import { toast } from 'sonner';

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);

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
    if (!user) return;

    try {
      setLoading(true);
      const userProfile = await ProfileService.getCurrentUserProfile();
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
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
        toast.success('Profile updated successfully');
        return updatedProfile;
      } else {
        toast.error('Failed to update profile');
        return null;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
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
    refreshProfile: loadProfile
  };
} 