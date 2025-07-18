// Edge Runtime compatible security utilities
// Using Web Crypto API instead of Node.js crypto

export interface SecurityConfig {
  csrfTokenExpiry: number; // in milliseconds
  sessionTimeout: number; // in milliseconds
  maxLoginAttempts: number;
  lockoutDuration: number; // in milliseconds
  passwordHistorySize: number;
}

export class SecurityManager {
  private static instance: SecurityManager;
  private csrfTokens: Map<string, { token: string; expires: number }> = new Map();
  private loginAttempts: Map<string, { count: number; lastAttempt: number; lockedUntil?: number }> = new Map();
  private passwordHistory: Map<string, string[]> = new Map();
  
  private config: SecurityConfig = {
    csrfTokenExpiry: 30 * 60 * 1000, // 30 minutes
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    passwordHistorySize: 5,
  };

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  /**
   * Generate a secure random string using Web Crypto API
   */
  async generateSecureRandom(length: number): Promise<string> {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate a CSRF token
   */
  async generateCSRFToken(): Promise<string> {
    const token = await this.generateSecureRandom(32);
    const expires = Date.now() + this.config.csrfTokenExpiry;
    
    this.csrfTokens.set(token, { token, expires });
    
    // Clean up expired tokens
    this.cleanupExpiredTokens();
    
    return token;
  }

  /**
   * Validate a CSRF token
   */
  validateCSRFToken(token: string, userId?: string): boolean {
    const tokenData = this.csrfTokens.get(token);
    
    if (!tokenData) {
      return false;
    }
    
    if (Date.now() > tokenData.expires) {
      this.csrfTokens.delete(token);
      return false;
    }
    
    return true;
  }

  /**
   * Clean up expired CSRF tokens
   */
  private cleanupExpiredTokens(): void {
    const now = Date.now();
    const entries = Array.from(this.csrfTokens.entries());
    for (const [token, data] of entries) {
      if (now > data.expires) {
        this.csrfTokens.delete(token);
      }
    }
  }

  /**
   * Check if a user is rate limited
   */
  isRateLimited(identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
    const attempts = this.loginAttempts.get(identifier);
    
    if (!attempts) {
      return false;
    }
    
    const now = Date.now();
    const timeSinceLastAttempt = now - attempts.lastAttempt;
    
    // Reset if window has passed
    if (timeSinceLastAttempt > windowMs) {
      this.loginAttempts.delete(identifier);
      return false;
    }
    
    // Check if account is locked
    if (attempts.lockedUntil && now < attempts.lockedUntil) {
      return true;
    }
    
    return attempts.count >= maxAttempts;
  }

  /**
   * Record a login attempt
   */
  recordLoginAttempt(identifier: string): void {
    const attempts = this.loginAttempts.get(identifier) || { count: 0, lastAttempt: 0 };
    const now = Date.now();
    
    attempts.count += 1;
    attempts.lastAttempt = now;
    
    // Lock account if max attempts exceeded
    if (attempts.count >= this.config.maxLoginAttempts) {
      attempts.lockedUntil = now + this.config.lockoutDuration;
    }
    
    this.loginAttempts.set(identifier, attempts);
  }

  /**
   * Check if an account is locked
   */
  isAccountLocked(identifier: string): boolean {
    const attempts = this.loginAttempts.get(identifier);
    
    if (!attempts || !attempts.lockedUntil) {
      return false;
    }
    
    return Date.now() < attempts.lockedUntil;
  }

  /**
   * Clear rate limiting for a user
   */
  clearRateLimit(identifier: string): void {
    this.loginAttempts.delete(identifier);
  }

  /**
   * Add password to history
   */
  addPasswordToHistory(userId: string, password: string): void {
    const history = this.passwordHistory.get(userId) || [];
    history.push(password);
    
    // Keep only the last N passwords
    if (history.length > this.config.passwordHistorySize) {
      history.shift();
    }
    
    this.passwordHistory.set(userId, history);
  }

  /**
   * Check if password is in history
   */
  isPasswordInHistory(userId: string, password: string): boolean {
    const history = this.passwordHistory.get(userId) || [];
    return history.includes(password);
  }

  /**
   * Clear all data (for testing)
   */
  clearAllData(): void {
    this.csrfTokens.clear();
    this.loginAttempts.clear();
    this.passwordHistory.clear();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): SecurityConfig {
    return this.config;
  }
}

// Export singleton instance
export const securityManager = SecurityManager.getInstance(); 