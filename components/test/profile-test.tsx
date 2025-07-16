"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export function ProfileTest() {
  const { profile, loading, saving, trialDaysLeft, updateProfile, getOAuthInfo } = useProfile();
  const { user } = useAuth();
  const oauthInfo = getOAuthInfo();
  const [testName, setTestName] = useState("");

  const handleTestUpdate = async () => {
    if (!profile) return;

    const result = await updateProfile({
      name: testName || `Test User ${Date.now()}`
    });

    if (result) {
      toast.success("Test update successful!");
      setTestName("");
    }
  };

  const handleResetProfile = async () => {
    if (!profile) return;

    const result = await updateProfile({
      name: oauthInfo?.name || "Reset User",
      timezone: "UTC",
      work_hours: { start: "09:00", end: "17:00", days: [1, 2, 3, 4, 5] }
    });

    if (result) {
      toast.success("Profile reset successful!");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading profile data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Profile Data */}
      <Card>
        <CardHeader>
          <CardTitle>Current Profile Data</CardTitle>
          <CardDescription>
            Real-time profile information from Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={oauthInfo?.avatar_url} />
              <AvatarFallback>
                {profile?.name?.charAt(0) || oauthInfo?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{profile?.name || oauthInfo?.name || 'No name'}</h3>
              <p className="text-sm text-muted-foreground">{profile?.email || oauthInfo?.email}</p>
              <Badge variant="outline">
                {oauthInfo?.provider === 'google' ? 'Google' : 
                 oauthInfo?.provider === 'microsoft' ? 'Microsoft' : 
                 oauthInfo?.provider || 'Unknown provider'}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label>User ID</Label>
              <p className="font-mono text-xs">{profile?.id}</p>
            </div>
            <div>
              <Label>Timezone</Label>
              <p>{profile?.timezone}</p>
            </div>
            <div>
              <Label>Work Hours</Label>
              <p>{profile?.work_hours?.start} - {profile?.work_hours?.end}</p>
            </div>
            <div>
              <Label>Trial Days Left</Label>
              <p>{trialDaysLeft} days</p>
            </div>
            <div>
              <Label>Pro User</Label>
              <p>{profile?.is_pro_user ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <Label>Created</Label>
              <p>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OAuth Information */}
      <Card>
        <CardHeader>
          <CardTitle>OAuth Information</CardTitle>
          <CardDescription>
            Data from the OAuth provider
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label>Provider</Label>
              <p>{oauthInfo?.provider || 'Unknown'}</p>
            </div>
            <div>
              <Label>OAuth Name</Label>
              <p>{oauthInfo?.name || 'No name'}</p>
            </div>
            <div>
              <Label>OAuth Email</Label>
              <p>{oauthInfo?.email || 'No email'}</p>
            </div>
            <div>
              <Label>Avatar URL</Label>
              <p className="text-xs truncate">{oauthInfo?.avatar_url || 'No avatar'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
          <CardDescription>
            Test profile updates and real-time functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testName">Test Name Update</Label>
            <div className="flex space-x-2">
              <Input
                id="testName"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="Enter a test name"
              />
              <Button 
                onClick={handleTestUpdate}
                disabled={saving || !testName.trim()}
              >
                {saving ? 'Updating...' : 'Update Name'}
              </Button>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleResetProfile}
              disabled={saving}
            >
              Reset Profile
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>• Try updating the name and watch it update in real-time</p>
            <p>• Check the dashboard header to see the changes</p>
            <p>• Open another tab to test real-time sync</p>
          </div>
        </CardContent>
      </Card>

      {/* Raw Data */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Data</CardTitle>
          <CardDescription>
            JSON representation of the profile data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-4 rounded overflow-auto">
            {JSON.stringify({ profile, oauthInfo, trialDaysLeft }, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
} 