"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Clock, Bell, Palette, Shield, CreditCard } from "lucide-react";

export function SettingsForm() {
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john@example.com",
    workHours: { start: "09:00", end: "17:00" },
    workStyle: "proactive",
    notifications: true,
    darkMode: false
  });

  const handleSave = () => {
    // TODO: Save settings to Supabase
    console.log("Saving settings:", profile);
  };

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
              <AvatarImage src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline" size="sm">
                Change Photo
              </Button>
              <p className="text-sm text-muted-foreground mt-1">
                JPG, PNG up to 2MB
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
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
                value={profile.workHours.start}
                onChange={(e) => setProfile({
                  ...profile,
                  workHours: { ...profile.workHours, start: e.target.value }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Work End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={profile.workHours.end}
                onChange={(e) => setProfile({
                  ...profile,
                  workHours: { ...profile.workHours, end: e.target.value }
                })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workStyle">Work Style</Label>
            <Select
              value={profile.workStyle}
              onValueChange={(value) => setProfile({ ...profile, workStyle: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your work style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="proactive">Proactive - Plan ahead</SelectItem>
                <SelectItem value="reactive">Reactive - Respond to needs</SelectItem>
                <SelectItem value="balanced">Balanced - Mix of both</SelectItem>
              </SelectContent>
            </Select>
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
              checked={profile.notifications}
              onCheckedChange={(checked) => setProfile({ ...profile, notifications: checked })}
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
              checked={profile.darkMode}
              onCheckedChange={(checked) => setProfile({ ...profile, darkMode: checked })}
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
                Trial - 5 days remaining
              </p>
            </div>
            <Button variant="outline">
              Upgrade Now
            </Button>
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
        <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white">
          Save Changes
        </Button>
      </div>
    </div>
  );
}