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
    
    // Security logging (without sensitive data)
    logger.info('OAuth callback initiated', {
      requestId,
      clientIP,
      hasCode: !!code,
      hasState: !!state,
      next,
      userAgent: userAgent.substring(0, 100), // Truncate for security
      timestamp: new Date().toISOString()
    });

    // Validate OAuth state parameter if present (CSRF protection)
    if (state) {
      const isValidState = securityManager.validateCSRFToken(state);
      if (!isValidState) {
        logger.warn('Invalid OAuth state parameter detected', {
          requestId,
          clientIP,
          userAgent: userAgent.substring(0, 100)
        });
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=invalid_state`);
      }
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

    // Check for existing session first (but only if we have a code to process)
    // For password reset, we want to process the code even if there's an existing session
    if (code && next !== '/auth/reset-password') {
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession) {
        logger.info('OAuth callback: Existing session found, redirecting', {
          requestId,
          userEmail: existingSession.user?.email,
          next
        });
        return NextResponse.redirect(`${origin}${next}`);
      }
    }

    if (code) {
      logger.info('OAuth callback: Processing code', { requestId, next });
      
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
          next,
          duration: Date.now() - startTime
        });
        
        // For password reset, we want to redirect to the reset password page
        // even if it's a recovery session
        if (next === '/auth/reset-password') {
          logger.info('OAuth callback: Password reset flow - redirecting to reset password page', {
            requestId,
            hasSession: !!session,
            userEmail: session?.user?.email
          });
          return NextResponse.redirect(`${origin}${next}`);
        }
        
        // For regular sign-ins, redirect to the intended destination
        logger.info('OAuth callback: Redirecting to dashboard', { requestId });
        return NextResponse.redirect(`${origin}${next}`);
      } else {
        logger.error('OAuth callback: Code exchange error', {
          requestId,
          error: error.message,
          code: error.status,
          clientIP,
          userAgent: userAgent.substring(0, 100)
        });
        
        // If the session is already set, allow redirect anyway
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          logger.info('OAuth callback: Session exists despite error, redirecting', { requestId });
          return NextResponse.redirect(`${origin}${next}`);
        }
        
        // Log security event for failed code exchange
        logger.warn('OAuth callback: No session after code exchange error', {
          requestId,
          clientIP,
          userAgent: userAgent.substring(0, 100),
          error: error.message
        });
      }
    } else {
      logger.warn('OAuth callback: No code found in callback URL', {
        requestId,
        clientIP,
        userAgent: userAgent.substring(0, 100),
        url: request.url
      });
      
      // Check if we have a session even without a code (might happen in some OAuth flows)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        logger.info('OAuth callback: Session found without code, redirecting', { requestId });
        return NextResponse.redirect(`${origin}${next}`);
      }
    }

    logger.error('OAuth callback: Redirecting to auth-code-error page', {
      requestId,
      clientIP,
      userAgent: userAgent.substring(0, 100)
    });
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    
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