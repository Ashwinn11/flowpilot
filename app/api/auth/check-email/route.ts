import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { AuthValidator } from '@/lib/auth-validation';

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

    const { email } = await request.json();
    const emailValidation = AuthValidator.validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json({ exists: false });
    }

    // SECURE APPROACH: Use Supabase admin functions to check user existence
    // This requires the service role key for admin access
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (serviceRoleKey) {
      // Use admin API if service role key is available
      const adminSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
          },
        }
      );

      // Check if user exists by email using admin API
      const { data: users, error } = await adminSupabase.auth.admin.listUsers();
      
      if (error) {
        console.error('Admin API error:', error);
        // Fallback to secure method
      } else {
        // Find user by email
        const user = users.users.find(u => u.email?.toLowerCase() === emailValidation.sanitizedData!.email.toLowerCase());
        
        if (!user) {
          return NextResponse.json({ exists: false });
        }

        // Determine provider from user metadata
        const provider = user.app_metadata?.provider || 'password';
        
        return NextResponse.json({ 
          exists: true, 
          provider: provider === 'google' ? 'google' : 
                    provider === 'azure' ? 'microsoft' : 
                    'password' 
        });
      }
    }

    // FALLBACK: Secure method without admin API
    // Instead of using dummy password, we'll return a generic response
    // that doesn't reveal whether the email exists or not
    // This prevents email enumeration attacks
    return NextResponse.json({ 
      exists: false, 
      provider: null,
      message: 'Please try signing in or creating an account' 
    });

  } catch (error) {
    console.error('Email check error:', error);
    // Return exists: false on any error to be safe
    return NextResponse.json({ exists: false });
  }
} 