import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';
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
    
    logger.debug('Session check API', { 
      hasSession: !!session, 
      sessionType: session?.user?.aud,
      error: error?.message 
    });

    if (error) {
      logger.error('Session check error', { error: error.message }, error);
      return NextResponse.json(generateErrorResponse({ error, userMessage: error.message, status: 500 }));
    }

    // For password reset, we need a valid session
    const hasValidSession = !!session && session.user?.aud === 'authenticated';

    return NextResponse.json({ 
      hasSession: hasValidSession,
      userEmail: session?.user?.email 
    });

  } catch (error) {
    logger.error('Session check unexpected error', { error: (error as Error).message }, error as Error);
    return NextResponse.json(
      generateErrorResponse({ error, userMessage: 'Failed to check session', status: 500 }),
      { status: 500 }
    );
  }
} 