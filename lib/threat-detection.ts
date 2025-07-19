import { supabase } from './supabase';
import { auditLogger } from './audit-logger';
import { logger } from './logger';
import { securityManager } from './security';

export interface ThreatPattern {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  threshold: number;
  timeWindow: number; // in milliseconds
  action: 'log' | 'block' | 'challenge' | 'alert';
  enabled: boolean;
}

export interface ThreatEvent {
  id: string;
  userId?: string;
  patternId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  action: 'logged' | 'blocked' | 'challenged' | 'alerted';
}

export interface ThreatMetrics {
  totalEvents: number;
  eventsBySeverity: Record<string, number>;
  eventsByPattern: Record<string, number>;
  recentEvents: ThreatEvent[];
  blockedIPs: string[];
  challengedUsers: string[];
}

export class ThreatDetection {
  private static instance: ThreatDetection;
  private patterns: Map<string, ThreatPattern>;
  private eventCounts: Map<string, { count: number; firstSeen: Date }>;
  private blockedIPs: Set<string>;
  private challengedUsers: Set<string>;

  private constructor() {
    this.patterns = new Map();
    this.eventCounts = new Map();
    this.blockedIPs = new Set();
    this.challengedUsers = new Set();
    this.initializeDefaultPatterns();
  }

  static getInstance(): ThreatDetection {
    if (!ThreatDetection.instance) {
      ThreatDetection.instance = new ThreatDetection();
    }
    return ThreatDetection.instance;
  }

  private initializeDefaultPatterns(): void {
    const defaultPatterns: ThreatPattern[] = [
      {
        id: 'brute_force_login',
        name: 'Brute Force Login Attempts',
        description: 'Multiple failed login attempts from same IP',
        severity: 'high',
        threshold: 5,
        timeWindow: 15 * 60 * 1000, // 15 minutes
        action: 'block',
        enabled: true
      },
      {
        id: 'rapid_requests',
        name: 'Rapid API Requests',
        description: 'Too many requests in short time period',
        severity: 'medium',
        threshold: 100,
        timeWindow: 60 * 1000, // 1 minute
        action: 'challenge',
        enabled: true
      },
      {
        id: 'suspicious_user_agent',
        name: 'Suspicious User Agent',
        description: 'Requests with suspicious or missing user agent',
        severity: 'medium',
        threshold: 1,
        timeWindow: 60 * 60 * 1000, // 1 hour
        action: 'log',
        enabled: true
      },
      {
        id: 'account_takeover_attempt',
        name: 'Account Takeover Attempt',
        description: 'Multiple login attempts with different credentials',
        severity: 'critical',
        threshold: 3,
        timeWindow: 30 * 60 * 1000, // 30 minutes
        action: 'alert',
        enabled: true
      },
      {
        id: 'mfa_bypass_attempt',
        name: 'MFA Bypass Attempt',
        description: 'Multiple failed MFA challenges',
        severity: 'high',
        threshold: 3,
        timeWindow: 10 * 60 * 1000, // 10 minutes
        action: 'block',
        enabled: true
      },
      {
        id: 'session_hijacking',
        name: 'Session Hijacking Attempt',
        description: 'Multiple sessions from different IPs',
        severity: 'critical',
        threshold: 2,
        timeWindow: 5 * 60 * 1000, // 5 minutes
        action: 'alert',
        enabled: true
      }
    ];

    defaultPatterns.forEach(pattern => {
      this.patterns.set(pattern.id, pattern);
    });
  }

  /**
   * Check for threats based on the given event
   */
  async checkThreat(
    patternId: string,
    userId?: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ threat: boolean; action?: string; severity?: string }> {
    try {
      const pattern = this.patterns.get(patternId);
      if (!pattern || !pattern.enabled) {
        return { threat: false };
      }

      const key = `${patternId}:${ipAddress || 'unknown'}:${userId || 'anonymous'}`;
      const now = new Date();
      
      // Get or initialize event count
      let eventCount = this.eventCounts.get(key);
      if (!eventCount) {
        eventCount = { count: 0, firstSeen: now };
        this.eventCounts.set(key, eventCount);
      }

      // Check if within time window
      const timeSinceFirst = now.getTime() - eventCount.firstSeen.getTime();
      if (timeSinceFirst > pattern.timeWindow) {
        // Reset counter if outside time window
        eventCount.count = 0;
        eventCount.firstSeen = now;
      }

      // Increment counter
      eventCount.count++;

      // Check if threshold exceeded
      if (eventCount.count >= pattern.threshold) {
        // Create threat event
        const threatEvent: ThreatEvent = {
          id: await securityManager.generateSecureRandom(16),
          userId,
          patternId,
          severity: pattern.severity,
          details: {
            ...details,
            count: eventCount.count,
            timeWindow: pattern.timeWindow,
            threshold: pattern.threshold
          },
          timestamp: now,
          ipAddress,
          userAgent,
          action: this.executeAction(pattern.action, ipAddress, userId)
        };

        // Log threat event
        await this.logThreatEvent(threatEvent);

        // Execute action
        await this.executeThreatAction(pattern.action, ipAddress, userId, threatEvent);

        return {
          threat: true,
          action: pattern.action,
          severity: pattern.severity
        };
      }

      return { threat: false };

    } catch (error) {
      logger.error('Threat detection check failed', {
        patternId,
        userId,
        error: (error as Error).message
      }, error as Error);
      return { threat: false };
    }
  }

