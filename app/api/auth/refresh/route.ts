import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
        },
      }
    );
    
    // Get current session first to check if refresh is needed
    const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !currentSession) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No active session to refresh',
          requiresLogin: true
        },
        { status: 401 }
      );
    }

    // Check if session is actually expiring soon (within 15 minutes)
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = currentSession.expires_at || 0;
    const timeUntilExpiry = expiresAt - now;
    
    // If session has more than 15 minutes left, return current session info
    if (timeUntilExpiry > 900) {
      return NextResponse.json({
        success: true,
        refreshed: false,
        message: 'Session is still valid, no refresh needed',
        session: {
          expiresAt: expiresAt * 1000,
          timeUntilExpiry: timeUntilExpiry * 1000,
          isExpiringSoon: timeUntilExpiry < 600
        }
      });
    }

    // Perform token refresh
    const { data, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError || !data.session) {
      console.error('Token refresh failed:', refreshError);
      return NextResponse.json(
        { 
          success: false, 
          error: refreshError?.message || 'Failed to refresh session',
          requiresLogin: true
        },
        { status: 401 }
      );
    }

    const newExpiresAt = data.session.expires_at || 0;
    const newTimeUntilExpiry = newExpiresAt - now;

    return NextResponse.json({
      success: true,
      refreshed: true,
      message: 'Session refreshed successfully',
      session: {
        expiresAt: newExpiresAt * 1000,
        timeUntilExpiry: newTimeUntilExpiry * 1000,
        isExpiringSoon: newTimeUntilExpiry < 600,
        refreshedAt: Date.now()
      },
      user: {
        id: data.session.user.id,
        email: data.session.user.email,
        name: data.session.user.user_metadata?.name || data.session.user.user_metadata?.full_name
      }
    });

  } catch (error) {
    console.error('Session refresh error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error during session refresh',
        requiresLogin: false
      },
      { status: 500 }
    );
  }
} 