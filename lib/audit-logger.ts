import { supabase } from './supabase';
import { logger } from './logger';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class AuditLogger {
  private static instance: AuditLogger;

  private constructor() {}

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      // Log to structured logger first
      logger.info('Audit log entry', {
        action: entry.action,
        userId: entry.userId,
        severity: entry.severity,
        details: entry.details
      });

      // Store in database
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: entry.userId,
          action: entry.action,
          details: entry.details,
          ip_address: entry.ipAddress,
          user_agent: entry.userAgent,
          severity: entry.severity
        });

      if (error) {
        logger.error('Failed to store audit log', { error: error.message }, error);
      }
    } catch (error) {
      logger.error('Audit logging failed', { error: (error as Error).message }, error as Error);
    }
  }

  // Convenience methods for common security events
  async logLogin(userId: string, success: boolean, details?: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      userId,
      action: success ? 'login_success' : 'login_failed',
      details: { success, ...details },
      ipAddress,
      userAgent,
      severity: success ? 'low' : 'medium'
    });
  }

  async logLogout(userId: string, details?: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      userId,
      action: 'logout',
      details,
      ipAddress,
      userAgent,
      severity: 'low'
    });
  }

  async logPasswordChange(userId: string, details?: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      userId,
      action: 'password_change',
      details,
      ipAddress,
      userAgent,
      severity: 'high'
    });
  }

  async logMFAEvent(userId: string, action: 'mfa_enabled' | 'mfa_disabled' | 'mfa_challenge_success' | 'mfa_challenge_failed', details?: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      userId,
      action,
      details,
      ipAddress,
      userAgent,
      severity: action.includes('failed') ? 'high' : 'medium'
    });
  }

  async logSecurityEvent(userId: string, action: string, details?: Record<string, any>, ipAddress?: string, userAgent?: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<void> {
    await this.log({
      userId,
      action,
      details,
      ipAddress,
      userAgent,
      severity
    });
  }

  async logSuspiciousActivity(userId: string, action: string, details?: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      userId,
      action,
      details,
      ipAddress,
      userAgent,
      severity: 'high'
    });
  }
}

export const auditLogger = AuditLogger.getInstance(); 