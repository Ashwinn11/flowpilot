import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { auditLogger } from '@/lib/audit-logger';

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
    
    // Get current session to validate logout
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.warn('Session check error during logout:', sessionError);
    }

    // Perform logout
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.error('Logout error:', signOutError);
      return NextResponse.json(
        { 
          success: false, 
          error: signOutError.message || 'Failed to logout',
          message: 'Logout failed. Please try again.'
        },
        { status: 500 }
      );
    }

    // Log successful logout
    if (session?.user?.id) {
      await auditLogger.logLogout(
        session.user.id,
        { action: 'logout' },
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      );
    }

    // Create response to clear cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
      timestamp: Date.now()
    });

    // Clear auth-related cookies
    const cookieNames = [
      'sb-access-token',
      'sb-refresh-token', 
      'supabase-auth-token',
      'supabase.auth.token'
    ];

    cookieNames.forEach(cookieName => {
      response.cookies.delete(cookieName);
    });

    // Set cache headers to prevent caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error during logout',
        message: 'An unexpected error occurred. Please try again.'
      },
      { status: 500 }
    );
  }
} 