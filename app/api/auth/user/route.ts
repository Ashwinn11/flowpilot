import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { AuthValidator, AuthSecurity, RateLimit } from '@/lib/auth-validation';
import { generateErrorResponse } from '@/lib/api-error';

export async function GET(request: NextRequest) {
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
        },
      }
    );
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: profile?.name || user.user_metadata?.name || user.user_metadata?.full_name,
        avatar: user.user_metadata?.avatar_url,
        provider: user.app_metadata?.provider,
        emailVerified: user.email_confirmed_at ? true : false,
        createdAt: user.created_at
      },
      profile: profileError ? null : profile
    });

  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      generateErrorResponse({ userMessage: 'Internal server error', status: 500 }),
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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
        },
      }
    );
    
    // Rate limiting check
    const clientIP = AuthSecurity.getClientIP(request);
    if (RateLimit.isRateLimited(`profile_update_${clientIP}`, 10, 60 * 1000)) { // 10 requests per minute
      const timeUntilReset = RateLimit.getTimeUntilReset(`profile_update_${clientIP}`, 60 * 1000);
      return NextResponse.json(
        { 
          error: 'Too many profile update requests. Please try again later.',
          retryAfter: Math.ceil(timeUntilReset / 1000)
        },
        { status: 429 }
      );
    }
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        generateErrorResponse({ error: userError, userMessage: 'Not authenticated', status: 401 }),
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Enhanced validation using AuthValidator
    const validation = AuthValidator.validateProfileUpdate(body);
    if (!validation.isValid) {
      return NextResponse.json(
        generateErrorResponse({ userMessage: AuthValidator.getErrorMessage(validation.errors), status: 400, validationErrors: validation.errors }),
        { status: 400 }
      );
    }

    const sanitizedData = validation.sanitizedData!;

    // Update user profile in our database using sanitized data
    const profileUpdates: any = {};
    if (sanitizedData.name !== undefined) profileUpdates.name = sanitizedData.name;
    if (sanitizedData.timezone !== undefined) profileUpdates.timezone = sanitizedData.timezone;
    if (sanitizedData.workHours !== undefined) profileUpdates.work_hours = sanitizedData.workHours;
    if (sanitizedData.email !== undefined) profileUpdates.email = sanitizedData.email;

    if (Object.keys(profileUpdates).length > 0) {
      profileUpdates.updated_at = new Date().toISOString();
      
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .update(profileUpdates)
        .eq('id', user.id)
        .select()
        .single();

      if (profileError) {
        console.error('Profile update error:', profileError);
        return NextResponse.json(
          generateErrorResponse({ userMessage: 'Failed to update profile', status: 500 }),
          { status: 500 }
        );
      }
    }

    // Update auth metadata if name is being changed
    if (sanitizedData.name !== undefined) {
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: { 
          name: sanitizedData.name,
          full_name: sanitizedData.name
        }
      });

      if (authUpdateError) {
        console.warn('Auth metadata update failed:', authUpdateError);
        // Don't fail the request since profile was updated successfully
      }
    }

    // Update email in auth if provided
    if (sanitizedData.email !== undefined && sanitizedData.email !== user.email) {
      const { error: emailUpdateError } = await supabase.auth.updateUser({
        email: sanitizedData.email
      });

      if (emailUpdateError) {
        return NextResponse.json(
          generateErrorResponse({ error: emailUpdateError, userMessage: 'Failed to update email. Please check your input and try again.', status: 400 }),
          { status: 400 }
        );
      }
    }

    // Return updated user data
    const { data: updatedProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: sanitizedData.email || user.email,
        name: sanitizedData.name || updatedProfile?.name || user.user_metadata?.name,
        avatar: user.user_metadata?.avatar_url,
        provider: user.app_metadata?.provider
      },
      profile: updatedProfile,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    return NextResponse.json(
      generateErrorResponse({ error, userMessage: 'An unexpected error occurred while updating your profile', status: 500 }),
      { status: 500 }
    );
  }
} 