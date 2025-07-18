import { supabase } from './supabase';
import { AuthAPI } from './auth-api';
import { logger } from './logger';

interface SessionHealth {
  isValid: boolean;
  expiresAt: number | null;
  timeUntilExpiry: number | null;
  refreshedAt: number;
}

interface SessionMonitorConfig {
  healthCheckInterval: number; // in milliseconds
  warningThreshold: number; // minutes before expiry to show warning
  autoRefreshThreshold: number; // minutes before expiry to auto-refresh
}

class SessionMonitorService {
  private static instance: SessionMonitorService;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private config: SessionMonitorConfig = {
    healthCheckInterval: 5 * 60 * 1000, // 5 minutes
    warningThreshold: 10, // 10 minutes before expiry
    autoRefreshThreshold: 5, // 5 minutes before expiry
  };
  private lastHealthCheck: number = 0;
  private sessionWarningShown: boolean = false;
  private isMonitoring: boolean = false;

  static getInstance(): SessionMonitorService {
    if (!SessionMonitorService.instance) {
      SessionMonitorService.instance = new SessionMonitorService();
    }
    return SessionMonitorService.instance;
  }

  /**
   * Start monitoring session health
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      logger.debug('Session monitoring already active, skipping start');
      return;
    }

    this.stopMonitoring(); // Ensure no duplicate intervals
    
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);

    this.isMonitoring = true;
    logger.debug('Session monitoring started');

    // Perform initial health check
    this.performHealthCheck();
  }

  /**
   * Stop monitoring session health
   */
  stopMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.sessionWarningShown = false;
    this.isMonitoring = false;
    logger.debug('Session monitoring stopped');
  }

  /**
   * Get current session health status
   */
  async getSessionHealth(): Promise<SessionHealth> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return {
          isValid: false,
          expiresAt: null,
          timeUntilExpiry: null,
          refreshedAt: Date.now()
        };
      }

      const now = Date.now() / 1000; // Convert to seconds
      const expiresAt = session.expires_at || null;
      const timeUntilExpiry = expiresAt ? Math.max(0, expiresAt - now) : null;

      return {
        isValid: true,
        expiresAt: expiresAt ? expiresAt * 1000 : null, // Convert back to milliseconds
        timeUntilExpiry: timeUntilExpiry ? timeUntilExpiry * 1000 : null, // Convert to milliseconds
        refreshedAt: Date.now()
      };
    } catch (error) {
      logger.error('Error checking session health', { error: (error as Error).message }, error as Error);
      return {
        isValid: false,
        expiresAt: null,
        timeUntilExpiry: null,
        refreshedAt: Date.now()
      };
    }
  }

  /**
   * Perform periodic health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const health = await this.getSessionHealth();
      this.lastHealthCheck = health.refreshedAt;

      if (!health.isValid) {
        this.stopMonitoring();
        return;
      }

      if (health.timeUntilExpiry) {
        const minutesUntilExpiry = health.timeUntilExpiry / (1000 * 60);

        // Auto-refresh token if close to expiry
        if (minutesUntilExpiry <= this.config.autoRefreshThreshold) {
          await this.refreshSession();
        }
        // Show warning if approaching expiry
        else if (minutesUntilExpiry <= this.config.warningThreshold && !this.sessionWarningShown) {
          this.showExpirationWarning(Math.ceil(minutesUntilExpiry));
          this.sessionWarningShown = true;
        }
        // Reset warning flag if we're back to a safe time
        else if (minutesUntilExpiry > this.config.warningThreshold) {
          this.sessionWarningShown = false;
        }
      }
    } catch (error) {
      logger.error('Health check failed', { error: (error as Error).message }, error as Error);
    }
  }

  /**
   * Manually refresh the session using enhanced API
   */
  async refreshSession(): Promise<boolean> {
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
   * Show session expiration warning to user (only for critical failures)
   */
  private showExpirationWarning(minutesLeft: number): void {
    // Silent operation - only log for debugging
    logger.debug('Session expiration warning', { minutesLeft });
    
    // Only show warning if auto-refresh has repeatedly failed
    // This creates a better UX by not showing unnecessary notifications
  }

  /**
   * Handle cross-tab session coordination
   */
  setupCrossTabSync(): void {
    // Remove existing listeners to prevent duplicates
    window.removeEventListener('storage', this.handleStorageEvent);
    window.removeEventListener('focus', this.handleFocusEvent);

    // Listen for storage events to sync logout across tabs
    window.addEventListener('storage', this.handleStorageEvent);

    // Listen for focus events to check session health when tab becomes active
    window.addEventListener('focus', this.handleFocusEvent);
  }

  private handleStorageEvent = (event: StorageEvent) => {
    if (event.key === 'supabase.auth.token') {
      // If auth token was removed in another tab, refresh current tab
      if (!event.newValue && event.oldValue) {
        window.location.reload();
      }
    }
  };

  private handleFocusEvent = () => {
    // Disabled focus-based health checks to prevent toast spam
    // Health checks are now only done via the interval timer
    logger.debug('Tab focus detected, but health check skipped to prevent spam');
  };

  /**
   * Add security headers for session management
   */
  getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig: Partial<SessionMonitorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart monitoring with new config
    if (this.healthCheckInterval) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  /**
   * Get last health check timestamp
   */
  getLastHealthCheck(): number {
    return this.lastHealthCheck;
  }
}

export const sessionMonitor = SessionMonitorService.getInstance(); 