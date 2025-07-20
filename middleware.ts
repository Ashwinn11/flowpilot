import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { securityManager } from '@/lib/security';
import { logger } from '@/lib/logger';

// Security configuration
const SECURITY_CONFIG = {
  // Rate limiting
  maxRequestsPerMinute: 100,
  maxRequestsPerHour: 1000,
  
  // Protected routes requiring authentication
  protectedRoutes: [
    '/dashboard',
    '/settings', 
    '/progress',
    '/upgrade',
    '/test-profile',
    '/api/tasks',
    '/api/user',
    '/api/auth/user',
    '/api/auth/refresh',
    '/api/auth/logout',
    '/api/auth/mfa'
  ],
  
  // Public routes that don't require auth
  publicRoutes: [
    '/',
    '/auth',
    '/signup',
    '/forgot-password',
    '/api/auth/signin',
    '/api/auth/signup',
    '/api/auth/session',
    '/api/auth/check-email',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/callback',
    '/auth/callback',
    '/auth/verify-email',
    '/auth/reset-password',
    '/auth/auth-code-error'
  ],
  
  // Blocked user agents (more specific to avoid blocking legitimate tools)
  blockedUserAgents: [
    /scrapy/i,
    /spider/i,
    /crawl/i,
    /bot.*scan/i,
    /malicious/i,
    /attack/i,
    // Remove overly broad patterns like /curl/, /python/, etc.
  ],
  
  // Blocked IPs (example - should be loaded from environment or database)
  blockedIPs: new Set<string>(),
  
  // Allowed origins for CORS (more flexible for development)
  allowedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://yourdomain.com' // Replace with your domain
  ]
};

// Rate limiting storage
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Helper function to validate session server-side
async function validateServerSession(request: NextRequest): Promise<boolean> {
  try {
    // Get cookies from the request
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return false;

    // Parse cookies manually for middleware
    const cookies = new Map();
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies.set(name, decodeURIComponent(value));
      }
    });

    const supabaseClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookies.get(name);
          },
          set() {
            // No-op in middleware
          },
          remove() {
            // No-op in middleware
          },
        },
      }
    );

    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (error || !session) return false;
    
    // Validate session is authenticated and not expired
    return session.user?.aud === 'authenticated' && 
           session.expires_at && 
           session.expires_at > Math.floor(Date.now() / 1000);
           
  } catch (error) {
    logger.error('Session validation error in middleware', { error: (error as Error).message });
    return false;
  }
}

// Helper function to check if route is protected
function isProtectedRoute(path: string): boolean {
  return SECURITY_CONFIG.protectedRoutes.some(route => path.startsWith(route));
}

// Helper function to check if route is public
function isPublicRoute(path: string): boolean {
  return SECURITY_CONFIG.publicRoutes.some(route => 
    path === route || path.startsWith(route)
  );
}

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
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

  // 1. Block malicious user agents (more targeted blocking)
  const isMaliciousAgent = SECURITY_CONFIG.blockedUserAgents.some(pattern => pattern.test(userAgent));
  if (isMaliciousAgent) {
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

  // 4. CORS handling for API routes (more flexible)
  if (path.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const isLocalhost = origin?.includes('localhost') || origin?.includes('127.0.0.1');
    
    if (origin && !SECURITY_CONFIG.allowedOrigins.includes(origin) && !isLocalhost) {
      logger.warn('CORS violation', {
        requestId,
        clientIP,
        origin,
        userAgent: userAgent.substring(0, 100)
      });
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  // 5. **NEW: Authentication check for protected routes**
  if (isProtectedRoute(path) && !isPublicRoute(path)) {
    const hasValidSession = await validateServerSession(request);
    
    if (!hasValidSession) {
      logger.warn('Unauthorized access attempt to protected route', {
        requestId,
        clientIP,
        path,
        userAgent: userAgent.substring(0, 100)
      });
      
      // For API routes, return 401
      if (path.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // For page routes, redirect to auth
      const url = request.nextUrl.clone();
      url.pathname = '/auth';
      url.searchParams.set('next', path);
      return NextResponse.redirect(url);
    }
  }

  // 6. Security headers
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

  // Add CORS headers for API routes
  if (path.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const isLocalhost = origin?.includes('localhost') || origin?.includes('127.0.0.1');
    
    if (origin && (SECURITY_CONFIG.allowedOrigins.includes(origin) || isLocalhost)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
  }

  // 7. Log request completion
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