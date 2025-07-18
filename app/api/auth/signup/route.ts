import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { AuthValidator, AuthSecurity, RateLimit } from '@/lib/auth-validation';

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
    if (RateLimit.isRateLimited(`signup_${clientIP}`, 3, 15 * 60 * 1000)) { // 3 attempts per 15 minutes
      const timeUntilReset = RateLimit.getTimeUntilReset(`signup_${clientIP}`, 15 * 60 * 1000);
      return NextResponse.json(
        { 
          error: 'Too many signup attempts. Please try again later.',
          retryAfter: Math.ceil(timeUntilReset / 1000)
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password, name, timezone, workHours } = body;

    // Validate email
    const emailValidation = AuthValidator.validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { 
          error: AuthValidator.getErrorMessage(emailValidation.errors),
          validationErrors: emailValidation.errors
        },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = AuthValidator.validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: AuthValidator.getErrorMessage(passwordValidation.errors),
          validationErrors: passwordValidation.errors
        },
        { status: 400 }
      );
    }

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: 'Name is too long (max 100 characters)' },
        { status: 400 }
      );
    }

    // No getUserByEmail check here; let Supabase handle duplicate email errors

    // Create user with email confirmation
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email: emailValidation.sanitizedData!.email,
      password: passwordValidation.sanitizedData!.password,
      options: {
        data: {
          name: AuthValidator.sanitizeInput(name),
          full_name: AuthValidator.sanitizeInput(name)
        },
        emailRedirectTo: `${request.nextUrl.origin}/auth/callback?next=/dashboard`
      }
    });

    if (signUpError) {
      console.error('Signup error:', signUpError);
      
      // Handle specific Supabase errors
      if (signUpError.message.includes('Email not confirmed')) {
        return NextResponse.json(
          { error: 'Please check your email and click the verification link to complete your signup.' },
          { status: 400 }
        );
      }
      
      if (signUpError.message.includes('Password should be at least')) {
        return NextResponse.json(
          { error: 'Password does not meet security requirements. Please choose a stronger password.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        AuthSecurity.generateSecureErrorResponse(signUpError, 'Failed to create account. Please try again.'),
        { status: 400 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Note: Profile creation will be handled by the auth context when the user signs in
    // This avoids RLS policy issues during the signup process
    // The profile will be created automatically when the user first signs in

    // Clear rate limit on successful signup
    RateLimit.clearRateLimit(`signup_${clientIP}`);

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        emailVerified: false
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      AuthSecurity.generateSecureErrorResponse(error, 'An unexpected error occurred during signup'),
      { status: 500 }
    );
  }
} 