import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import { auditLogger } from '@/lib/audit-logger';
import { threatDetection } from '@/lib/threat-detection';

const MFA_ISSUER = 'FlowPilot';

async function getUserAndProfile(request: NextRequest) {
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
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { user: null, profile: null, supabase };
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  return { user, profile, supabase };
}

export async function POST(request: NextRequest) {
  const { action, code } = await request.json();
  const { user, profile, supabase } = await getUserAndProfile(request);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  // --- 1. Setup: Generate secret and QR code ---
  if (action === 'setup') {
    if (!user.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }
    
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, MFA_ISSUER, secret);
    const qr = await qrcode.toDataURL(otpauth);
    // Store secret temporarily in profile (not enabled yet)
    await supabase.from('user_profiles').update({ mfa_secret: secret }).eq('id', user.id);
    
    // Log MFA setup initiation
    await auditLogger.logMFAEvent(
      user.id,
      'mfa_enabled',
      { action: 'setup_initiated' },
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      request.headers.get('user-agent') || 'unknown'
    );
    
    return NextResponse.json({ secret, otpauth, qr });
  }

  // --- 2. Verify: Enable MFA after user enters correct TOTP code ---
  if (action === 'verify') {
    if (!profile?.mfa_secret) return NextResponse.json({ error: 'No MFA secret found' }, { status: 400 });
    if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });
    const valid = authenticator.check(code, profile.mfa_secret);
    if (!valid) {
      // Check for MFA bypass attempt
      const threatResult = await threatDetection.checkThreat(
        'mfa_bypass_attempt',
        user.id,
        { action: 'verify_failed', code: code.substring(0, 2) + '***' },
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      );

      // Log failed MFA verification
      await auditLogger.logMFAEvent(
        user.id,
        'mfa_challenge_failed',
        { 
          action: 'verify_failed', 
          code: code.substring(0, 2) + '***',
          threatDetected: threatResult.threat
        },
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      );

      // If threat detected and action is block, return blocked response
      if (threatResult.threat && threatResult.action === 'block') {
        return NextResponse.json({ 
          error: 'Access temporarily blocked',
          message: 'Too many failed MFA attempts. Please try again later.'
        }, { status: 429 });
      }

      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }
    await supabase.from('user_profiles').update({ mfa_enabled: true }).eq('id', user.id);
    
    // Log successful MFA enablement
    await auditLogger.logMFAEvent(
      user.id,
      'mfa_enabled',
      { action: 'verify_success' },
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      request.headers.get('user-agent') || 'unknown'
    );
    
    return NextResponse.json({ success: true });
  }

  // --- 3. Challenge: Verify TOTP code at login ---
  if (action === 'challenge') {
    if (!profile?.mfa_enabled || !profile?.mfa_secret) return NextResponse.json({ error: 'MFA not enabled' }, { status: 400 });
    if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });
    const valid = authenticator.check(code, profile.mfa_secret);
    if (!valid) {
      // Check for MFA bypass attempt
      const threatResult = await threatDetection.checkThreat(
        'mfa_bypass_attempt',
        user.id,
        { action: 'challenge_failed', code: code.substring(0, 2) + '***' },
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      );

      // Log failed MFA challenge
      await auditLogger.logMFAEvent(
        user.id,
        'mfa_challenge_failed',
        { 
          action: 'challenge_failed', 
          code: code.substring(0, 2) + '***',
          threatDetected: threatResult.threat
        },
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      );

      // If threat detected and action is block, return blocked response
      if (threatResult.threat && threatResult.action === 'block') {
        return NextResponse.json({ 
          error: 'Access temporarily blocked',
          message: 'Too many failed MFA attempts. Please try again later.'
        }, { status: 429 });
      }

      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }
    
    // Log successful MFA challenge
    await auditLogger.logMFAEvent(
      user.id,
      'mfa_challenge_success',
      { action: 'challenge_success' },
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      request.headers.get('user-agent') || 'unknown'
    );
    
    return NextResponse.json({ success: true });
  }

  // --- 4. Disable MFA ---
  if (action === 'disable') {
    await supabase.from('user_profiles').update({ mfa_enabled: false, mfa_secret: null }).eq('id', user.id);
    
    // Log MFA disablement
    await auditLogger.logMFAEvent(
      user.id,
      'mfa_disabled',
      { action: 'disable' },
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      request.headers.get('user-agent') || 'unknown'
    );
    
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
} 