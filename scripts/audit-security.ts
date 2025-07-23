// Security Policy/Pattern Audit Script
import { DEFAULT_SECURITY_CONFIG } from '../lib/security-config';
import { ThreatDetection } from '../lib/threat-detection';

async function auditSecurity() {
  // Log rate limiting policies
  console.log('--- Rate Limiting Policies ---');
  console.log('Max Requests Per Minute:', DEFAULT_SECURITY_CONFIG.rateLimit.maxRequests.general);
  console.log('Max Requests Per Endpoint:', DEFAULT_SECURITY_CONFIG.rateLimit.maxRequests);
  console.log('Rate Limit Window (ms):', DEFAULT_SECURITY_CONFIG.rateLimit.windowMs);

  // Log blocked user agents
  console.log('\n--- Blocked User Agents ---');
  DEFAULT_SECURITY_CONFIG.blockedUserAgents?.forEach((pattern: RegExp) => {
    console.log(pattern.toString());
  });

  // Log blocked IPs (from in-memory and threat detection)
  console.log('\n--- Blocked IPs (in-memory) ---');
  // If using a dynamic threat detection instance, log those as well
  try {
    const threatDetection = (ThreatDetection as any).instance || ThreatDetection.getInstance?.();
    if (threatDetection && threatDetection.blockedIPs) {
      console.log(Array.from(threatDetection.blockedIPs));
    } else {
      console.log('No dynamic blocked IPs loaded.');
    }
  } catch {
    console.log('ThreatDetection dynamic instance not available.');
  }

  // Log threat patterns
  console.log('\n--- Threat Patterns ---');
  try {
    const threatDetection = (ThreatDetection as any).instance || ThreatDetection.getInstance?.();
    if (threatDetection && threatDetection.patterns) {
      for (const [id, pattern] of threatDetection.patterns.entries()) {
        console.log(`Pattern: ${id}`);
        console.log(pattern);
      }
    } else {
      console.log('No dynamic threat patterns loaded.');
    }
  } catch {
    console.log('ThreatDetection dynamic instance not available.');
  }

  // Log CORS allowed origins
  console.log('\n--- CORS Allowed Origins ---');
  console.log(DEFAULT_SECURITY_CONFIG.headers?.contentSecurityPolicy || 'Not set');
  if (process.env.ALLOWED_ORIGINS) {
    console.log('ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS);
  }

  // Log OAuth providers
  console.log('\n--- OAuth Providers ---');
  console.log(DEFAULT_SECURITY_CONFIG.oauth.allowedProviders);
}

auditSecurity().then(() => {
  console.log('\n✅ Security audit complete.');
  process.exit(0);
}); 