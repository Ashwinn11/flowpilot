"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Clock, Bell, Palette, Shield, CreditCard, Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "next-themes";
import { toast } from "sonner";

interface SettingsFormProps {
  profile: any;
  loading: boolean;
  saving: boolean;
  trialDaysLeft: number;
  updateProfile: (updates: any) => Promise<any>;
  getOAuthInfo: () => any;
  profileError: string | null;
  retryProfileFetch: () => void;
}

export function SettingsForm({ profile, loading, saving, trialDaysLeft, updateProfile, getOAuthInfo, profileError, retryProfileFetch }: SettingsFormProps) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const oauthInfo = getOAuthInfo();
  const initializedRef = useRef(false);
  const isSavingRef = useRef(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    timezone: "UTC", // Start with UTC, will be updated in useEffect
    workHours: { start: "09:00", end: "17:00", days: [1, 2, 3, 4, 5] },
    notifications: true, // TODO: Add to profile schema
  });

  // Initialize form data once when profile loads
  useEffect(() => {
    if (profile && !initializedRef.current) {
      // Use profile timezone as-is, no automatic sync
      const getUserTimezone = () => {
        // Use profile timezone if set, otherwise fall back to browser timezone for initial display
        if (profile.timezone) {
          return profile.timezone;
        }
        
        // Only for new users with no timezone set - get browser timezone as initial value
        try {
          return Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch (error) {
          return 'UTC';
        }
      };

      const userTimezone = getUserTimezone();

      setFormData({
        name: profile.name || oauthInfo?.name || "",
        email: profile.email || oauthInfo?.email || "",
        timezone: userTimezone,
        workHours: profile.work_hours || { start: "09:00", end: "17:00", days: [1, 2, 3, 4, 5] },
        notifications: true,
      });
      
      initializedRef.current = true;
    }
  }, [profile, oauthInfo]);

  const handleSave = async () => {
    if (!profile || isSavingRef.current) return;
    
    isSavingRef.current = true;

    const updates = {
      name: formData.name,
      email: formData.email,
      timezone: formData.timezone,
      work_hours: formData.workHours
    };

    const result = await updateProfile(updates);
    if (result) {
      toast.success('Your settings have been saved!');
    } else {
      toast.error('We couldn\'t save your settings. Please try again soon.');
    }
    
    isSavingRef.current = false;
  };

  const handleThemeChange = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  const getAvatarFallback = () => {
    const name = formData.name || oauthInfo?.name || user?.email?.split('@')[0] || 'U';
    return name.charAt(0).toUpperCase();
  };

  const getAvatarUrl = () => {
    return oauthInfo?.avatar_url || profile?.avatar_url;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/80 backdrop-blur-md dark:bg-slate-800/80 border-0 shadow-xl">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              <span className="text-gray-600 dark:text-gray-300">Loading profile...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/80 backdrop-blur-md dark:bg-slate-800/80 border-0 shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <span className="text-red-500 mb-4">{profileError}</span>
            <Button onClick={retryProfileFetch} variant="gradient">Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Settings */}
      <Card className="bg-white/80 backdrop-blur-md dark:bg-slate-800/80 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <User className="w-5 h-5 mr-2 text-purple-600" />
            Profile
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Manage your account information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={getAvatarUrl()} alt={formData.name || oauthInfo?.name || user?.email?.split('@')[0] || 'User avatar'} />
              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                {getAvatarFallback()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {formData.name || oauthInfo?.name || 'User'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formData.email || oauthInfo?.email || 'No email'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your name"
                className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 dark:bg-slate-800/80 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
                className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 dark:bg-slate-800/80 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone" className="text-gray-700 dark:text-gray-300">Timezone</Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) => setFormData({ ...formData, timezone: value })}
            >
              <SelectTrigger className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 dark:bg-slate-800/80 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400">
                <SelectValue placeholder="Select your timezone" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-gray-200 dark:border-slate-700">
                <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                
                {/* North America */}
                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                <SelectItem value="America/Anchorage">Alaska Time (AKT)</SelectItem>
                <SelectItem value="Pacific/Honolulu">Hawaii Time (HST)</SelectItem>
                
                {/* Europe */}
                <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                <SelectItem value="Europe/Paris">Paris (CET/CEST)</SelectItem>
                <SelectItem value="Europe/Berlin">Berlin (CET/CEST)</SelectItem>
                <SelectItem value="Europe/Rome">Rome (CET/CEST)</SelectItem>
                <SelectItem value="Europe/Madrid">Madrid (CET/CEST)</SelectItem>
                <SelectItem value="Europe/Amsterdam">Amsterdam (CET/CEST)</SelectItem>
                <SelectItem value="Europe/Stockholm">Stockholm (CET/CEST)</SelectItem>
                <SelectItem value="Europe/Zurich">Zurich (CET/CEST)</SelectItem>
                <SelectItem value="Europe/Vienna">Vienna (CET/CEST)</SelectItem>
                <SelectItem value="Europe/Prague">Prague (CET/CEST)</SelectItem>
                <SelectItem value="Europe/Budapest">Budapest (CET/CEST)</SelectItem>
                <SelectItem value="Europe/Warsaw">Warsaw (CET/CEST)</SelectItem>
                <SelectItem value="Europe/Moscow">Moscow (MSK)</SelectItem>
                
                {/* Asia */}
                <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                <SelectItem value="Asia/Shanghai">Shanghai (CST)</SelectItem>
                <SelectItem value="Asia/Seoul">Seoul (KST)</SelectItem>
                <SelectItem value="Asia/Singapore">Singapore (SGT)</SelectItem>
                <SelectItem value="Asia/Hong_Kong">Hong Kong (HKT)</SelectItem>
                <SelectItem value="Asia/Bangkok">Bangkok (ICT)</SelectItem>
                <SelectItem value="Asia/Jakarta">Jakarta (WIB)</SelectItem>
                <SelectItem value="Asia/Manila">Manila (PHT)</SelectItem>
                <SelectItem value="Asia/Kolkata">Mumbai (IST)</SelectItem>
                <SelectItem value="Asia/Calcutta">Kolkata (IST)</SelectItem>
                <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                <SelectItem value="Asia/Tehran">Tehran (IRST)</SelectItem>
                
                {/* Australia & Pacific */}
                <SelectItem value="Australia/Sydney">Sydney (AEDT/AEST)</SelectItem>
                <SelectItem value="Australia/Melbourne">Melbourne (AEDT/AEST)</SelectItem>
                <SelectItem value="Australia/Perth">Perth (AWST)</SelectItem>
                <SelectItem value="Australia/Adelaide">Adelaide (ACDT/ACST)</SelectItem>
                <SelectItem value="Pacific/Auckland">Auckland (NZDT/NZST)</SelectItem>
                
                {/* South America */}
                <SelectItem value="America/Sao_Paulo">São Paulo (BRT/BRST)</SelectItem>
                <SelectItem value="America/Argentina/Buenos_Aires">Buenos Aires (ART)</SelectItem>
                <SelectItem value="America/Santiago">Santiago (CLT/CLST)</SelectItem>
                <SelectItem value="America/Lima">Lima (PET)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Work Hours Settings */}
      <Card className="bg-white/80 backdrop-blur-md dark:bg-slate-800/80 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <Clock className="w-5 h-5 mr-2 text-purple-600" />
            Work Hours
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Set your preferred work schedule for better productivity predictions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="text-gray-700 dark:text-gray-300">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.workHours.start}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  workHours: { ...formData.workHours, start: e.target.value }
                })}
                className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 dark:bg-slate-800/80 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime" className="text-gray-700 dark:text-gray-300">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.workHours.end}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  workHours: { ...formData.workHours, end: e.target.value }
                })}
                className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 dark:bg-slate-800/80 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">Work Days</Label>
            <div className="flex flex-wrap gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                <Button
                  key={day}
                  variant={formData.workHours.days.includes(index + 1) ? "gradient" : "outline"}
                  size="sm"
                  onClick={() => {
                    const days = formData.workHours.days.includes(index + 1)
                      ? formData.workHours.days.filter((d: any) => d !== index + 1)
                      : [...formData.workHours.days, index + 1].sort();
                    setFormData({ 
                      ...formData, 
                      workHours: { ...formData.workHours, days }
                    });
                  }}
                >
                  {day}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="bg-white/80 backdrop-blur-md dark:bg-slate-800/80 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <Palette className="w-5 h-5 mr-2 text-purple-600" />
            Preferences
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Customize your FlowPilot experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-gray-700 dark:text-gray-300">Dark Mode</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Switch between light and dark themes
              </p>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={handleThemeChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-gray-700 dark:text-gray-300">Notifications</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receive productivity insights and reminders
              </p>
            </div>
            <Switch
              checked={formData.notifications}
              onCheckedChange={(checked) => setFormData({ ...formData, notifications: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving} 
          variant="gradient"
          className="px-8"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}