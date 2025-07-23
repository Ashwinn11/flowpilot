import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { AuthValidator, AuthSecurity, RateLimit } from '@/lib/auth-validation';
import { generateErrorResponse } from '@/lib/api-error';

export async function POST(request: NextRequest) {
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

    // Rate limiting check
    const clientIP = AuthSecurity.getClientIP(request);
    if (RateLimit.isRateLimited(`forgot_password_${clientIP}`, 3, 15 * 60 * 1000)) { // 3 attempts per 15 minutes
      const timeUntilReset = RateLimit.getTimeUntilReset(`forgot_password_${clientIP}`, 15 * 60 * 1000);
      return NextResponse.json(
        generateErrorResponse({ userMessage: 'Too many password reset requests. Please try again later.', status: 429 }),
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email } = body;

    // Validate email
    const emailValidation = AuthValidator.validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        generateErrorResponse({ userMessage: AuthValidator.getErrorMessage(emailValidation.errors), status: 400, validationErrors: emailValidation.errors }),
        { status: 400 }
      );
    }

    // No getUserByEmail check here; always send the reset email for security

    // Send password reset email
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      emailValidation.sanitizedData!.email,
      {
        redirectTo: `${request.nextUrl.origin}/auth/callback?next=/auth/reset-password`
      }
    );

    if (resetError) {
      console.error('Password reset error:', resetError);
      return NextResponse.json(
        generateErrorResponse({ error: resetError, userMessage: 'Failed to send password reset email. Please try again.', status: 500 }),
        { status: 500 }
      );
    }

    // Clear rate limit on successful request
    RateLimit.clearRateLimit(`forgot_password_${clientIP}`);

    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, you will receive a password reset link shortly.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      generateErrorResponse({ error, userMessage: 'An unexpected error occurred while processing your request', status: 500 }),
      { status: 500 }
    );
  }
} 