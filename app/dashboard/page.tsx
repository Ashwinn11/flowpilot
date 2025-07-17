"use client";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DailyPlanner } from "@/components/dashboard/daily-planner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { PerformanceMonitor } from "@/components/dashboard/performance-monitor";
import dynamic from "next/dynamic";

// Lazy load the AI Assistant to improve initial page load
const AIAssistant = dynamic(
  () => import("@/components/dashboard/ai-assistant").then(mod => ({ default: mod.AIAssistant })),
  { ssr: false }
);

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <PerformanceMonitor />
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