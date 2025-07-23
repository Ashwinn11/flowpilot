import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { auditLogger } from '@/lib/audit-logger';
import { AuthValidator, AuthSecurity, RateLimit, AuthErrorMessages } from '@/lib/auth-validation';
import { securityManager } from '@/lib/security';
import { logger } from '@/lib/logger';
import { threatDetection } from '@/lib/threat-detection';
import { generateErrorResponse } from '@/lib/api-error';

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
      return NextResponse.json(
        generateErrorResponse({ userMessage: 'Too many signin attempts. Please try again later.', status: 429 }),
        { status: 429 }
      );
    }

    // Check for account lockout
    if (securityManager.isAccountLocked(rateLimitKey)) {
      logger.warn('Account locked due to excessive login attempts', {
        requestId,
        clientIP,
        userAgent: request.headers.get('user-agent')?.substring(0, 100)
      });
      return NextResponse.json(
        generateErrorResponse({ userMessage: 'Account temporarily locked due to too many failed attempts. Please try again later.', status: 429 }),
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    // Input validation
    const emailValidation = AuthValidator.validateEmail(email);
    if (!emailValidation.isValid) {
      securityManager.recordLoginAttempt(rateLimitKey);
      return NextResponse.json(
        generateErrorResponse({ userMessage: emailValidation.errors[0]?.message || 'Invalid email format', status: 400 }),
        { status: 400 }
      );
    }

    const passwordValidation = AuthValidator.validatePassword(password);
    if (!passwordValidation.isValid) {
      securityManager.recordLoginAttempt(rateLimitKey);
      return NextResponse.json(
        generateErrorResponse({ userMessage: passwordValidation.errors[0]?.message || 'Invalid password format', status: 400 }),
        { status: 400 }
      );
    }

    // Attempt signin
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailValidation.sanitizedData?.email,
      password: passwordValidation.sanitizedData?.password,
    });

    if (error) {
      securityManager.recordLoginAttempt(rateLimitKey);
      
      // Check for threat patterns
      const threatResult = await threatDetection.checkThreat(
        'brute_force_login',
        '', // No userId for failed login
        { email: emailValidation.sanitizedData?.email, error: error.message },
        clientIP,
        request.headers.get('user-agent') || 'unknown'
      );

      // Check for suspicious user agent
      const userAgent = request.headers.get('user-agent') || '';
      if (!userAgent || userAgent.length < 10 || userAgent.includes('bot')) {
        await threatDetection.checkThreat(
          'suspicious_user_agent',
          '',
          { userAgent },
          clientIP,
          userAgent
        );
      }
      
      // Log failed login attempt
      await auditLogger.logLogin(
        '', // No userId for failed login
        false,
        { 
          email: emailValidation.sanitizedData?.email, 
          error: error.message,
          requestId,
          threatDetected: threatResult.threat
        },
        clientIP,
        request.headers.get('user-agent') || 'unknown'
      );
      
      logger.warn('Signin failed', {
        requestId,
        clientIP,
        email: emailValidation.sanitizedData?.email,
        error: error.message,
        userAgent: request.headers.get('user-agent')?.substring(0, 100),
        threatDetected: threatResult.threat
      });

      // If threat detected and action is block, return blocked response
      if (threatResult.threat && threatResult.action === 'block') {
        return NextResponse.json(
          generateErrorResponse({ userMessage: 'Too many failed attempts. Please try again later.', status: 429 }),
          { status: 429 }
        );
      }

      return NextResponse.json(
        generateErrorResponse({ userMessage: AuthErrorMessages.INVALID_CREDENTIALS, status: 401 }),
        { status: 401 }
      );
    }

    // Successful signin - clear rate limiting
    securityManager.clearRateLimit(rateLimitKey);

    // Log successful login
    await auditLogger.logLogin(
      data.user?.id,
      true,
      { 
        email: data.user?.email,
        requestId,
        duration: Date.now() - startTime
      },
      clientIP,
      request.headers.get('user-agent') || 'unknown'
    );

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

    return NextResponse.json(
      generateErrorResponse({ userMessage: 'An unexpected error occurred during signin. Please try again.', status: 500 }),
      { status: 500 }
    );
  }
} 