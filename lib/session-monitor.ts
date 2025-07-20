import { supabase } from './supabase';
import { logger } from './logger';
import { AuthAPI } from './auth-api';

class SessionMonitorService {
  private intervalId: NodeJS.Timeout | null = null;
  private sessionWarningShown = false;
  private isDestroyed = false;
  
  // Add debouncing for refresh operations
  private refreshPromise: Promise<boolean> | null = null;
  private refreshAttempts = 0;
  private maxRefreshAttempts = 3;
  private lastRefreshTime = 0;
  private minRefreshInterval = 30000; // 30 seconds minimum between refreshes

  constructor() {
    // Ensure we properly clean up on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.destroy();
      });
    }
  }

  /**
   * Start monitoring session health
   */
  startMonitoring() {
    if (this.intervalId || this.isDestroyed) return;
    
    logger.debug('Starting session monitoring');
    
    // Check session health every 5 minutes
    this.intervalId = setInterval(() => {
      if (!this.isDestroyed) {
        this.checkSessionHealth();
      }
    }, 5 * 60 * 1000);
    
    // Initial check
    this.checkSessionHealth();
  }

  /**
   * Stop monitoring and cleanup
   */
  stopMonitoring() {
    logger.debug('Stopping session monitoring');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.sessionWarningShown = false;
    this.refreshPromise = null;
    this.refreshAttempts = 0;
  }

  /**
   * Destroy the service and cleanup all resources
   */
  destroy() {
    this.isDestroyed = true;
    this.stopMonitoring();
  }

  /**
   * Check session health and handle refresh/warnings
   */
  private async checkSessionHealth() {
    if (this.isDestroyed) return;
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        logger.debug('No active session found during health check');
        return;
      }

      // Check if session is expiring soon
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at || 0;
      const timeUntilExpiry = expiresAt - now;

      // If expiring within 10 minutes, show warning
      if (timeUntilExpiry <= 600 && timeUntilExpiry > 300 && !this.sessionWarningShown) {
        this.sessionWarningShown = true;
        this.showSessionWarning(Math.floor(timeUntilExpiry / 60));
      }

      // If expiring within 5 minutes, attempt refresh
      if (timeUntilExpiry <= 300) {
        logger.debug('Session expiring soon, attempting refresh', { timeUntilExpiry });
        const refreshed = await this.refreshSession();
        
        if (!refreshed) {
          logger.warn('Failed to refresh session, user may need to re-authenticate');
        }
      }

    } catch (error) {
      logger.error('Session health check failed', { error: (error as Error).message }, error as Error);
    }
  }

  /**
   * Manually refresh the session with debouncing and retry logic
   */
  async refreshSession(): Promise<boolean> {
    // If refresh is already in progress, return the existing promise
    if (this.refreshPromise) {
      logger.debug('Refresh already in progress, waiting for completion');
      return this.refreshPromise;
    }

    // Check minimum refresh interval to prevent too frequent requests
    const now = Date.now();
    if (now - this.lastRefreshTime < this.minRefreshInterval) {
      logger.debug('Refresh rate limited, skipping');
      return true; // Consider as success to prevent immediate retry
    }

    // Check maximum retry attempts
    if (this.refreshAttempts >= this.maxRefreshAttempts) {
      logger.warn('Maximum refresh attempts reached, resetting counter');
      this.refreshAttempts = 0;
      // Wait longer before allowing retries
      this.lastRefreshTime = now + (5 * 60 * 1000); // 5 minute cooldown
      return false;
    }

    // Create new refresh promise
    this.refreshPromise = this.performRefresh();
    
    try {
      const result = await this.refreshPromise;
      this.lastRefreshTime = now;
      
      if (result) {
        this.refreshAttempts = 0; // Reset on success
      } else {
        this.refreshAttempts++;
      }
      
      return result;
    } finally {
      // Clear the promise after completion
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual refresh operation
   */
  private async performRefresh(): Promise<boolean> {
    try {
      // Use the new API endpoint for enhanced refresh functionality
      const result = await AuthAPI.refreshSession();
      
      if (!result) {
        logger.error('Failed to refresh session: No response');
        return false;
      }

      if (!result.success) {
        logger.warn('Failed to refresh session', { error: result.error });
        if (result.requiresLogin) {
          // Session is completely invalid, user needs to login again
          return false;
        }
        return false;
      }

      if (result.refreshed) {
        logger.debug('Session refreshed successfully');
        this.sessionWarningShown = false; // Reset warning flag
        return true;
      } else {
        // Session is still valid, no refresh was needed
        logger.debug('Session is still valid, no refresh needed');
        return true;
      }
    } catch (error) {
      logger.error('Error refreshing session', { error: (error as Error).message }, error as Error);
      // Fallback to Supabase direct refresh
      try {
        const { data, error: supabaseError } = await supabase.auth.refreshSession();
        
        if (supabaseError || !data.session) {
          logger.warn('Fallback refresh failed', { error: supabaseError?.message || 'No session data' });
          return false;
        }

        logger.debug('Fallback refresh successful');
        this.sessionWarningShown = false;
        return true;
      } catch (fallbackError) {
        logger.error('Fallback refresh failed', { error: (fallbackError as Error).message }, fallbackError as Error);
        return false;
      }
    }
  }

  /**
   * Show session expiration warning to user
   */
  private showSessionWarning(minutesLeft: number) {
    logger.info('Showing session expiration warning', { minutesLeft });
    
    // Create a user-friendly notification
    if (typeof window !== 'undefined') {
      // You could integrate with your toast system here
      console.warn(`Session expires in ${minutesLeft} minutes. Please save your work.`);
    }
  }

  /**
   * Set up cross-tab session synchronization
   */
  setupCrossTabSync() {
    if (typeof window === 'undefined' || this.isDestroyed) return;

    // Listen for auth changes in other tabs
    window.addEventListener('storage', (e) => {
      if (this.isDestroyed) return;
      
      if (e.key?.includes('supabase') && e.newValue === null) {
        // Session was cleared in another tab
        logger.info('Session cleared in another tab, syncing');
        window.location.reload();
      }
    });

    // Listen for focus events to check session when tab becomes active
    window.addEventListener('focus', () => {
      if (this.isDestroyed) return;
      
      // Check session validity when tab regains focus
      this.checkSessionHealth();
    });
  }

  /**
   * Get current session status for UI components
   */
  async getSessionStatus() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return { isValid: false, error: error?.message };
      }

      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at || 0;
      const timeUntilExpiry = expiresAt - now;

      return {
        isValid: true,
        expiresAt: expiresAt * 1000,
        timeUntilExpiry: timeUntilExpiry * 1000,
        isExpiringSoon: timeUntilExpiry < 600, // Less than 10 minutes
        needsRefresh: timeUntilExpiry < 300, // Less than 5 minutes
        canRefresh: !this.refreshPromise && this.refreshAttempts < this.maxRefreshAttempts
      };
    } catch (error) {
      logger.error('Failed to get session status', { error: (error as Error).message }, error as Error);
      return { isValid: false, error: (error as Error).message };
    }
  }

  /**
   * Check if refresh is currently in progress
   */
  isRefreshing(): boolean {
    return this.refreshPromise !== null;
  }

  /**
   * Reset refresh attempts counter (useful for manual refresh triggers)
   */
  resetRefreshAttempts() {
    this.refreshAttempts = 0;
    logger.debug('Refresh attempts counter reset');
  }
}

// Create singleton instance
export const sessionMonitor = new SessionMonitorService(); 