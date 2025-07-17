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

export class AuthValidator {
  
  /**
   * Validate email format
   */
  static validateEmail(email: string): ValidationResult {
    const errors: AuthValidationError[] = [];
    
    if (!email) {
      errors.push({
        field: 'email',
        message: 'Email address is required',
        code: 'EMAIL_REQUIRED'
      });
      return { isValid: false, errors };
    }

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(email)) {
      errors.push({
        field: 'email',
        message: 'Please enter a valid email address',
        code: 'EMAIL_INVALID'
      });
    }

    if (email.length > 254) {
      errors.push({
        field: 'email',
        message: 'Email address is too long',
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
        message: 'Password is required',
        code: 'PASSWORD_REQUIRED'
      });
      return { isValid: false, errors };
    }

    if (password.length < 8) {
      errors.push({
        field: 'password',
        message: 'Password must be at least 8 characters long',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    if (password.length > 128) {
      errors.push({
        field: 'password',
        message: 'Password is too long (max 128 characters)',
        code: 'PASSWORD_TOO_LONG'
      });
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one lowercase letter',
        code: 'PASSWORD_NO_LOWERCASE'
      });
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one uppercase letter',
        code: 'PASSWORD_NO_UPPERCASE'
      });
    }

    // Check for at least one number
    if (!/[0-9]/.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one number',
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
        message: 'This password is too common. Please choose a stronger password',
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
          message: 'Name must be a string',
          code: 'NAME_INVALID_TYPE'
        });
      } else if (data.name.trim().length === 0) {
        errors.push({
          field: 'name',
          message: 'Name cannot be empty',
          code: 'NAME_EMPTY'
        });
      } else if (data.name.trim().length > 100) {
        errors.push({
          field: 'name',
          message: 'Name is too long (max 100 characters)',
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
          message: 'Timezone must be a string',
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
            message: 'Invalid timezone identifier',
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
          message: 'Work hours must be an array of 7 elements (one for each day)',
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
            message: 'Invalid work hours format',
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
   * Check if password meets minimum requirements
   */
  static getPasswordStrength(password: string): {
    score: number;
    feedback: string[];
    isStrong: boolean;
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 1;
    else feedback.push('Use at least 8 characters');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Add lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Add uppercase letters');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Add numbers');

    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push('Add special characters');

    if (password.length >= 12) score += 1;

    return {
      score,
      feedback,
      isStrong: score >= 4
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