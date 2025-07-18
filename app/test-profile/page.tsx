"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProfileTest } from "@/components/test/profile-test";
import { useProfile } from "@/hooks/use-profile";

export default function TestProfilePage() {
  const { profile, trialDaysLeft, getOAuthInfo } = useProfile();
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 dark:from-slate-900 dark:via-purple-950/30 dark:to-blue-950/20 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-20 h-20 sm:w-32 sm:h-32 bg-purple-200/20 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-16 h-16 sm:w-24 sm:h-24 bg-blue-200/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 sm:w-20 sm:h-20 bg-pink-200/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-40 right-1/3 w-10 h-10 sm:w-16 sm:h-16 bg-yellow-200/20 rounded-full blur-xl"></div>
        </div>

        <div className="relative z-10">
          <DashboardHeader profile={profile} trialDaysLeft={trialDaysLeft} oauthInfo={getOAuthInfo()} />
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Profile System Test
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Test the real-time profile functionality
                </p>
              </div>
              <ProfileTest
                profile={profile}
                loading={false}
                saving={false}
                trialDaysLeft={trialDaysLeft}
                updateProfile={async () => null}
                getOAuthInfo={getOAuthInfo}
              />
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
} 