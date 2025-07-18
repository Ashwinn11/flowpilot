import { toast } from 'sonner';

// Input validation schemas
export interface AuthValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: AuthValidationError[];
  sanitizedData?: any;
}

// Centralized error messages for consistency
export const AuthErrorMessages = {
  // Email errors
  EMAIL_REQUIRED: 'Email address is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  EMAIL_TOO_LONG: 'Email address is too long',
  EMAIL_NOT_FOUND: 'No account found with this email address',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists',
  
  // Password errors
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long',
  PASSWORD_TOO_LONG: 'Password is too long (max 128 characters)',
  PASSWORD_NO_LOWERCASE: 'Password must contain at least one lowercase letter',
  PASSWORD_NO_UPPERCASE: 'Password must contain at least one uppercase letter',
  PASSWORD_NO_NUMBER: 'Password must contain at least one number',
  PASSWORD_TOO_COMMON: 'This password is too common. Please choose a stronger password',
  PASSWORD_MISMATCH: 'Passwords do not match',
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  
  // Name errors
  NAME_REQUIRED: 'Name is required',
  NAME_EMPTY: 'Name cannot be empty',
  NAME_TOO_LONG: 'Name is too long (max 100 characters)',
  NAME_INVALID_TYPE: 'Name must be a string',
  
  // Timezone errors
  TIMEZONE_INVALID: 'Invalid timezone identifier',
  TIMEZONE_INVALID_TYPE: 'Timezone must be a string',
  
  // Work hours errors
  WORK_HOURS_REQUIRED: 'Please set your work hours',
  WORK_DAYS_REQUIRED: 'Please select at least one work day',
  
  // Terms errors
  TERMS_REQUIRED: 'You must accept the terms and conditions',
  
  // Rate limiting errors
  RATE_LIMIT_SIGNUP: 'Too many signup attempts. Please try again later.',
  RATE_LIMIT_SIGNIN: 'Too many signin attempts. Please try again later.',
  RATE_LIMIT_PASSWORD_RESET: 'Too many password reset requests. Please try again later.',
  RATE_LIMIT_OAUTH: 'Too many sign-in attempts. Please try again later.',
  
  // OAuth errors
  OAUTH_GOOGLE_FAILED: 'Google sign-in failed. Please try again.',
  OAUTH_MICROSOFT_FAILED: 'Microsoft sign-in failed. Please try again.',
  OAUTH_PROVIDER_REQUIRED: 'This email is registered with {provider}. Please use the {provider} button above.',
  
  // Email verification errors
  EMAIL_NOT_VERIFIED: 'Please verify your email address before signing in. Check your inbox for a verification link.',
  EMAIL_VERIFICATION_REQUIRED: 'Please check your email and click the verification link to complete your signup.',
  
  // General errors
  UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable. Please try again later.',
  
  // Success messages
  SIGNUP_SUCCESS: 'Your account was created! Please check your email to verify and get started.',
  SIGNIN_SUCCESS: 'Welcome back! You\'ve signed in successfully.',
  PASSWORD_RESET_SENT: 'Password reset email sent successfully!',
  PASSWORD_RESET_SUCCESS: 'Your password has been reset successfully.',
  EMAIL_VERIFICATION_SENT: 'Verification email sent successfully!',
  
  // Info messages
  NEW_USER_REDIRECT: 'No account found. Redirecting to signup...',
  CHECKING_ACCOUNT: 'Checking your account...',
} as const;

export class AuthValidator {
  
  /**
   * Validate email format
   */
  static validateEmail(email: string): ValidationResult {
    const errors: AuthValidationError[] = [];
    
    if (!email) {
      errors.push({
        field: 'email',
        message: AuthErrorMessages.EMAIL_REQUIRED,
        code: 'EMAIL_REQUIRED'
      });
      return { isValid: false, errors };
    }

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(email)) {
      errors.push({
        field: 'email',
        message: AuthErrorMessages.EMAIL_INVALID,
        code: 'EMAIL_INVALID'
      });
    }

