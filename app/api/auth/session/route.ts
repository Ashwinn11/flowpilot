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
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'No valid session found',
          user: null,
          expiresAt: null
        },
        { status: 401 }
      );
    }

    // Get user profile for additional context
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    // Calculate session health
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    const timeUntilExpiry = Math.max(0, expiresAt - now);
    const isExpiringSoon = timeUntilExpiry < 600; // Less than 10 minutes

    return NextResponse.json({
      valid: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: profile?.name || session.user.user_metadata?.name || session.user.user_metadata?.full_name,
        avatar: session.user.user_metadata?.avatar_url,
        provider: session.user.app_metadata?.provider
      },
      session: {
        expiresAt: expiresAt * 1000, // Convert to milliseconds
        timeUntilExpiry: timeUntilExpiry * 1000, // Convert to milliseconds
        isExpiringSoon,
        lastRefreshAt: session.refresh_token ? now * 1000 : null
      },
      profile: profileError ? null : profile,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { 
        valid: false, 
        error: 'Internal server error during session validation',
        user: null,
        expiresAt: null 
      },
      { status: 500 }
    );
  }
} 