"use client";
import { useProfile } from "@/hooks/use-profile";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SettingsForm } from "@/components/settings/settings-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function SettingsPageClient() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[DEBUG] SettingsPageClient mounted', new Date().toISOString());
  }
  const { profile, trialDaysLeft, getOAuthInfo, loading, saving, updateProfile, profileError, retryProfileFetch } = useProfile();

  return (
    <>
      <DashboardHeader profile={profile} trialDaysLeft={trialDaysLeft} oauthInfo={getOAuthInfo()} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 dark:from-slate-900 dark:via-purple-950/30 dark:to-blue-950/20 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-20 h-20 sm:w-32 sm:h-32 bg-purple-200/20 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-16 h-16 sm:w-24 sm:h-24 bg-blue-200/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 sm:w-20 sm:h-20 bg-pink-200/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-40 right-1/3 w-10 h-10 sm:w-16 sm:h-16 bg-yellow-200/20 rounded-full blur-xl"></div>
        </div>

        <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-md dark:bg-slate-800/80">
            <CardHeader>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Settings
              </CardTitle>
              <CardDescription className="text-base text-gray-600 dark:text-gray-300">
                Customize your FlowPilot experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsForm
                profile={profile}
                loading={loading}
                saving={saving}
                trialDaysLeft={trialDaysLeft}
                updateProfile={updateProfile}
                getOAuthInfo={getOAuthInfo}
                profileError={profileError}
                retryProfileFetch={retryProfileFetch}
              />
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
} 