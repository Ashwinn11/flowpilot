import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

async function refreshGoogleToken(refresh_token: string) {
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
    refresh_token,
    grant_type: 'refresh_token',
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    console.error('Failed to refresh Google token:', await res.text());
    throw new Error('Failed to refresh Google token');
  }
  return res.json();
}

async function createEvent(event: any, token: string) {
  return fetch(GOOGLE_CALENDAR_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { user_id, title, description, startTime, duration } = await req.json();
    console.log('[AddTask] Incoming request:', { user_id, title, startTime, duration });
    // Add debug log for user_id
    console.log('[AddTask] user_id from request:', user_id);

    // Get access token from Authorization header
    const authHeader = req.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    console.log('[AddTask] Supabase access token from header:', accessToken ? accessToken.slice(0, 12) + '...' : null);
    if (!accessToken) {
      console.error('[AddTask] No Supabase access token provided');
      return NextResponse.json({ error: 'Unauthorized: No Supabase access token provided' }, { status: 401 });
    }

    // Create a Supabase client with the user's access token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    // Try to get the authenticated user from Supabase
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(accessToken);
    console.log('[AddTask] Supabase authenticated user:', authUser, 'Auth error:', authError);

    if (!user_id || !title || !startTime) {
      console.error('[AddTask] Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate start time isn't in the past
    const startDate = new Date(startTime);
    const now = new Date();
    if (startDate < now) {
      console.error('[AddTask] Cannot schedule task in the past');
      return NextResponse.json({ error: 'Cannot schedule task in the past' }, { status: 400 });
    }

    // Validate duration is reasonable (between 5 minutes and 8 hours)
    const taskDuration = duration || 60;
    if (taskDuration < 5 || taskDuration > 480) {
      console.error('[AddTask] Invalid duration:', taskDuration);
      return NextResponse.json({ error: 'Duration must be between 5 minutes and 8 hours' }, { status: 400 });
    }

    // Use supabase directly in all queries
    let { data: tokenRows, error } = await supabase
      .from('calendar_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user_id)
      .eq('provider', 'google');
    // Add debug log for Supabase query result
    console.log('[AddTask] Supabase query result (array):', { tokenRows, error });
    const tokenRow = Array.isArray(tokenRows) && tokenRows.length > 0 ? tokenRows[0] : null;

    if (error || !tokenRow?.access_token) {
      console.error('[AddTask] No Google Calendar token found for user', { error });
      return NextResponse.json({ error: 'No Google Calendar token found for user' }, { status: 401 });
    }

    let accessTokenGoogle = tokenRow.access_token;
    console.log('[AddTask] Using access token:', accessTokenGoogle.slice(0, 12) + '...');
    // Log the full access token for debugging (mask most of it)
    console.log('[AddTask] Google access token (masked):', accessTokenGoogle.slice(0, 12) + '...' + accessTokenGoogle.slice(-6));

    // Prepare event data
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const event = {
      summary: title,
      description: description || '',
      start: {
        dateTime: new Date(startTime).toISOString(),
        timeZone: userTimezone,
      },
      end: {
        dateTime: new Date(new Date(startTime).getTime() + (duration || 60) * 60000).toISOString(),
        timeZone: userTimezone,
      },
    };
    console.log('[AddTask] Event data:', event);

    // Try to create the event
    let googleRes = await createEvent(event, accessTokenGoogle);
    console.log('[AddTask] Google API response status:', googleRes.status);

    // If unauthorized, try to refresh the token
    if (googleRes.status === 401 && tokenRow.refresh_token) {
      try {
        console.log('[AddTask] Attempting token refresh...');
        const tokenData = await refreshGoogleToken(tokenRow.refresh_token);
        if (tokenData.access_token) {
          // Update the token in the database
          await supabase
            .from('calendar_tokens')
            .update({
              access_token: tokenData.access_token,
              expires_at: tokenData.expires_in
                ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
                : null,
            })
            .eq('user_id', user_id)
            .eq('provider', 'google');
          accessTokenGoogle = tokenData.access_token;
          console.log('[AddTask] Token refreshed. Retrying event creation.');
          // Retry event creation
          googleRes = await createEvent(event, accessTokenGoogle);
          console.log('[AddTask] Google API response status after refresh:', googleRes.status);
        } else {
          throw new Error('No access token returned from refresh');
        }
      } catch (refreshError) {
        console.error('[AddTask] Failed to refresh Google token:', refreshError);
        return NextResponse.json({ error: 'Failed to refresh Google token. Please reconnect your calendar.' }, { status: 401 });
      }
    }

    if (!googleRes.ok) {
      const errorText = await googleRes.text();
      console.error('[AddTask] Failed to create event in Google Calendar:', errorText);
      
      // Provide more specific error messages
      let userMessage = 'Failed to create event in Google Calendar';
      if (googleRes.status === 403) {
        userMessage = 'Insufficient permissions. Please reconnect your Google Calendar with full access.';
      } else if (googleRes.status === 409) {
        userMessage = 'Time slot conflict. Please choose a different time.';
      } else if (googleRes.status === 400) {
        userMessage = 'Invalid event data. Please check your task details.';
      }
      
      return NextResponse.json({ 
        error: userMessage, 
        details: errorText,
        status: googleRes.status 
      }, { status: 500 });
    }

    const googleEvent = await googleRes.json();
    console.log('[AddTask] Event created successfully:', googleEvent.id);
    
    // Return the calendar event ID and additional metadata
    return NextResponse.json({ 
      calendarEventId: googleEvent.id,
      eventUrl: googleEvent.htmlLink,
      success: true,
      message: 'Task successfully added to Google Calendar'
    });
  } catch (error: any) {
    console.error('[AddTask] Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export const runtime = 'edge'; 