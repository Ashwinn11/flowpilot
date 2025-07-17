import { SettingsPageClient } from "@/components/settings/settings-page-client";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

if (process.env.NODE_ENV !== 'production') {
  console.log('[DEBUG] settings/page.tsx server component rendered', new Date().toISOString());
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <SettingsPageClient />
      </div>
    </ProtectedRoute>
  );
}