  /**
   * Execute threat action
   */
  private async executeThreatAction(
    action: string,
    ipAddress?: string,
    userId?: string,
    threatEvent?: ThreatEvent
  ): Promise<void> {
    try {
      switch (action) {
        case 'block':
          if (ipAddress) {
            this.blockedIPs.add(ipAddress);
            await auditLogger.logSecurityEvent(
              userId || '',
              'ip_blocked',
              { ipAddress, reason: 'threat_detection' },
              ipAddress,
              'system',
              'high'
            );
          }
          break;

        case 'challenge':
          if (userId) {
            this.challengedUsers.add(userId);
            await auditLogger.logSecurityEvent(
              userId || '',
              'user_challenged',
              { reason: 'threat_detection' },
              ipAddress,
              'system',
              'medium'
            );
          }
          break;

        case 'alert':
          await this.sendSecurityAlert(threatEvent);
          break;

        case 'log':
        default:
          // Just log the event (already done above)
          break;
      }
    } catch (error) {
      logger.error('Threat action execution failed', {
        action,
        ipAddress,
        userId,
        error: (error as Error).message
      }, error as Error);
    }
  }

  /**
   * Execute action and return action type
   */
  private executeAction(action: string, ipAddress?: string, userId?: string): 'logged' | 'blocked' | 'challenged' | 'alerted' {
    switch (action) {
      case 'block':
        return 'blocked';
      case 'challenge':
        return 'challenged';
      case 'alert':
        return 'alerted';
      default:
        return 'logged';
    }
  }

  /**
   * Log threat event to database
   */
  private async logThreatEvent(threatEvent: ThreatEvent): Promise<void> {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: threatEvent.userId,
          action: `threat_${threatEvent.patternId}`,
          details: {
            ...threatEvent.details,
            patternId: threatEvent.patternId,
            severity: threatEvent.severity,
            action: threatEvent.action
          },
          ip_address: threatEvent.ipAddress,
          user_agent: threatEvent.userAgent,
          severity: threatEvent.severity
        });

      if (error) {
        logger.error('Failed to log threat event', { error: error.message }, error);
      }
    } catch (error) {
      logger.error('Threat event logging failed', { error: (error as Error).message }, error as Error);
    }
  }

  /**
   * Send security alert (placeholder for integration with alerting systems)
   */
  private async sendSecurityAlert(threatEvent?: ThreatEvent): Promise<void> {
    try {
      // This would integrate with your alerting system (email, Slack, etc.)
      logger.error('SECURITY ALERT', {
        patternId: threatEvent?.patternId,
        severity: threatEvent?.severity,
        userId: threatEvent?.userId,
        ipAddress: threatEvent?.ipAddress,
        details: threatEvent?.details
      });

      // Example: Send to external alerting service
      // await fetch('https://your-alerting-service.com/api/alerts', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(threatEvent)
      // });

    } catch (error) {
      logger.error('Security alert sending failed', { error: (error as Error).message }, error as Error);
    }
  }

  /**
   * Check if IP is blocked
   */
  isIPBlocked(ipAddress: string): boolean {
    return this.blockedIPs.has(ipAddress);
  }

  /**
   * Check if user is challenged
   */
  isUserChallenged(userId: string): boolean {
    return this.challengedUsers.has(userId);
  }

  /**
   * Unblock IP address
   */
  unblockIP(ipAddress: string): void {
    this.blockedIPs.delete(ipAddress);
  }

  /**
   * Remove user challenge
   */
  removeUserChallenge(userId: string): void {
    this.challengedUsers.delete(userId);
  }

  /**
   * Get threat metrics
   */
  async getThreatMetrics(): Promise<ThreatMetrics> {
    try {
      const { data: recentEvents } = await supabase
        .from('audit_logs')
        .select('*')
        .like('action', 'threat_%')
        .order('created_at', { ascending: false })
        .limit(100);

      const eventsBySeverity: Record<string, number> = {};
      const eventsByPattern: Record<string, number> = {};

      recentEvents?.forEach(event => {
        const severity = event.severity || 'medium';
        eventsBySeverity[severity] = (eventsBySeverity[severity] || 0) + 1;

        const patternId = event.action?.replace('threat_', '') || 'unknown';
        eventsByPattern[patternId] = (eventsByPattern[patternId] || 0) + 1;
      });

      return {
        totalEvents: recentEvents?.length || 0,
        eventsBySeverity,
        eventsByPattern,
        recentEvents: recentEvents?.map(event => ({
          id: event.id,
          userId: event.user_id,
          patternId: event.action?.replace('threat_', '') || 'unknown',
          severity: event.severity,
          details: event.details,
          timestamp: new Date(event.created_at),
          ipAddress: event.ip_address,
          userAgent: event.user_agent,
          action: 'logged' // Default action
        })) || [],
        blockedIPs: Array.from(this.blockedIPs),
        challengedUsers: Array.from(this.challengedUsers)
      };

    } catch (error) {
      logger.error('Failed to get threat metrics', { error: (error as Error).message }, error as Error);
      return {
        totalEvents: 0,
        eventsBySeverity: {},
        eventsByPattern: {},
        recentEvents: [],
        blockedIPs: [],
        challengedUsers: []
      };
    }
  }

  /**
   * Add custom threat pattern
   */
  addPattern(pattern: ThreatPattern): void {
    this.patterns.set(pattern.id, pattern);
  }

  /**
   * Remove threat pattern
   */
  removePattern(patternId: string): void {
    this.patterns.delete(patternId);
  }

  /**
   * Update pattern configuration
   */
  updatePattern(patternId: string, updates: Partial<ThreatPattern>): boolean {
    const pattern = this.patterns.get(patternId);
    if (pattern) {
      this.patterns.set(patternId, { ...pattern, ...updates });
      return true;
    }
    return false;
  }

  /**
   * Get all patterns
   */
  getPatterns(): ThreatPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Clear event counts (useful for testing)
   */
  clearEventCounts(): void {
    this.eventCounts.clear();
  }
}

export const threatDetection = ThreatDetection.getInstance(); 