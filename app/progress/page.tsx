import { ProgressView } from "@/components/progress/progress-view";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function ProgressPage() {
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
          <DashboardHeader profile={null} trialDaysLeft={0} oauthInfo={null} />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ProgressView />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}