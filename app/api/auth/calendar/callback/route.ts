import { NextRequest, NextResponse } from 'next/server';
import { CalendarService } from '@/lib/calendar';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This should be the user ID
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      logger.error('Calendar OAuth error', { error });
      return NextResponse.redirect(
        new URL(`/dashboard?calendar_error=${encodeURIComponent(error)}`, request.url)
      );
    }

    // Validate required parameters
    if (!code || !state) {
      logger.error('Missing required OAuth parameters', { code: !!code, state: !!state });
      return NextResponse.redirect(
        new URL('/dashboard?calendar_error=invalid_callback', request.url)
      );
    }

    // Exchange authorization code for tokens
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    
    // Debug logging to verify environment variables
    logger.info('Token exchange debug', { 
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      clientIdLength: clientId.length,
      clientSecretLength: clientSecret.length
    });

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: 'http://localhost:3000/api/auth/calendar/callback', // Hardcoded to match OAuth initiation
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      logger.error('Failed to exchange code for tokens', { 
        status: tokenResponse.status,
        error: errorData 
      });
      return NextResponse.redirect(
        new URL('/dashboard?calendar_error=token_exchange_failed', request.url)
      );
    }

    const tokenData = await tokenResponse.json();

    // Validate token response
    if (!tokenData.access_token) {
      logger.error('No access token received', { tokenData });
      return NextResponse.redirect(
        new URL('/dashboard?calendar_error=no_access_token', request.url)
      );
    }

    // Store the calendar integration directly in the database
    try {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in || 3600));

      // Check if integration already exists
      const { data: existingIntegration } = await supabaseAdmin
        .from('user_integrations')
        .select('id')
        .eq('user_id', state)
        .eq('provider', 'google_calendar')
        .single();

      let error = null;

      if (existingIntegration) {
        // Update existing integration
        const { error: updateError } = await supabaseAdmin
          .from('user_integrations')
          .update({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || '',
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', state)
          .eq('provider', 'google_calendar');
        
        error = updateError;
      } else {
        // Insert new integration
        const { error: insertError } = await supabaseAdmin
          .from('user_integrations')
          .insert({
            user_id: state,
            provider: 'google_calendar',
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || '',
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        
        error = insertError;
      }

      if (error) {
        logger.error('Failed to store calendar integration', { error: error.message });
        return NextResponse.redirect(
          new URL('/dashboard?calendar_error=storage_failed', request.url)
        );
      }

      logger.info('Calendar integration stored successfully', { 
        userId: state, 
        operation: existingIntegration ? 'updated' : 'created' 
      });
    } catch (storageError: any) {
      logger.error('Error storing calendar integration', { error: storageError.message });
      return NextResponse.redirect(
        new URL('/dashboard?calendar_error=storage_failed', request.url)
      );
    }

    // Note: Verification will happen when the user tries to use the calendar integration
    // on the client side, where we have proper user session context

    // Redirect to dashboard with success
    return NextResponse.redirect(
      new URL('/dashboard?calendar_success=true', request.url)
    );

  } catch (error: any) {
    logger.error('Unexpected error in calendar OAuth callback', { error: error.message }, error);
    return NextResponse.redirect(
      new URL('/dashboard?calendar_error=unexpected_error', request.url)
    );
  }
} 