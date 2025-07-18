"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Zap, Settings, BarChart3, LogOut, Crown, Calendar } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SessionStatus } from "@/components/auth/session-status";
import { useAuth } from "@/contexts/auth-context";
import { useProfile } from "@/hooks/use-profile";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export function DashboardHeader({ profile, trialDaysLeft, oauthInfo }: any) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const getUserDisplayName = () => {
    return profile?.name || oauthInfo?.name || user?.email?.split('@')[0] || 'User';
  };

  const getUserEmail = () => {
    return profile?.email || oauthInfo?.email || user?.email || 'No email';
  };

  const getAvatarUrl = () => {
    return oauthInfo?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  };

  const getAvatarFallback = () => {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                FlowPilot
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {trialDaysLeft > 0 && !profile?.is_pro_user && (
              <Badge variant="outline" className="bg-yellow-50/80 backdrop-blur-sm text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800">
                {trialDaysLeft} days left in trial
              </Badge>
            )}
            
            {!profile?.is_pro_user && (
              <Link href="/upgrade">
                <Button size="sm" variant="gradient" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade
                </Button>
              </Link>
            )}
            
            <SessionStatus />
            
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={profile?.avatar_url}
                      alt={profile?.name || user?.email?.split('@')[0] || 'User avatar'}
                    />
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                      {getAvatarFallback()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-gray-200 dark:border-slate-700" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-gray-900 dark:text-white">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs leading-none text-gray-500 dark:text-gray-400">
                      {getUserEmail()}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="hover:bg-gray-50 dark:hover:bg-slate-700">
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="hover:bg-gray-50 dark:hover:bg-slate-700">
                  <Link href="/progress">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Progress
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={async () => {
                    try {
                      await signOut();
                      router.push('/');
                      toast.success('You\'ve been signed out. See you next time!');
                    } catch (error) {
                      toast.error('We couldn\'t sign you out. Please try again.');
                      console.error('Sign out error:', error);
                    }
                  }}
                  className="hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
