import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProfileTest } from "@/components/test/profile-test";
import { useProfile } from "@/hooks/use-profile";

export default function TestProfilePage() {
  const { profile, trialDaysLeft, getOAuthInfo } = useProfile();
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <DashboardHeader profile={profile} trialDaysLeft={trialDaysLeft} oauthInfo={getOAuthInfo()} />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Profile System Test
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Test the real-time profile functionality
              </p>
            </div>
            <ProfileTest
              profile={profile}
              loading={false}
              saving={false}
              trialDaysLeft={trialDaysLeft}
              updateProfile={() => {}}
              getOAuthInfo={getOAuthInfo}
            />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
} 