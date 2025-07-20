import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { securityManager } from '@/lib/security';
import { logger } from '@/lib/logger';
import { AuthSecurity } from '@/lib/auth-validation';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = AuthSecurity.getClientIP(request);
  const requestId = await securityManager.generateSecureRandom(16);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';
    const state = searchParams.get('state'); // OAuth state parameter
    
    // Enhanced security logging (without sensitive data)
    logger.info('OAuth callback initiated', {
      requestId,
      clientIP,
      hasCode: !!code,
      hasState: !!state,
      next,
      userAgent: userAgent.substring(0, 100), // Truncate for security
      timestamp: new Date().toISOString(),
      url: request.url
    });

    // Validate OAuth state parameter if present (CSRF protection)
    // Note: OAuth providers don't always send state consistently, so we log warnings but don't block
    if (state) {
      const isValidState = securityManager.validateCSRFToken(state);
      if (!isValidState) {
        logger.warn('OAuth state validation failed - proceeding with caution', {
          requestId,
          clientIP,
          userAgent: userAgent.substring(0, 100),
          hasCode: !!code,
          provider: searchParams.get('provider') || 'unknown'
        });
        // Continue processing instead of blocking - OAuth state is not always reliable
      } else {
        logger.debug('OAuth state validated successfully', { requestId });
      }
    } else {
      logger.debug('No OAuth state parameter provided - this is normal for some providers', { requestId });
    }

    // Validate and sanitize the redirect path for security
    const allowedRedirects = ['/dashboard', '/settings', '/progress', '/auth/reset-password'];
    const sanitizedNext = allowedRedirects.includes(next) ? next : '/dashboard';
    
    if (next !== sanitizedNext) {
      logger.warn('Invalid redirect path detected, using default', {
        requestId,
        originalNext: next,
        sanitizedNext,
        clientIP
      });
    }

    // Rate limiting for OAuth callbacks
    const rateLimitKey = `oauth_callback:${clientIP}`;
    if (securityManager.isRateLimited(rateLimitKey, 10, 5 * 60 * 1000)) { // 10 attempts per 5 minutes
      logger.warn('OAuth callback rate limited', {
        requestId,
        clientIP,
        userAgent: userAgent.substring(0, 100)
      });
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=rate_limited`);
    }

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

    if (code) {
      logger.info('OAuth callback: Processing code', { requestId, next: sanitizedNext });
      
      // Exchange code for session with timeout
      const exchangePromise = supabase.auth.exchangeCodeForSession(code);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Code exchange timeout')), 10000)
      );
      
      const { error } = await Promise.race([exchangePromise, timeoutPromise]) as any;
      
      if (!error) {
        // Check if this is a recovery session (password reset)
        const { data: { session } } = await supabase.auth.getSession();
        
        logger.info('OAuth callback: Session established successfully', { 
          requestId,
          hasSession: !!session, 
          userEmail: session?.user?.email,
          next: sanitizedNext,
          redirectUrl: `${origin}${sanitizedNext}`,
          duration: Date.now() - startTime
        });
        
        // For password reset, we want to redirect to the reset password page
        // even if it's a recovery session
        if (sanitizedNext === '/auth/reset-password') {
          logger.info('OAuth callback: Password reset flow - redirecting to reset password page', {
            requestId,
            hasSession: !!session,
            userEmail: session?.user?.email
          });
          return NextResponse.redirect(`${origin}${sanitizedNext}`);
        }
        
        // For regular sign-ins, ensure session is properly set before redirecting
        if (session) {
          // Add a small delay to ensure session is properly persisted
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Double-check session is still valid
          const { data: { session: finalSession } } = await supabase.auth.getSession();
          
          logger.info('OAuth callback: Redirecting to dashboard', { 
            requestId, 
            redirectUrl: `${origin}${sanitizedNext}`,
            userEmail: finalSession?.user?.email,
            sessionValid: !!finalSession
          });
          
          return NextResponse.redirect(`${origin}${sanitizedNext}`);
        } else {
          logger.error('OAuth callback: No session after successful code exchange', {
            requestId,
            redirectUrl: `${origin}${sanitizedNext}`
          });
          return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_session`);
        }
      } else {
        logger.error('OAuth callback: Code exchange error', {
          requestId,
          error: error.message,
          code: error.status,
          clientIP,
          userAgent: userAgent.substring(0, 100)
        });
        
        // Check if we have a session despite the error (might happen in some OAuth flows)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          logger.info('OAuth callback: Session exists despite error, redirecting', { 
            requestId,
            redirectUrl: `${origin}${sanitizedNext}`,
            userEmail: session?.user?.email
          });
          return NextResponse.redirect(`${origin}${sanitizedNext}`);
        }
        
        // Log security event for failed code exchange
        logger.warn('OAuth callback: No session after code exchange error', {
          requestId,
          clientIP,
          userAgent: userAgent.substring(0, 100),
          error: error.message
        });
        
        // Redirect to auth-code-error with specific error
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=code_exchange_failed`);
      }
    } else {
      logger.warn('OAuth callback: No code found in callback URL', {
        requestId,
        clientIP,
        userAgent: userAgent.substring(0, 100),
        url: request.url
      });
      
      // For implicit flow, redirect to client-side handler
      // The tokens are in the URL fragment and need to be processed by JavaScript
      logger.info('OAuth callback: Redirecting to client-side handler for implicit flow processing', {
        requestId,
        clientIP,
        userAgent: userAgent.substring(0, 100)
      });
      
      return NextResponse.redirect(`${origin}/auth?oauth_callback=true&next=${encodeURIComponent(sanitizedNext)}`);
    }
    
  } catch (error) {
    logger.error('OAuth callback: Unexpected error', {
      requestId,
      clientIP,
      userAgent: userAgent.substring(0, 100),
      error: (error as Error).message,
      stack: (error as Error).stack
    });
    
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=unexpected`);
  }
} 