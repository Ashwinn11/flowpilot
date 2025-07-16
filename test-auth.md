# 🔐 Authentication Test Guide

## Current Authentication Status

### ✅ What's Working

1. **OAuth Providers**: Google and Microsoft OAuth configured
2. **Protected Routes**: Dashboard is protected and redirects to auth
3. **User Profile Creation**: Auto-creates user profiles on first login
4. **Logout Functionality**: Properly signs out and redirects
5. **Real User Data**: Shows actual user info in dashboard header
6. **Loading States**: Proper loading indicators during auth

### 🧪 How to Test

#### 1. Test Login Flow
1. Visit `http://localhost:3000`
2. Click "Get Started" or navigate to `/auth`
3. Click "Continue with Google" or "Continue with Microsoft"
4. Complete OAuth flow
5. Should redirect to `/dashboard`
6. Check that user info appears in header

#### 2. Test Protected Routes
1. Try accessing `/dashboard` without being logged in
2. Should redirect to `/auth`
3. After login, should access dashboard normally

#### 3. Test Logout Flow
1. While logged in, click user avatar in header
2. Click "Log out"
3. Should redirect to home page
4. Try accessing `/dashboard` again - should redirect to auth

#### 4. Test User Profile Creation
1. Check Supabase dashboard > Table Editor > user_profiles
2. After first login, should see new user record
3. Verify trial_started_at is set

## 🔧 Configuration Required

### Supabase Setup
1. **OAuth Providers**: Configure Google and Microsoft in Supabase Auth
2. **Site URL**: Set to `http://localhost:3000` for development
3. **Redirect URLs**: Add `http://localhost:3000/auth/callback`

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🐛 Common Issues & Solutions

### "OAuth provider not configured"
- Check Supabase Auth > Providers
- Verify OAuth credentials are correct
- Ensure redirect URLs match

### "User profile not created"
- Check browser console for errors
- Verify RLS policies allow user profile creation
- Check Supabase logs for insert errors

### "Logout not working"
- Check if signOut function is called
- Verify router.push('/') works
- Check for JavaScript errors

### "Protected route not redirecting"
- Verify useAuth hook is working
- Check loading state handling
- Ensure router.push('/auth') works

## 📊 Expected Behavior

### Login Success
- ✅ OAuth popup/redirect works
- ✅ User redirected to dashboard
- ✅ User profile created in database
- ✅ User info displayed in header
- ✅ Toast notification shows success

### Logout Success
- ✅ User signed out from Supabase
- ✅ Redirected to home page
- ✅ Can't access protected routes
- ✅ Toast notification shows success

### Error Handling
- ✅ OAuth errors show toast notifications
- ✅ Network errors are handled gracefully
- ✅ Loading states prevent multiple clicks
- ✅ Fallback UI for missing user data

## 🚀 Production Checklist

- [ ] OAuth providers configured for production domain
- [ ] Environment variables set in production
- [ ] Database schema deployed
- [ ] RLS policies tested
- [ ] Error logging configured
- [ ] User profile creation tested
- [ ] Logout flow tested
- [ ] Protected routes working 