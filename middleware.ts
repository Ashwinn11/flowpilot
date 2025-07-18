import { NextRequest, NextResponse } from 'next/server';
import { securityManager } from '@/lib/security';
import { logger } from '@/lib/logger';

// Security configuration
const SECURITY_CONFIG = {
  // Rate limiting
  maxRequestsPerMinute: 100,
  maxRequestsPerHour: 1000,
  
  // Blocked user agents
  blockedUserAgents: [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /perl/i,
    /ruby/i
  ],
  
  // Blocked IPs (example - should be loaded from environment or database)
  blockedIPs: new Set<string>(),
  
  // Allowed origins for CORS
  allowedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://yourdomain.com' // Replace with your domain
  ]
};

// Rate limiting storage
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const requestId = await securityManager.generateSecureRandom(16);
  const path = request.nextUrl.pathname;

  // Log request start
  logger.info('Request started', {
    method: request.method,
    path,
    clientIP,
    userAgent: userAgent.substring(0, 100),
    requestId
  });

  // 1. Block malicious user agents
  if (SECURITY_CONFIG.blockedUserAgents.some(pattern => pattern.test(userAgent))) {
    logger.warn('Blocked malicious user agent', {
      requestId,
      clientIP,
      userAgent: userAgent.substring(0, 100)
    });
    return new NextResponse('Forbidden', { status: 403 });
  }

  // 2. Block known malicious IPs
  if (SECURITY_CONFIG.blockedIPs.has(clientIP)) {
    logger.warn('Blocked malicious IP', { requestId, clientIP });
    return new NextResponse('Forbidden', { status: 403 });
  }

  // 3. Rate limiting
  const rateLimitKey = `${clientIP}:${path}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  
  const rateLimit = rateLimitStore.get(rateLimitKey);
  if (rateLimit) {
    if (now > rateLimit.resetTime) {
      // Reset window
      rateLimit.count = 1;
      rateLimit.resetTime = now + windowMs;
    } else if (rateLimit.count >= SECURITY_CONFIG.maxRequestsPerMinute) {
      logger.warn('Rate limit exceeded', {
        requestId,
        clientIP,
        path,
        userAgent: userAgent.substring(0, 100)
      });
      return new NextResponse('Too Many Requests', { status: 429 });
    } else {
      rateLimit.count++;
    }
  } else {
    rateLimitStore.set(rateLimitKey, { count: 1, resetTime: now + windowMs });
  }

  // 4. CORS handling for API routes
  if (path.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    if (origin && !SECURITY_CONFIG.allowedOrigins.includes(origin)) {
      logger.warn('CORS violation', {
        requestId,
        clientIP,
        origin,
        userAgent: userAgent.substring(0, 100)
      });
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  // 5. Security headers
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()');
  
  // Add HSTS for HTTPS
  if (request.nextUrl.protocol === 'https:') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // 6. Log request completion
  logger.info('Request completed', {
    method: request.method,
    path,
    statusCode: response.status,
    duration: Date.now() - startTime,
    requestId,
    clientIP,
    userAgent: userAgent.substring(0, 100)
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 