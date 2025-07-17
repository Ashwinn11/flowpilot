"use client";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DailyPlanner } from "@/components/dashboard/daily-planner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { PerformanceMonitor } from "@/components/dashboard/performance-monitor";
import dynamic from "next/dynamic";
import { useProfile } from "@/hooks/use-profile";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";

// Lazy load the AI Assistant to improve initial page load
const AIAssistant = dynamic(
  () => import("@/components/dashboard/ai-assistant").then(mod => ({ default: mod.AIAssistant })),
  { ssr: false }
);

function isDefaultWorkHours(workHours: any) {
  if (!workHours) return true;
  return (
    workHours.start === "09:00" &&
    workHours.end === "17:00" &&
    Array.isArray(workHours.days) &&
    workHours.days.length === 5 &&
    workHours.days.every((d: any, i: number) => d === i + 1)
  );
}

function OnboardingWorkPreferencesModal({ open, onSave, initialWorkHours, saving }: any) {
  const [workHours, setWorkHours] = useState(initialWorkHours || { start: "09:00", end: "17:00", days: [1,2,3,4,5] });
  const [error, setError] = useState("");

  const validate = () => {
    if (!workHours.start || !workHours.end) {
      setError("Please select both start and end times.");
      return false;
    }
    if (workHours.start >= workHours.end) {
      setError("Start time must be before end time.");
      return false;
    }
    if (!workHours.days || workHours.days.length === 0) {
      setError("Please select at least one work day.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(workHours);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent aria-describedby="dashboard-dialog-desc">
        <div id="dashboard-dialog-desc" style={{position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden'}}>
          Dashboard dialog content.
        </div>
        <DialogHeader>
          <DialogTitle>Set Your Work Preferences</DialogTitle>
          <DialogDescription>
            Please set your preferred work hours and days to get started.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">Work Start Time</Label>
            <Input
              id="startTime"
              type="time"
              value={workHours.start}
              onChange={e => setWorkHours({ ...workHours, start: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">Work End Time</Label>
            <Input
              id="endTime"
              type="time"
              value={workHours.end}
              onChange={e => setWorkHours({ ...workHours, end: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <Label>Work Days</Label>
          <div className="flex flex-wrap gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
              <Button
                key={day}
                variant={workHours.days.includes(index + 1) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const days = workHours.days.includes(index + 1)
                    ? workHours.days.filter((d: any) => d !== index + 1)
                    : [...workHours.days, index + 1].sort();
                  setWorkHours({ ...workHours, days });
                }}
              >
                {day}
              </Button>
            ))}
          </div>
        </div>
        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
        <div className="flex justify-end mt-6">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <LoadingSpinner className="mr-2 h-4 w-4" size={16} />}
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Dashboard() {
  const { profile, updateProfile, loading, saving, refreshProfile, trialDaysLeft, getOAuthInfo } = useProfile();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!loading && profile) {
      if (!profile.work_hours) {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }
    }
  }, [profile, loading]);

  const handleSaveWorkPrefs = async (workHours: any) => {
    const result = await updateProfile({ work_hours: workHours });
    if (result) {
      setShowOnboarding(false);
      await refreshProfile();
    } else {
      toast.error('We couldn’t save your work preferences. Please try again.');
    }
  };

  return (
    <ProtectedRoute>
      <PerformanceMonitor />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <DashboardHeader profile={profile} trialDaysLeft={trialDaysLeft} oauthInfo={getOAuthInfo()} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DailyPlanner />
        </main>
        <AIAssistant />
        <OnboardingWorkPreferencesModal
          open={showOnboarding}
          onSave={handleSaveWorkPrefs}
          initialWorkHours={profile?.work_hours}
          saving={saving}
        />
      </div>
    </ProtectedRoute>
  );
}