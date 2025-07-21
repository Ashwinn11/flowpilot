"use client";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DailyPlanner } from "@/components/dashboard/daily-planner";
import { CalendarIntegration } from "@/components/dashboard/calendar-integration";
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
import { FreeTimeSlot, CalendarEvent } from "@/lib/calendar";

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
      <DialogContent aria-describedby="dashboard-dialog-desc" className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-gray-200 dark:border-slate-700">
        <div id="dashboard-dialog-desc" style={{position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden'}}>
          Dashboard dialog content.
        </div>
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">Set Your Work Preferences</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300">
            Please set your preferred work hours and days to get started.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="startTime" className="text-gray-700 dark:text-gray-300">Work Start Time</Label>
            <Input
              id="startTime"
              type="time"
              value={workHours.start}
              onChange={e => setWorkHours({ ...workHours, start: e.target.value })}
              className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 dark:bg-slate-800/80 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime" className="text-gray-700 dark:text-gray-300">Work End Time</Label>
            <Input
              id="endTime"
              type="time"
              value={workHours.end}
              onChange={e => setWorkHours({ ...workHours, end: e.target.value })}
              className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 dark:bg-slate-800/80 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400"
            />
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <Label className="text-gray-700 dark:text-gray-300">Work Days</Label>
          <div className="flex flex-wrap gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
              <Button
                key={day}
                variant={workHours.days.includes(index + 1) ? "gradient" : "outline"}
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
          <Button onClick={handleSave} disabled={saving} variant="gradient">
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
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [welcomeMessageShown, setWelcomeMessageShown] = useState(false);
  const [freeTimeSlots, setFreeTimeSlots] = useState<{ date: Date; freeSlots: FreeTimeSlot[] }[]>([]);
  const [calendarData, setCalendarData] = useState<{
    events: CalendarEvent[];
    tasks: CalendarEvent[];
    birthdays: CalendarEvent[];
  }>({ events: [], tasks: [], birthdays: [] });

  useEffect(() => {
    if (!loading && profile) {
      if (!profile.work_hours) {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }
      
      // Check if we should show welcome message for newly verified users
      // Only check once per session to prevent spam
      if (typeof window !== 'undefined' && !welcomeMessageShown) {
        const welcomeTimestamp = sessionStorage.getItem('showWelcomeMessage');
        const isNewUser = sessionStorage.getItem('isNewUser');
        console.log('Dashboard: Checking welcome message flag:', welcomeTimestamp, 'isNewUser:', isNewUser);
        
        if (welcomeTimestamp) {
          const timestamp = parseInt(welcomeTimestamp);
          const now = Date.now();
          const timeDiff = now - timestamp;
          
          console.log('Dashboard: Welcome message time diff:', timeDiff, 'ms');
          
          // Only show welcome message if the flag was set within the last 5 seconds (very restrictive)
          if (timeDiff < 5 * 1000) {
            console.log('Dashboard: Showing welcome message');
            setShowWelcomeMessage(true);
            setWelcomeMessageShown(true); // Prevent showing again
            sessionStorage.removeItem('showWelcomeMessage'); // Clear the flag immediately
            sessionStorage.removeItem('isNewUser'); // Clear the new user flag
            
            if (isNewUser === 'true') {
              toast.success('Welcome to FlowPilot! Your account has been successfully verified.');
            } else {
              toast.success('Welcome back! You\'ve signed in successfully.');
            }
          } else {
            // Clear stale flags
            console.log('Dashboard: Clearing stale welcome message flag');
            sessionStorage.removeItem('showWelcomeMessage');
            sessionStorage.removeItem('isNewUser');
          }
        }
      }
    }
  }, [profile, loading, welcomeMessageShown]);

  const handleSaveWorkPrefs = async (workHours: any) => {
    const result = await updateProfile({ work_hours: workHours });
    if (result) {
      setShowOnboarding(false);
      await refreshProfile();
    } else {
      toast.error('We couldn\'t save your work preferences. Please try again.');
    }
  };

  return (
    <ProtectedRoute>
      <PerformanceMonitor />
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
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main planner area */}
              <div className="lg:col-span-2">
                <DailyPlanner calendarData={calendarData} />
              </div>
              
              {/* Calendar integration sidebar */}
              <div className="lg:col-span-1">
                <CalendarIntegration 
                  userWorkHours={profile?.work_hours}
                  onFreeTimeSlotsUpdate={setFreeTimeSlots}
                  onCalendarDataUpdate={setCalendarData}
                />
              </div>
            </div>
          </main>
        </div>
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