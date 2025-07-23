import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const accessToken = authHeader?.replace('Bearer ', '');

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error: deleteError } = await supabaseAdmin
    .from('calendar_tokens')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', 'google');

  if (deleteError) {
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
} 