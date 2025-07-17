import { ProgressView } from "@/components/progress/progress-view";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function ProgressPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <DashboardHeader profile={null} trialDaysLeft={0} oauthInfo={null} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ProgressView />
        </main>
      </div>
    </ProtectedRoute>
  );
}