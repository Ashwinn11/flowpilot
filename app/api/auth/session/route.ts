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
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    // Check for session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    console.log('Session check API:', { 
      hasSession: !!session, 
      userEmail: session?.user?.email,
      sessionType: session?.user?.aud,
      error: error?.message 
    });

    if (error) {
      console.error('Session check error:', error);
      return NextResponse.json({ hasSession: false, error: error.message });
    }

    // For password reset, we need a valid session
    const hasValidSession = !!session && session.user?.aud === 'authenticated';

    return NextResponse.json({ 
      hasSession: hasValidSession,
      userEmail: session?.user?.email 
    });

  } catch (error) {
    console.error('Session check unexpected error:', error);
    return NextResponse.json(
      { hasSession: false, error: 'Failed to check session' },
      { status: 500 }
    );
  }
} 