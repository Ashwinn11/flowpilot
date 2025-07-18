import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { AuthValidator, AuthSecurity, RateLimit, AuthErrorMessages } from '@/lib/auth-validation';
import { securityManager } from '@/lib/security';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = AuthSecurity.getClientIP(request);
  const requestId = await securityManager.generateSecureRandom(16);
  
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

    // Enhanced rate limiting with account lockout
    const rateLimitKey = `signin_${clientIP}`;
    if (securityManager.isRateLimited(rateLimitKey, 5, 15 * 60 * 1000)) {
      logger.warn('Signin rate limited', {
        requestId,
        clientIP,
        userAgent: request.headers.get('user-agent')?.substring(0, 100)
      });
      return NextResponse.json({
        error: 'Too many signin attempts',
        message: 'Too many signin attempts. Please try again later.'
      }, { status: 429 });
    }

    // Check for account lockout
    if (securityManager.isAccountLocked(rateLimitKey)) {
      logger.warn('Account locked due to excessive login attempts', {
        requestId,
        clientIP,
        userAgent: request.headers.get('user-agent')?.substring(0, 100)
      });
      return NextResponse.json({
        error: 'Account temporarily locked',
        message: 'Account temporarily locked due to too many failed attempts. Please try again later.'
      }, { status: 429 });
    }

    const body = await request.json();
    const { email, password } = body;

    // Input validation
    const emailValidation = AuthValidator.validateEmail(email);
    if (!emailValidation.isValid) {
      securityManager.recordLoginAttempt(rateLimitKey);
      return NextResponse.json({
        error: 'Invalid email format',
        message: emailValidation.errors[0]?.message || 'Invalid email format'
      }, { status: 400 });
    }

    const passwordValidation = AuthValidator.validatePassword(password);
    if (!passwordValidation.isValid) {
      securityManager.recordLoginAttempt(rateLimitKey);
      return NextResponse.json({
        error: 'Invalid password format',
        message: passwordValidation.errors[0]?.message || 'Invalid password format'
      }, { status: 400 });
    }

    // Attempt signin
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailValidation.sanitizedData?.email,
      password: passwordValidation.sanitizedData?.password,
    });

    if (error) {
      securityManager.recordLoginAttempt(rateLimitKey);
      
      logger.warn('Signin failed', {
        requestId,
        clientIP,
        email: emailValidation.sanitizedData?.email,
        error: error.message,
        userAgent: request.headers.get('user-agent')?.substring(0, 100)
      });

      return NextResponse.json({
        error: 'Authentication failed',
        message: AuthErrorMessages.INVALID_CREDENTIALS
      }, { status: 401 });
    }

    // Successful signin - clear rate limiting
    securityManager.clearRateLimit(rateLimitKey);

    logger.info('Signin successful', {
      requestId,
      clientIP,
      userEmail: data.user?.email,
      duration: Date.now() - startTime,
      userAgent: request.headers.get('user-agent')?.substring(0, 100)
    });

    return NextResponse.json({
      success: true,
      message: AuthErrorMessages.SIGNIN_SUCCESS,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        emailVerified: data.user?.email_confirmed_at
      }
    });

  } catch (error) {
    logger.error('Signin unexpected error', {
      requestId,
      clientIP,
      error: (error as Error).message,
      stack: (error as Error).stack,
      userAgent: request.headers.get('user-agent')?.substring(0, 100)
    });

    return NextResponse.json({
      error: 'An unexpected error occurred',
      message: 'An unexpected error occurred during signin. Please try again.'
    }, { status: 500 });
  }
} 