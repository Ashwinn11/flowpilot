# 🔐 Profile System with Real-Time Data & OAuth Integration

## Overview

The FlowPilot profile system has been completely overhauled to use real-time data from Supabase and OAuth provider information. This provides a seamless user experience with live updates and accurate user information.

## ✨ Features

### Real-Time Profile Data
- **Live Updates**: Profile changes sync across all tabs/windows instantly
- **Supabase Integration**: All profile data stored in PostgreSQL with RLS policies
- **Optimistic UI**: Immediate UI updates with background sync

### OAuth Integration
- **Provider Information**: Displays which OAuth provider (Google/Microsoft) user connected with
- **Avatar Sync**: Automatically uses OAuth profile pictures
- **Name & Email**: Pre-fills with OAuth data, allows user customization

### Enhanced Settings
- **Work Hours**: Configurable start/end times and work days
- **Timezone Support**: Multiple timezone options
- **Trial Management**: Real-time trial days remaining calculation
- **Pro Status**: Dynamic pro user status display

## 🏗️ Architecture

### Core Components

1. **ProfileService** (`lib/profiles.ts`)
   - Handles all profile CRUD operations
   - Manages real-time subscriptions
   - Calculates trial days remaining
   - Extracts OAuth information

2. **useProfile Hook** (`hooks/use-profile.ts`)
   - React hook for profile state management
   - Real-time subscription management
   - Loading and error states
   - Optimistic updates

3. **Settings Form** (`components/settings/settings-form.tsx`)
   - Real-time form with live data
   - OAuth provider information display
   - Work hours and timezone configuration
   - Save with loading states

4. **Dashboard Header** (`components/dashboard/dashboard-header.tsx`)
   - Real-time user information display
   - OAuth avatar integration
   - Trial status with live countdown
   - Provider information

### Database Schema

```sql
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  timezone TEXT DEFAULT 'UTC',
  work_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00", "days": [1,2,3,4,5]}',
  trial_started_at TIMESTAMP WITH TIME ZONE,
  is_pro_user BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚀 Usage

### Basic Profile Access

```typescript
import { useProfile } from '@/hooks/use-profile';

function MyComponent() {
  const { profile, loading, updateProfile } = useProfile();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Hello, {profile?.name}!</h1>
      <p>Email: {profile?.email}</p>
    </div>
  );
}
```

### Updating Profile

```typescript
const { updateProfile } = useProfile();

const handleUpdate = async () => {
  const result = await updateProfile({
    name: "New Name",
    timezone: "America/New_York",
    work_hours: {
      start: "08:00",
      end: "18:00",
      days: [1, 2, 3, 4, 5]
    }
  });
  
  if (result) {
    toast.success("Profile updated!");
  }
};
```

### OAuth Information

```typescript
const { getOAuthInfo } = useProfile();
const oauthInfo = getOAuthInfo();

console.log(oauthInfo);
// {
//   name: "John Doe",
//   email: "john@example.com",
//   avatar_url: "https://...",
//   provider: "google"
// }
```

## 🔄 Real-Time Features

### Automatic Subscription
The `useProfile` hook automatically subscribes to profile changes:

```typescript
// Automatically set up in useProfile hook
const subscription = ProfileService.subscribeToProfileChanges(
  user.id,
  (updatedProfile) => {
    setProfile(updatedProfile);
    loadTrialDays();
  }
);
```

### Cross-Tab Sync
- Profile changes in one tab immediately reflect in other tabs
- No manual refresh required
- Optimistic UI updates for better UX

## 🧪 Testing

Visit `/test-profile` to test the profile system:

- **Real-time Updates**: Change profile data and watch it sync
- **OAuth Integration**: View OAuth provider information
- **Raw Data**: See JSON representation of all profile data
- **Test Controls**: Update name, reset profile, refresh page

## 🔧 Configuration

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Setup
1. Run the database schema from `database-schema.sql`
2. Configure OAuth providers (Google/Microsoft)
3. Set up RLS policies (included in schema)

## 🐛 Troubleshooting

### Common Issues

**Profile not loading:**
- Check Supabase connection
- Verify RLS policies are enabled
- Check browser console for errors

**OAuth data not showing:**
- Ensure OAuth providers are configured in Supabase
- Check user metadata in Supabase Auth dashboard
- Verify redirect URLs are correct

**Real-time not working:**
- Check Supabase real-time is enabled
- Verify subscription is properly set up
- Check network connectivity

### Debug Mode
Enable debug logging by adding to your component:

```typescript
const { profile, loading, updateProfile } = useProfile();

// Debug logging
useEffect(() => {
  console.log('Profile updated:', profile);
}, [profile]);
```

## 📈 Performance

### Optimizations
- **Lazy Loading**: Profile data loads only when needed
- **Caching**: Profile data cached in React state
- **Background Updates**: Non-blocking profile creation
- **Optimistic UI**: Immediate feedback for user actions

### Monitoring
- Profile load times
- Real-time subscription performance
- Database query optimization
- Error rates and recovery

## 🔮 Future Enhancements

### Planned Features
- **Profile Picture Upload**: Custom avatar upload
- **Notification Preferences**: Granular notification settings
- **Theme Preferences**: User-specific theme settings
- **Profile Export**: Data export functionality
- **Multi-Profile Support**: Multiple profiles per account

### Technical Improvements
- **Offline Support**: Profile caching for offline use
- **Conflict Resolution**: Handle concurrent profile updates
- **Bulk Operations**: Batch profile updates
- **Analytics**: Profile usage analytics

## 📚 API Reference

### ProfileService Methods

```typescript
// Get current user profile
ProfileService.getCurrentUserProfile(): Promise<UserProfile | null>

// Update profile
ProfileService.updateProfile(updates: UserProfileUpdate): Promise<UserProfile | null>

// Get trial days remaining
ProfileService.getTrialDaysRemaining(): Promise<number>

// Subscribe to real-time changes
ProfileService.subscribeToProfileChanges(userId: string, callback: Function)

// Get OAuth information
ProfileService.getOAuthProfile(): Promise<OAuthProfile | null>
```

### useProfile Hook

```typescript
const {
  profile,           // Current profile data
  loading,           // Loading state
  saving,            // Save operation state
  trialDaysLeft,     // Trial days remaining
  updateProfile,     // Update function
  getOAuthInfo,      // OAuth info getter
  refreshProfile     // Manual refresh function
} = useProfile();
```

---

This profile system provides a robust, real-time foundation for user data management in FlowPilot, with seamless OAuth integration and excellent user experience. 