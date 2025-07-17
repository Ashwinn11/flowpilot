import { toast } from 'sonner';

interface SessionResponse {
  valid: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    provider?: string;
  };
  session?: {
    expiresAt: number;
    timeUntilExpiry: number;
    isExpiringSoon: boolean;
    lastRefreshAt?: number;
  };
  profile?: any;
  timestamp?: number;
}

interface RefreshResponse {
  success: boolean;
  refreshed: boolean;
  error?: string;
  message: string;
  requiresLogin?: boolean;
  session?: {
    expiresAt: number;
    timeUntilExpiry: number;
    isExpiringSoon: boolean;
    refreshedAt?: number;
  };
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

interface UserResponse {
  user: {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    provider?: string;
    emailVerified: boolean;
    createdAt: string;
  };
  profile?: any;
}

interface LogoutResponse {
  success: boolean;
  error?: string;
  message: string;
  timestamp: number;
}

export class AuthAPI {
  private static baseUrl = '/api/auth';

  /**
   * Validate current session and get session health
   */
  static async validateSession(): Promise<SessionResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/session`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { valid: false, error: 'Not authenticated' };
        }
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  /**
   * Manually refresh the session token
   */
  static async refreshSession(): Promise<RefreshResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresLogin) {
          toast.error('Your session has expired. Please sign in again.');
          // Could trigger redirect to login here
        } else {
          toast.error(data.error || 'Failed to refresh session');
        }
        return data;
      }

      if (data.refreshed) {
        toast.success('Session refreshed successfully');
      }

      return data;
    } catch (error) {
      console.error('Session refresh error:', error);
      toast.error('Failed to refresh session. Please try again.');
      return null;
    }
  }

  /**
   * Get current user profile
   */
  static async getUserProfile(): Promise<UserResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          return null; // Not authenticated
        }
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('User profile fetch error:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(updates: {
    name?: string;
    timezone?: string;
    workHours?: any;
    email?: string;
  }): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to update profile');
        return { success: false, error: data.error };
      }

      toast.success(data.message || 'Profile updated successfully');
      return { success: true, data };
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile. Please try again.');
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Enhanced logout with cleanup
   */
  static async logout(): Promise<LogoutResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Logout failed');
        return data;
      }

      toast.success('You\'ve been signed out successfully');
      return data;
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout properly. Please try again.');
      return null;
    }
  }

  /**
   * Quick health check for session monitoring
   */
  static async quickSessionCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/session`, {
        method: 'GET',
        credentials: 'include',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
} 