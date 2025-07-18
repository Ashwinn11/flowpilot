/**
 * Enterprise Security Configuration
 * Centralized security settings for the FlowPilot application
 */

export interface SecurityConfig {
  // Authentication & Session Security
  auth: {
    sessionTimeout: number; // 24 hours in milliseconds
    refreshThreshold: number; // 5 minutes before expiry
    maxConcurrentSessions: number;
    requireEmailVerification: boolean;
    requireStrongPasswords: boolean;
    passwordHistorySize: number;
    accountLockoutThreshold: number;
    accountLockoutDuration: number; // 15 minutes
    maxLoginAttempts: number;
  };

  // CSRF Protection
  csrf: {
    enabled: boolean;
    tokenExpiry: number; // 30 minutes
    requireForAll: boolean;
    exemptPaths: string[];
  };

  // Rate Limiting
  rateLimit: {
    enabled: boolean;
    windowMs: number; // 15 minutes
    maxRequests: {
      signin: number;
      signup: number;
      passwordReset: number;
      oauth: number;
      api: number;
      general: number;
    };
    skipPaths: string[];
  };

  // Input Validation & Sanitization
  validation: {
    maxInputLength: {
      email: number;
      password: number;
      name: number;
      description: number;
    };
    allowedFileTypes: string[];
    maxFileSize: number; // 5MB
    sanitizeHtml: boolean;
  };

  // Headers & CORS
  headers: {
    contentSecurityPolicy: string;
    strictTransportSecurity: string;
    xFrameOptions: string;
    xContentTypeOptions: string;
    xXSSProtection: string;
    referrerPolicy: string;
    permissionsPolicy: string;
  };

  // Logging & Monitoring
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    sensitiveFields: string[];
    logAuthEvents: boolean;
    logSecurityEvents: boolean;
    logPerformance: boolean;
  };

  // OAuth Security
  oauth: {
    stateValidation: boolean;
    pkceEnabled: boolean;
    allowedProviders: string[];
    redirectUriValidation: boolean;
  };

  // Database Security
  database: {
    connectionEncryption: boolean;
    queryTimeout: number;
    maxConnections: number;
    auditLogging: boolean;
  };

  // API Security
  api: {
    versioning: boolean;
    rateLimitPerEndpoint: boolean;
    requestSizeLimit: number; // 10MB
    timeout: number; // 30 seconds
  };
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  auth: {
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    refreshThreshold: 5 * 60 * 1000, // 5 minutes
    maxConcurrentSessions: 3,
    requireEmailVerification: true,
    requireStrongPasswords: true,
    passwordHistorySize: 5,
    accountLockoutThreshold: 5,
    accountLockoutDuration: 15 * 60 * 1000, // 15 minutes
    maxLoginAttempts: 5,
  },

  csrf: {
    enabled: true,
    tokenExpiry: 30 * 60 * 1000, // 30 minutes
    requireForAll: true,
    exemptPaths: [
      '/api/webhooks',
      '/api/health',
      '/api/metrics'
    ],
  },

  rateLimit: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: {
      signin: 5,
      signup: 3,
      passwordReset: 3,
      oauth: 10,
      api: 100,
      general: 1000,
    },
    skipPaths: [
      '/api/health',
      '/api/metrics',
      '/favicon.ico',
      '/robots.txt'
    ],
  },

  validation: {
    maxInputLength: {
      email: 254,
      password: 128,
      name: 100,
      description: 1000,
    },
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    sanitizeHtml: true,
  },

  headers: {
    contentSecurityPolicy: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co https://api.openai.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '),
    strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    xXSSProtection: '1; mode=block',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
  },

  logging: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    sensitiveFields: ['password', 'token', 'secret', 'key', 'authorization'],
    logAuthEvents: true,
    logSecurityEvents: true,
    logPerformance: true,
  },

  oauth: {
    stateValidation: true,
    pkceEnabled: true,
    allowedProviders: ['google', 'microsoft', 'github'],
    redirectUriValidation: true,
  },

  database: {
    connectionEncryption: true,
    queryTimeout: 30000, // 30 seconds
    maxConnections: 10,
    auditLogging: true,
  },

  api: {
    versioning: true,
    rateLimitPerEndpoint: true,
    requestSizeLimit: 10 * 1024 * 1024, // 10MB
    timeout: 30000, // 30 seconds
  },
};

export class SecurityConfigManager {
  private static instance: SecurityConfigManager;
  private config: SecurityConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): SecurityConfigManager {
    if (!SecurityConfigManager.instance) {
      SecurityConfigManager.instance = new SecurityConfigManager();
    }
    return SecurityConfigManager.instance;
  }

  private loadConfig(): SecurityConfig {
    // In production, this could load from environment variables or database
    const env = process.env.NODE_ENV;
    
    if (env === 'development') {
      return {
        ...DEFAULT_SECURITY_CONFIG,
        logging: {
          ...DEFAULT_SECURITY_CONFIG.logging,
          level: 'debug'
        },
        rateLimit: {
          ...DEFAULT_SECURITY_CONFIG.rateLimit,
          maxRequests: {
            ...DEFAULT_SECURITY_CONFIG.rateLimit.maxRequests,
            general: 10000 // Higher limit for development
          }
        }
      };
    }

    if (env === 'test') {
      return {
        ...DEFAULT_SECURITY_CONFIG,
        auth: {
          ...DEFAULT_SECURITY_CONFIG.auth,
          requireEmailVerification: false,
          maxLoginAttempts: 100
        },
        rateLimit: {
          ...DEFAULT_SECURITY_CONFIG.rateLimit,
          enabled: false
        },
        csrf: {
          ...DEFAULT_SECURITY_CONFIG.csrf,
          enabled: false
        }
      };
    }

    return DEFAULT_SECURITY_CONFIG;
  }

  getConfig(): SecurityConfig {
    return this.config;
  }

  updateConfig(updates: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  // Helper methods for common security checks
  isRateLimitEnabled(): boolean {
    return this.config.rateLimit.enabled;
  }

  isCSRFEnabled(): boolean {
    return this.config.csrf.enabled;
  }

  getMaxRequests(endpoint: keyof SecurityConfig['rateLimit']['maxRequests']): number {
    return this.config.rateLimit.maxRequests[endpoint];
  }

  shouldSkipRateLimit(path: string): boolean {
    return this.config.rateLimit.skipPaths.some(skipPath => 
      path.startsWith(skipPath)
    );
  }

  shouldSkipCSRF(path: string): boolean {
    return this.config.csrf.exemptPaths.some(exemptPath => 
      path.startsWith(exemptPath)
    );
  }

  getSecurityHeaders(): Record<string, string> {
    return this.config.headers;
  }

  isSensitiveField(fieldName: string): boolean {
    return this.config.logging.sensitiveFields.some(sensitiveField =>
      fieldName.toLowerCase().includes(sensitiveField.toLowerCase())
    );
  }
}

export const securityConfig = SecurityConfigManager.getInstance(); 