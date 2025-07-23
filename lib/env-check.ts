// Environment variable validation script

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'NEXT_PUBLIC_BASE_URL',
  'NEXT_PUBLIC_CALENDAR_REDIRECT_URI',
  'ALLOWED_ORIGINS',
  // 'THREAT_INTEL_FEED_URL', // Uncomment if required for production
];

const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

if (missing.length > 0) {
  // eslint-disable-next-line no-console
  console.error(`\n❌ Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
} else {
  // eslint-disable-next-line no-console
  console.log('✅ All required environment variables are set.');
} 