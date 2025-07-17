import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
      { error: 'Internal server error' },
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
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, timezone, workHours, email } = body;

    // Validate input
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (timezone && !Intl.supportedValuesOf('timeZone').includes(timezone)) {
      return NextResponse.json(
        { error: 'Invalid timezone' },
        { status: 400 }
      );
    }

    // Update user profile in our database
    const profileUpdates: any = {};
    if (name !== undefined) profileUpdates.name = name;
    if (timezone !== undefined) profileUpdates.timezone = timezone;
    if (workHours !== undefined) profileUpdates.work_hours = workHours;
    if (email !== undefined) profileUpdates.email = email;

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
          { error: 'Failed to update profile' },
          { status: 500 }
        );
      }
    }

    // Update auth metadata if name is being changed
    if (name !== undefined) {
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: { 
          name: name,
          full_name: name
        }
      });

      if (authUpdateError) {
        console.warn('Auth metadata update failed:', authUpdateError);
        // Don't fail the request since profile was updated successfully
      }
    }

    // Update email in auth if provided
    if (email !== undefined && email !== user.email) {
      const { error: emailUpdateError } = await supabase.auth.updateUser({
        email: email
      });

      if (emailUpdateError) {
        return NextResponse.json(
          { error: 'Failed to update email: ' + emailUpdateError.message },
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
        email: email || user.email,
        name: name || updatedProfile?.name || user.user_metadata?.name,
        avatar: user.user_metadata?.avatar_url,
        provider: user.app_metadata?.provider
      },
      profile: updatedProfile,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 