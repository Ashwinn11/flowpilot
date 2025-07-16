import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProfileTest } from "@/components/test/profile-test";

export default function TestProfilePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <DashboardHeader />
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
            <ProfileTest />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
} 