"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Zap, Settings, BarChart3, LogOut, Crown, Calendar } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export function DashboardHeader() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [trialDaysLeft] = useState(5); // TODO: Calculate from user data

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-teal-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                FlowPilot
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/dashboard" className="text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
                <Calendar className="w-4 h-4 inline mr-2" />
                Today
              </Link>
              <Link href="/progress" className="text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Progress
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {trialDaysLeft > 0 && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800">
                {trialDaysLeft} days left in trial
              </Badge>
            )}
            
            <Link href="/upgrade">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade
              </Button>
            </Link>
            
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture} 
                      alt={user?.user_metadata?.full_name || 'User'} 
                    />
                    <AvatarFallback>
                      {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || 'No email'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
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
                      toast.success('Successfully signed out');
                    } catch (error) {
                      toast.error('Failed to sign out');
                      console.error('Sign out error:', error);
                    }
                  }}
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