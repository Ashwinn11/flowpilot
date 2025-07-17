"use client";
import { useProfile } from "@/hooks/use-profile";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SettingsForm } from "@/components/settings/settings-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function SettingsPageClient() {
  console.log('[DEBUG] SettingsPageClient mounted', new Date().toISOString());
  const { profile, trialDaysLeft, getOAuthInfo, loading, saving, updateProfile, profileError, retryProfileFetch } = useProfile();

  return (
    <>
      <DashboardHeader profile={profile} trialDaysLeft={trialDaysLeft} oauthInfo={getOAuthInfo()} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
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
    </>
  );
} 