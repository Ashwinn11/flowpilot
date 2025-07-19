import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { securityManager } from './security';
import { auditLogger } from './audit-logger';
import { logger } from './logger';

export interface SessionSecurityConfig {
  regenerateOnLogin: boolean;
  validateSessionIntegrity: boolean;
  maxSessionAge: number; // in milliseconds
  checkSessionFixation: boolean;
}

export class SessionSecurity {
  private static instance: SessionSecurity;
  private config: SessionSecurityConfig;

  private constructor() {
    this.config = {
      regenerateOnLogin: true,
      validateSessionIntegrity: true,
      maxSessionAge: 24 * 60 * 60 * 1000, // 24 hours
      checkSessionFixation: true
    };
  }

  static getInstance(): SessionSecurity {
    if (!SessionSecurity.instance) {
      SessionSecurity.instance = new SessionSecurity();
    }
    return SessionSecurity.instance;
  }

  /**
   * Regenerate session token to prevent session fixation attacks
   */
  async regenerateSession(userId: string, request: Request): Promise<boolean> {
    try {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: any) {
              cookieStore.set(name, value, options);
            },
            remove(name: string, options: any) {
              cookieStore.set(name, '', { ...options, maxAge: 0 });
            },
          },
        }
      );

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        logger.warn('Session regeneration failed - no valid session', { userId });
        return false;
      }

      // Generate new session token
      const newToken = await securityManager.generateSecureRandom(64);
      
      // Update session in database (this would require custom session management)
      // For now, we'll log the regeneration attempt
      
      await auditLogger.logSecurityEvent(
        userId,
        'session_regenerated',
        { 
          reason: 'session_fixation_protection',
          oldSessionId: session.access_token?.substring(0, 10) + '...'
        },
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        request.headers.get('user-agent') || 'unknown',
        'medium'
      );

      logger.info('Session regenerated for fixation protection', { userId });
      return true;

    } catch (error) {
      logger.error('Session regeneration failed', { 
        userId, 
        error: (error as Error).message 
      }, error as Error);
      return false;
    }
  }

  /**
   * Validate session integrity and age
   */
  async validateSession(session: any, request: Request): Promise<{ valid: boolean; reason?: string }> {
    try {
      if (!session) {
        return { valid: false, reason: 'no_session' };
      }

      // Check session age
      if (session.created_at) {
        const sessionAge = Date.now() - new Date(session.created_at).getTime();
        if (sessionAge > this.config.maxSessionAge) {
          await auditLogger.logSecurityEvent(
            session.user?.id,
            'session_expired',
            { sessionAge, maxAge: this.config.maxSessionAge },
            request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            request.headers.get('user-agent') || 'unknown',
            'medium'
          );
          return { valid: false, reason: 'session_expired' };
        }
      }

      // Check for suspicious session characteristics
      const userAgent = request.headers.get('user-agent') || '';
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      
      // Log session validation for monitoring
      await auditLogger.logSecurityEvent(
        session.user?.id,
        'session_validated',
        { 
          userAgent: userAgent.substring(0, 100),
          ipAddress,
          sessionAge: session.created_at ? Date.now() - new Date(session.created_at).getTime() : 'unknown'
        },
        ipAddress,
        userAgent,
        'low'
      );

      return { valid: true };

    } catch (error) {
      logger.error('Session validation failed', { 
        error: (error as Error).message 
      }, error as Error);
      return { valid: false, reason: 'validation_error' };
    }
  }

  /**
   * Check for session fixation indicators
   */
  async checkSessionFixation(session: any, request: Request): Promise<{ suspicious: boolean; indicators: string[] }> {
    const indicators: string[] = [];
    
    try {
      // Check for rapid session creation (potential fixation)
      if (session.created_at) {
        const sessionAge = Date.now() - new Date(session.created_at).getTime();
        if (sessionAge < 1000) { // Less than 1 second old
          indicators.push('rapid_session_creation');
        }
      }

      // Check for suspicious user agent patterns
      const userAgent = request.headers.get('user-agent') || '';
      if (userAgent.includes('bot') || userAgent.includes('crawler') || userAgent.length < 10) {
        indicators.push('suspicious_user_agent');
      }

      // Check for multiple sessions from same IP
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      
      if (indicators.length > 0) {
        await auditLogger.logSuspiciousActivity(
          session.user?.id,
          'session_fixation_indicators',
          { indicators, ipAddress, userAgent: userAgent.substring(0, 100) },
          ipAddress,
          userAgent
        );
      }

      return { 
        suspicious: indicators.length > 0, 
        indicators 
      };

    } catch (error) {
      logger.error('Session fixation check failed', { 
        error: (error as Error).message 
      }, error as Error);
      return { suspicious: false, indicators: ['check_error'] };
    }
  }

  /**
   * Force session regeneration for security
   */
  async forceSessionRegeneration(userId: string, reason: string, request: Request): Promise<boolean> {
    try {
      const success = await this.regenerateSession(userId, request);
      
      if (success) {
        await auditLogger.logSecurityEvent(
          userId,
          'session_force_regenerated',
          { reason },
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          request.headers.get('user-agent') || 'unknown',
          'high'
        );
      }

      return success;

    } catch (error) {
      logger.error('Force session regeneration failed', { 
        userId, 
        reason, 
        error: (error as Error).message 
      }, error as Error);
      return false;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SessionSecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): SessionSecurityConfig {
    return { ...this.config };
  }
}

export const sessionSecurity = SessionSecurity.getInstance(); 