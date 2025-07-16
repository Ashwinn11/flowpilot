import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DailyPlanner } from "@/components/dashboard/daily-planner";
import { AIAssistant } from "@/components/dashboard/ai-assistant";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <DashboardHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DailyPlanner />
        </main>
        <AIAssistant />
      </div>
    </ProtectedRoute>
  );
}