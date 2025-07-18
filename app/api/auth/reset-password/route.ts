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
    if (RateLimit.isRateLimited(`reset_password_${clientIP}`, 3, 15 * 60 * 1000)) { // 3 attempts per 15 minutes
      const timeUntilReset = RateLimit.getTimeUntilReset(`reset_password_${clientIP}`, 15 * 60 * 1000);
      return NextResponse.json(
        { 
          error: 'Too many password reset attempts. Please try again later.',
          retryAfter: Math.ceil(timeUntilReset / 1000)
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { password, confirmPassword } = body;

    // Validate password
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

    // Validate password confirmation
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Get current user (this will work if they have a valid reset session)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    console.log('Reset password API: User check', { 
      hasUser: !!user, 
      userEmail: user?.email, 
      userId: user?.id,
      error: userError?.message,
      errorCode: userError?.status 
    });
    
    // Also check the session to see what type it is
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Reset password API: Session check', { 
      hasSession: !!session, 
      sessionType: session?.user?.aud,
      sessionUserId: session?.user?.id,
      sessionError: sessionError?.message 
    });
    
    if (userError) {
      console.error('Reset password: User error details', {
        message: userError.message,
        status: userError.status,
        name: userError.name,
        code: userError.status
      });
      
      // If it's a user_not_found error, the JWT token is invalid
      if (userError.status === 403 || userError.message.includes('User from sub claim in JWT does not exist')) {
        return NextResponse.json(
          { error: 'Invalid or expired reset link. Please request a new password reset.' },
          { status: 401 }
        );
      }
    }
    
    if (!user) {
      console.error('Reset password: No user found in session');
      return NextResponse.json(
        { error: 'Invalid or expired reset link. Please request a new password reset.' },
        { status: 401 }
      );
    }

    // For password reset, we need to check if this is a recovery session
    // Recovery sessions have aud: 'authenticated' but might not have email_confirmed_at
    if (session?.user?.aud !== 'authenticated') {
      console.error('Reset password: Invalid session type', session?.user?.aud);
      return NextResponse.json(
        { error: 'Invalid or expired reset link. Please request a new password reset.' },
        { status: 401 }
      );
    }

    // Update password
    console.log('Reset password API: Attempting password update for user:', user.email);
    const { error: updateError } = await supabase.auth.updateUser({
      password: passwordValidation.sanitizedData!.password
    });

    if (updateError) {
      console.error('Password update error:', updateError);
      console.error('Password update error details:', {
        message: updateError.message,
        status: updateError.status,
        name: updateError.name
      });
      
      if (updateError.message.includes('Password should be at least')) {
        return NextResponse.json(
          { error: 'Password does not meet security requirements. Please choose a stronger password.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        AuthSecurity.generateSecureErrorResponse(updateError, 'Failed to update password. Please try again.'),
        { status: 400 }
      );
    }

    // Clear rate limit on successful password reset
    RateLimit.clearRateLimit(`reset_password_${clientIP}`);

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully! You can now sign in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      AuthSecurity.generateSecureErrorResponse(error, 'An unexpected error occurred while resetting your password'),
      { status: 500 }
    );
  }
} 