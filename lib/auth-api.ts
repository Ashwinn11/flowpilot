import { toast } from 'sonner';
import { logger } from './logger';

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

interface SignupResponse {
  success: boolean;
  error?: string;
  message: string;
  code?: string;
  provider?: string;
  user?: {
    id: string;
    email: string;
    emailVerified: boolean;
  };
  validationErrors?: any[];
}

interface SigninResponse {
  success: boolean;
  error?: string;
  message: string;
  code?: string;
  provider?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    provider?: string;
    emailVerified: boolean;
    createdAt: string;
  };
  profile?: any;
  session?: {
    expiresAt: number;
    timeUntilExpiry: number;
    isExpiringSoon: boolean;
  };
  requiresEmailVerification?: boolean;
}

interface ForgotPasswordResponse {
  success: boolean;
  error?: string;
  message: string;
  code?: string;
  provider?: string;
}

interface ResetPasswordResponse {
  success: boolean;
  error?: string;
  message: string;
}

export class AuthAPI {
  private static baseUrl = typeof window !== 'undefined' && window.location.port === '3001' 
    ? 'http://localhost:3001/api/auth' 
    : '/api/auth';

  /**
   * Sign up a new user
   */
  static async signup(data: {
    email: string;
    password: string;
    name: string;
    timezone?: string;
    workHours?: any;
  }): Promise<SignupResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/signup`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast.error(result.error || 'Too many signup attempts. Please try again later.');
        } else {
          toast.error(result.error || 'Failed to create account. Please try again.');
        }
        return result;
      }

      return result;
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Failed to create account. Please try again.');
      return null;
    }
  }

  /**
   * Sign in user
   */
  static async signin(data: {
    email: string;
    password: string;
  }): Promise<SigninResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/signin`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast.error(result.error || 'Too many signin attempts. Please try again later.');
        } else if (response.status === 403 && result.requiresEmailVerification) {
          toast.error(result.error || 'Please verify your email before signing in.');
        } else {
          toast.error(result.error || 'Invalid email or password. Please try again.');
        }
        return result;
      }

      return result;
    } catch (error) {
      console.error('Signin error:', error);
      toast.error('Failed to sign in. Please try again.');
      return null;
    }
  }

  /**
   * Request password reset
   */
  static async forgotPassword(email: string): Promise<ForgotPasswordResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/forgot-password`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast.error(result.error || 'Too many password reset requests. Please try again later.');
        } else {
          toast.error(result.error || 'Failed to send password reset email. Please try again.');
        }
        return result;
      }

      return result;
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('Failed to send password reset email. Please try again.');
      return null;
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(data: {
    password: string;
    confirmPassword: string;
  }): Promise<ResetPasswordResponse | null> {
    try {
      console.log('AuthAPI: Making reset password request to:', `${this.baseUrl}/reset-password`);
      const response = await fetch(`${this.baseUrl}/reset-password`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('AuthAPI: Reset password response status:', response.status, 'URL:', response.url);
      const result = await response.json();

      if (!response.ok) {
        console.error('AuthAPI: Reset password failed with status:', response.status, 'Error:', result);
        if (response.status === 429) {
          toast.error(result.error || 'Too many password reset attempts. Please try again later.');
        } else {
          toast.error(result.error || 'Failed to reset password. Please try again.');
        }
        return result;
      }

      return result;
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Failed to reset password. Please try again.');
      return null;
    }
  }

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
        // Silent failure for background refresh - only log for debugging
        logger.warn('Session refresh failed', { error: data.error || 'Unknown error' });
        return data;
      }

      if (data.refreshed) {
        // Silent refresh - no need to notify user of successful background operation
        logger.debug('Session refreshed successfully');
      }

      return data;
    } catch (error) {
      logger.error('Session refresh error', { error: (error as Error).message }, error as Error);
      // Silent failure for background refresh
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