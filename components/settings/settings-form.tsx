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
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export function SettingsForm() {
  const { profile, loading, saving, trialDaysLeft, updateProfile, getOAuthInfo } = useProfile();
  const { user } = useAuth();
  const oauthInfo = getOAuthInfo();
  const initializedRef = useRef(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    timezone: "UTC", // Start with UTC, will be updated in useEffect
    workHours: { start: "09:00", end: "17:00", days: [1, 2, 3, 4, 5] },
    notifications: true, // TODO: Add to profile schema
    darkMode: false // TODO: Add to profile schema
  });

  // Initialize form data once when profile loads
  useEffect(() => {
    if (profile && !initializedRef.current) {
      // Get user's timezone from browser if not set in profile
      const getUserTimezone = () => {
        if (profile.timezone && profile.timezone !== 'UTC') {
          return profile.timezone;
        }
        
        // Try to detect user's timezone from browser
        try {
          const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          
          // If profile has UTC and we detected a different timezone, update the profile
          if (profile.timezone === 'UTC' && browserTimezone !== 'UTC') {
            updateProfile({ timezone: browserTimezone }).catch(console.error);
          }
          
          return browserTimezone;
        } catch (error) {
          return 'UTC';
        }
      };

      const detectedTimezone = getUserTimezone();

      setFormData({
        name: profile.name || oauthInfo?.name || "",
        email: profile.email || oauthInfo?.email || "",
        timezone: detectedTimezone,
        workHours: profile.work_hours || { start: "09:00", end: "17:00", days: [1, 2, 3, 4, 5] },
        notifications: true,
        darkMode: false
      });
      
      initializedRef.current = true;
    }
  }, [profile, oauthInfo]);

  const handleSave = async () => {
    if (!profile) return;

    const updates = {
      name: formData.name,
      email: formData.email,
      timezone: formData.timezone,
      work_hours: formData.workHours
    };

    const result = await updateProfile(updates);
    if (result) {
      toast.success("Settings saved successfully");
    }
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
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading profile...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Profile
          </CardTitle>
          <CardDescription>
            Manage your account information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={getAvatarUrl()} />
              <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                {formData.name || oauthInfo?.name || 'User'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {formData.email || oauthInfo?.email || 'No email'}
              </p>
              {oauthInfo?.provider && (
                <p className="text-xs text-muted-foreground">
                  Connected via {oauthInfo.provider === 'google' ? 'Google' : oauthInfo.provider === 'microsoft' ? 'Microsoft' : oauthInfo.provider}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) => setFormData({ ...formData, timezone: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your timezone" />
              </SelectTrigger>
              <SelectContent>
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
                <SelectItem value="America/Bogota">Bogotá (COT)</SelectItem>
                <SelectItem value="America/Mexico_City">Mexico City (CST/CDT)</SelectItem>
                
                {/* Africa */}
                <SelectItem value="Africa/Cairo">Cairo (EET)</SelectItem>
                <SelectItem value="Africa/Johannesburg">Johannesburg (SAST)</SelectItem>
                <SelectItem value="Africa/Lagos">Lagos (WAT)</SelectItem>
                <SelectItem value="Africa/Nairobi">Nairobi (EAT)</SelectItem>
                <SelectItem value="Africa/Casablanca">Casablanca (WET)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Work Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Work Preferences
          </CardTitle>
          <CardDescription>
            Set your preferred work hours and style
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Work Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.workHours.start}
                onChange={(e) => setFormData({
                  ...formData,
                  workHours: { ...formData.workHours, start: e.target.value }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Work End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.workHours.end}
                onChange={(e) => setFormData({
                  ...formData,
                  workHours: { ...formData.workHours, end: e.target.value }
                })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Work Days</Label>
            <div className="flex flex-wrap gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                <Button
                  key={day}
                  variant={formData.workHours.days.includes(index + 1) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const days = formData.workHours.days.includes(index + 1)
                      ? formData.workHours.days.filter(d => d !== index + 1)
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

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure how you want to be notified
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-muted-foreground">
                Get notified about task reminders and updates
              </p>
            </div>
            <Switch
              checked={formData.notifications}
              onCheckedChange={(checked) => setFormData({ ...formData, notifications: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Summaries</p>
              <p className="text-sm text-muted-foreground">
                Receive daily productivity summaries
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Break Reminders</p>
              <p className="text-sm text-muted-foreground">
                Get reminded to take breaks during focus sessions
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="w-5 h-5 mr-2" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel of FlowPilot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark themes
              </p>
            </div>
            <Switch
              checked={formData.darkMode}
              onCheckedChange={(checked) => setFormData({ ...formData, darkMode: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Billing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Billing
          </CardTitle>
          <CardDescription>
            Manage your subscription and billing information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Current Plan</p>
              <p className="text-sm text-muted-foreground">
                {profile?.is_pro_user ? 'Pro Plan' : `Trial - ${trialDaysLeft} days remaining`}
              </p>
            </div>
            {!profile?.is_pro_user && (
              <Button variant="outline">
                Upgrade Now
              </Button>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <Button variant="outline" className="w-full">
              Manage Subscription
            </Button>
            <Button variant="outline" className="w-full">
              Download Invoice
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}