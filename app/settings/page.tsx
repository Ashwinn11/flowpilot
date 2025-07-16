import { SettingsForm } from "@/components/settings/settings-form";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <DashboardHeader />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Customize your FlowPilot experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsForm />
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}