    if (email.length > 254) {
      errors.push({
        field: 'email',
        message: AuthErrorMessages.EMAIL_TOO_LONG,
        code: 'EMAIL_TOO_LONG'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: { email: email.toLowerCase().trim() }
    };
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): ValidationResult {
    const errors: AuthValidationError[] = [];
    
    if (!password) {
      errors.push({
        field: 'password',
        message: AuthErrorMessages.PASSWORD_REQUIRED,
        code: 'PASSWORD_REQUIRED'
      });
      return { isValid: false, errors };
    }

    if (password.length < 8) {
      errors.push({
        field: 'password',
        message: AuthErrorMessages.PASSWORD_TOO_SHORT,
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    if (password.length > 128) {
      errors.push({
        field: 'password',
        message: AuthErrorMessages.PASSWORD_TOO_LONG,
        code: 'PASSWORD_TOO_LONG'
      });
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push({
        field: 'password',
        message: AuthErrorMessages.PASSWORD_NO_LOWERCASE,
        code: 'PASSWORD_NO_LOWERCASE'
      });
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push({
        field: 'password',
        message: AuthErrorMessages.PASSWORD_NO_UPPERCASE,
        code: 'PASSWORD_NO_UPPERCASE'
      });
    }

    // Check for at least one number
    if (!/[0-9]/.test(password)) {
      errors.push({
        field: 'password',
        message: AuthErrorMessages.PASSWORD_NO_NUMBER,
        code: 'PASSWORD_NO_NUMBER'
      });
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password', 'password123', '123456789', 'qwerty', 'abc123',
      'password1', 'admin', 'welcome', 'letmein', 'monkey'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push({
        field: 'password',
        message: AuthErrorMessages.PASSWORD_TOO_COMMON,
        code: 'PASSWORD_TOO_COMMON'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: { password }
    };
  }

  /**
   * Validate user profile data
   */
  static validateProfileUpdate(data: any): ValidationResult {
    const errors: AuthValidationError[] = [];
    const sanitizedData: any = {};

    // Validate name
    if (data.name !== undefined) {
      if (typeof data.name !== 'string') {
        errors.push({
          field: 'name',
          message: AuthErrorMessages.NAME_INVALID_TYPE,
          code: 'NAME_INVALID_TYPE'
        });
      } else if (data.name.trim().length === 0) {
        errors.push({
          field: 'name',
          message: AuthErrorMessages.NAME_EMPTY,
          code: 'NAME_EMPTY'
        });
      } else if (data.name.trim().length > 100) {
        errors.push({
          field: 'name',
          message: AuthErrorMessages.NAME_TOO_LONG,
          code: 'NAME_TOO_LONG'
        });
      } else {
        sanitizedData.name = data.name.trim();
      }
    }

    // Validate email
    if (data.email !== undefined) {
      const emailValidation = this.validateEmail(data.email);
      if (!emailValidation.isValid) {
        errors.push(...emailValidation.errors);
      } else {
        sanitizedData.email = emailValidation.sanitizedData?.email;
      }
    }

    // Validate timezone
    if (data.timezone !== undefined) {
      if (typeof data.timezone !== 'string') {
        errors.push({
          field: 'timezone',
          message: AuthErrorMessages.TIMEZONE_INVALID_TYPE,
          code: 'TIMEZONE_INVALID_TYPE'
        });
      } else {
        try {
          // Test if timezone is valid
          Intl.DateTimeFormat(undefined, { timeZone: data.timezone });
          sanitizedData.timezone = data.timezone;
        } catch (error) {
          errors.push({
            field: 'timezone',
            message: AuthErrorMessages.TIMEZONE_INVALID,
            code: 'TIMEZONE_INVALID'
          });
        }
      }
    }

    // Validate work hours
    if (data.workHours !== undefined) {
      if (!Array.isArray(data.workHours) || data.workHours.length !== 7) {
        errors.push({
          field: 'workHours',
          message: AuthErrorMessages.WORK_HOURS_REQUIRED,
          code: 'WORK_HOURS_INVALID_FORMAT'
        });
      } else {
        const validWorkHours = data.workHours.every((day: any) => 
          typeof day === 'object' && 
          typeof day.enabled === 'boolean' &&
          (typeof day.start === 'string' || day.start === null) &&
          (typeof day.end === 'string' || day.end === null)
        );
        
        if (!validWorkHours) {
          errors.push({
            field: 'workHours',
            message: AuthErrorMessages.WORK_HOURS_REQUIRED,
            code: 'WORK_HOURS_INVALID_STRUCTURE'
          });
        } else {
          sanitizedData.workHours = data.workHours;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData
    };
  }

  /**
   * Sanitize input to prevent XSS
   */
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  }

  /**
   * Generate user-friendly error message
   */
  static getErrorMessage(errors: AuthValidationError[]): string {
    if (errors.length === 0) return '';
    
    // Return the first error message
    return errors[0].message;
  }

  /**
   * Enhanced password strength checker with detailed feedback
   */
  static getPasswordStrength(password: string): {
    score: number;
    feedback: string[];
    isStrong: boolean;
    requirements: {
      length: boolean;
      lowercase: boolean;
      uppercase: boolean;
      numbers: boolean;
      special: boolean;
      noCommon: boolean;
      noSequential: boolean;
    };
  } {
    const feedback: string[] = [];
    let score = 0;
    const requirements = {
      length: false,
      lowercase: false,
      uppercase: false,
      numbers: false,
      special: false,
      noCommon: false,
      noSequential: false
    };

    // Length check (8+ characters)
    if (password.length >= 8) {
      score += 1;
      requirements.length = true;
    } else {
      feedback.push('Use at least 8 characters');
    }

    // Lowercase letters
    if (/[a-z]/.test(password)) {
      score += 1;
      requirements.lowercase = true;
    } else {
      feedback.push('Add lowercase letters');
    }

    // Uppercase letters
    if (/[A-Z]/.test(password)) {
      score += 1;
      requirements.uppercase = true;
    } else {
      feedback.push('Add uppercase letters');
    }

    // Numbers
    if (/[0-9]/.test(password)) {
      score += 1;
      requirements.numbers = true;
    } else {
      feedback.push('Add numbers');
    }

    // Special characters
    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 1;
      requirements.special = true;
    } else {
      feedback.push('Add special characters (!@#$%^&*)');
    }

    // Length bonus (12+ characters)
    if (password.length >= 12) {
      score += 1;
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password', 'password123', '123456789', 'qwerty', 'abc123',
      'password1', 'admin', 'welcome', 'letmein', 'monkey',
      '123456', '12345678', 'qwerty123', '1q2w3e4r', 'password123',
      'admin123', 'root', 'toor', 'test', 'guest'
    ];
    
    if (!commonPasswords.includes(password.toLowerCase())) {
      score += 1;
      requirements.noCommon = true;
    } else {
      feedback.push('Avoid common passwords');
    }

    // Check for sequential characters (like 123, abc, qwe)
    const sequentialPatterns = [
      '123', '234', '345', '456', '567', '678', '789', '890',
      'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi', 'hij',
      'qwe', 'wer', 'ert', 'rty', 'tyu', 'yui', 'uio', 'iop',
      'asd', 'sdf', 'dfg', 'fgh', 'ghj', 'hjk', 'jkl', 'kl;'
    ];
    
    const hasSequential = sequentialPatterns.some(pattern => 
      password.toLowerCase().includes(pattern)
    );
    
    if (!hasSequential) {
      score += 1;
      requirements.noSequential = true;
    } else {
      feedback.push('Avoid sequential characters (123, abc, qwe)');
    }

    // Check for repeated characters
    const hasRepeated = /(.)\1{2,}/.test(password);
    if (!hasRepeated) {
      score += 1;
    } else {
      feedback.push('Avoid repeated characters (aaa, 111)');
    }

    // Check for keyboard patterns
    const keyboardPatterns = [
      'qwerty', 'asdfgh', 'zxcvbn', '123456', '654321'
    ];
    
    const hasKeyboardPattern = keyboardPatterns.some(pattern => 
      password.toLowerCase().includes(pattern)
    );
    
    if (!hasKeyboardPattern) {
      score += 1;
    } else {
      feedback.push('Avoid keyboard patterns');
    }

    return {
      score: Math.min(score, 10), // Cap at 10
      feedback,
      isStrong: score >= 6,
      requirements
    };
  }
}

// Rate limiting utilities
export class RateLimit {
  private static attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  
  /**
   * Check if rate limit is exceeded
   */
  static isRateLimited(
    identifier: string, 
    maxAttempts: number = 5, 
    windowMs: number = 15 * 60 * 1000 // 15 minutes
  ): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);
    
    if (!record) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return false;
    }
    
    // Reset if window has passed
    if (now - record.lastAttempt > windowMs) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return false;
    }
    
    // Increment count
    record.count += 1;
    record.lastAttempt = now;
    
    return record.count > maxAttempts;
  }
  
  /**
   * Get remaining time until rate limit resets
   */
  static getTimeUntilReset(identifier: string, windowMs: number = 15 * 60 * 1000): number {
    const record = this.attempts.get(identifier);
    if (!record) return 0;
    
    const now = Date.now();
    const timePassed = now - record.lastAttempt;
    const remaining = Math.max(0, windowMs - timePassed);
    
    return remaining;
  }
  
  /**
   * Clear rate limit for identifier
   */
  static clearRateLimit(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

// Security utilities
export class AuthSecurity {
  
  /**
   * Get client IP address from request
   */
  static getClientIP(request: Request): string {
    // Check various headers for the real IP
    const headers = [
      'x-forwarded-for',
      'x-real-ip',
      'x-client-ip',
      'cf-connecting-ip'
    ];
    
    for (const header of headers) {
      const value = request.headers.get(header);
      if (value) {
        // x-forwarded-for can contain multiple IPs, get the first one
        return value.split(',')[0].trim();
      }
    }
    
    return 'unknown';
  }
  
  /**
   * Generate secure error response that doesn't leak information
   */
  static generateSecureErrorResponse(error: any, userMessage: string = 'Authentication failed') {
    // Log the actual error for debugging
    console.error('Auth error:', error);
    
    // Return only safe user message
    return {
      error: userMessage,
      code: 'AUTH_ERROR',
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Validate JWT token format (basic check)
   */
  static isValidJWTFormat(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    
    const parts = token.split('.');
    return parts.length === 3;
  }
} 