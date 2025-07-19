/**
 * Security Validation Script
 * Comprehensive security validation for FlowPilot application
 * 
 * This script validates the security implementation without requiring a testing framework.
 * Run with: npx ts-node tests/security.test.ts
 */

import { securityManager } from '../lib/security';
import { AuthValidator, AuthSecurity } from '../lib/auth-validation';
import { logger } from '../lib/logger';

// Simple test runner
class SecurityValidator {
  private tests: Array<{ name: string; fn: () => boolean | Promise<boolean> }> = [];
  private passed = 0;
  private failed = 0;

  test(name: string, fn: () => boolean | Promise<boolean>) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🔒 Running Security Validation Tests...\n');
    
    for (const test of this.tests) {
      try {
        const result = await test.fn();
        if (result) {
          console.log(`✅ ${test.name}`);
          this.passed++;
        } else {
          console.log(`❌ ${test.name}`);
          this.failed++;
        }
      } catch (error) {
        console.log(`❌ ${test.name} - Error: ${error}`);
        this.failed++;
      }
    }
    
    console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed`);
    return this.failed === 0;
  }
}

// Create validator instance
const validator = new SecurityValidator();

// CSRF Protection Tests
validator.test('CSRF token generation', async () => {
  const token = await securityManager.generateCSRFToken();
  return Boolean(token && typeof token === 'string' && token.length > 32);
});

validator.test('CSRF token validation', async () => {
  const token = await securityManager.generateCSRFToken();
  return securityManager.validateCSRFToken(token);
});

validator.test('CSRF token rejection', () => {
  return !securityManager.validateCSRFToken('invalid-token');
});

// Rate Limiting Tests
validator.test('Rate limiting tracking', () => {
  const identifier = 'test@example.com';
  
  // Clear any existing state
  securityManager.clearRateLimit(identifier);
  
  // First few attempts should not be rate limited
  for (let i = 0; i < 4; i++) {
    if (securityManager.isRateLimited(identifier, 5, 15 * 60 * 1000)) {
      return false;
    }
    securityManager.recordLoginAttempt(identifier);
  }
  
  // Fifth attempt should trigger rate limiting
  return securityManager.isRateLimited(identifier, 5, 15 * 60 * 1000);
});

validator.test('Rate limiting reset', () => {
  const identifier = 'test@example.com';
  
  // Trigger rate limiting
  for (let i = 0; i < 5; i++) {
    securityManager.recordLoginAttempt(identifier);
  }
  
  if (!securityManager.isRateLimited(identifier, 5, 15 * 60 * 1000)) {
    return false;
  }
  
  // Clear rate limiting
  securityManager.clearRateLimit(identifier);
  return !securityManager.isRateLimited(identifier, 5, 15 * 60 * 1000);
});

validator.test('Account lockout', () => {
  const identifier = 'test@example.com';
  
  // Clear any existing state
  securityManager.clearRateLimit(identifier);
  
  // Trigger account lockout
  for (let i = 0; i < 5; i++) {
    securityManager.recordLoginAttempt(identifier);
  }
  
  return securityManager.isAccountLocked(identifier);
});

// Password Security Tests
validator.test('Strong password validation', () => {
  const strongPassword = 'StrongPass123!';
  const result = AuthValidator.validatePassword(strongPassword);
  return result.isValid;
});

validator.test('Weak password rejection', () => {
  const weakPasswords = ['weak', 'password', '123456', 'qwerty', 'abc123'];
  
  for (const password of weakPasswords) {
    const result = AuthValidator.validatePassword(password);
    if (result.isValid) {
      return false;
    }
  }
  return true;
});

validator.test('Password history tracking', () => {
  const user = 'test@example.com';
  const passwords = ['Pass1!', 'Pass2!', 'Pass3!', 'Pass4!', 'Pass5!'];
  
  // Clear any existing history
  securityManager.clearAllData();
  
  passwords.forEach(password => {
    securityManager.addPasswordToHistory(user, password);
  });
  
  // Should detect recent passwords
  return securityManager.isPasswordInHistory(user, 'Pass1!') && 
         securityManager.isPasswordInHistory(user, 'Pass5!');
});

// Input Validation Tests
validator.test('Input sanitization', () => {
  const maliciousInputs = [
    '<script>alert("xss")</script>',
    'javascript:alert("xss")',
    'data:text/html,<script>alert("xss")</script>',
    '"><script>alert("xss")</script>',
    'admin\' OR 1=1--',
    'admin"; DROP TABLE users;--'
  ];

  for (const input of maliciousInputs) {
    const sanitized = AuthValidator.sanitizeInput(input);
    if (sanitized.includes('<script>') || 
        sanitized.includes('javascript:') || 
        sanitized.includes('data:text/html') || 
        sanitized.includes('DROP TABLE')) {
      return false;
    }
  }
  return true;
});

validator.test('Email validation', () => {
  const validEmails = [
    'test@example.com',
    'user.name@domain.co.uk',
    'user+tag@example.org'
  ];

  const invalidEmails = [
    'invalid-email',
    '@example.com',
    'user@',
    'user..name@example.com',
    'user@.com'
  ];

  // Test valid emails
  for (const email of validEmails) {
    const result = AuthValidator.validateEmail(email);
    if (!result.isValid) {
      return false;
    }
  }

  // Test invalid emails
  for (const email of invalidEmails) {
    const result = AuthValidator.validateEmail(email);
    if (result.isValid) {
      return false;
    }
  }
  
  return true;
});

// Session Security Tests
validator.test('Secure random generation', async () => {
  const sessionId1 = await securityManager.generateSecureRandom(32);
  const sessionId2 = await securityManager.generateSecureRandom(32);
  
  return sessionId1 !== sessionId2 && 
         sessionId1.length === 64 && 
         sessionId2.length === 64;
});

validator.test('JWT format validation', () => {
  const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  const invalidToken = 'invalid.token.here';
  
  return AuthSecurity.isValidJWTFormat(validToken) && 
         !AuthSecurity.isValidJWTFormat(invalidToken);
});

// Error Handling Tests
validator.test('Secure error responses', () => {
  const error = new Error('Database connection failed');
  const response = AuthSecurity.generateSecureErrorResponse(error, 'Authentication failed');
  
  return response.error === 'Authentication failed' && 
         response.code === 'AUTH_ERROR' &&
         typeof response.timestamp === 'string';
});

// Integration Tests
validator.test('Concurrent rate limiting', async () => {
  const identifier = 'test@example.com';
  
  // Clear any existing state
  securityManager.clearRateLimit(identifier);
  
  const promises = [];
  
  // Simulate concurrent login attempts
  for (let i = 0; i < 10; i++) {
    promises.push(
      new Promise(resolve => {
        setTimeout(() => {
          const isLimited = securityManager.isRateLimited(identifier, 5, 15 * 60 * 1000);
          if (!isLimited) {
            securityManager.recordLoginAttempt(identifier);
          }
          resolve(isLimited);
        }, Math.random() * 100);
      })
    );
  }
  
  const results = await Promise.all(promises);
  const limitedAttempts = results.filter(Boolean).length;
  
  // Should have rate limited some attempts
  return limitedAttempts > 0;
});

// Run the validation
async function runSecurityValidation() {
  try {
    const success = await validator.run();
    
    if (success) {
      console.log('\n🎉 All security tests passed! The application is secure.');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some security tests failed. Please review the implementation.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Security validation failed with error:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runSecurityValidation();
}

export { SecurityValidator, runSecurityValidation }; 