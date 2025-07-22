import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Get the Authorization header with the session token
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized - No session token provided' },
        { status: 401 }
      );
    }

    // Create Supabase client and verify the session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid session' },
        { status: 401 }
      );
    }

    // Get the user's calendar integration
    const { data: integration, error: fetchError } = await supabaseAdmin
      .from('calendar_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (fetchError || !integration) {
      return NextResponse.json(
        { error: 'Calendar integration not found' },
        { status: 404 }
      );
    }

    if (!integration.refresh_token) {
      return NextResponse.json(
        { error: 'No refresh token available' },
        { status: 400 }
      );
    }

    // Refresh the token with Google
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      logger.error('Failed to refresh calendar token', { 
        status: tokenResponse.status,
        error: errorData 
      });
      return NextResponse.json(
        { error: 'Failed to refresh token' },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();

    // Calculate new expiration time
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in || 3600));

    // Update the integration in the database
    const { error: updateError } = await supabaseAdmin
      .from('calendar_tokens')
      .update({
        access_token: tokenData.access_token,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('provider', 'google');

    if (updateError) {
      logger.error('Failed to update refreshed calendar token', { error: updateError.message });
      return NextResponse.json(
        { error: 'Failed to update token' },
        { status: 500 }
      );
    }

    logger.info('Calendar token refreshed successfully', { userId: user.id });

    // Return the updated integration data
    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        user_id: integration.user_id,
        provider: integration.provider,
        access_token: tokenData.access_token,
        refresh_token: integration.refresh_token,
        expires_at: expiresAt.toISOString(),
        created_at: integration.created_at,
        updated_at: new Date().toISOString(),
      }
    });

  } catch (error: any) {
    logger.error('Unexpected error in calendar token refresh', { error: error.message });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 