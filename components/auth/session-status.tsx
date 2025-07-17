"use client";

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw, Shield, Clock } from 'lucide-react';
import { sessionMonitor } from '@/lib/session-monitor';
import { useAuth } from '@/contexts/auth-context';

interface SessionHealth {
  isValid: boolean;
  expiresAt: number | null;
  timeUntilExpiry: number | null;
  refreshedAt: number;
}

export function SessionStatus() {
  const { user } = useAuth();
  const [sessionHealth, setSessionHealth] = useState<SessionHealth | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastCheck, setLastCheck] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    const checkHealth = async () => {
      const health = await sessionMonitor.getSessionHealth();
      setSessionHealth(health);
      setLastCheck(Date.now());
    };

    // Initial check
    checkHealth();

    // Set up periodic updates
    const interval = setInterval(checkHealth, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const success = await sessionMonitor.refreshSession();
      if (success) {
        const health = await sessionMonitor.getSessionHealth();
        setSessionHealth(health);
        setLastCheck(Date.now());
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTimeUntilExpiry = (timeMs: number): string => {
    const minutes = Math.floor(timeMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const getStatusColor = (health: SessionHealth): string => {
    if (!health.isValid) return 'destructive';
    if (!health.timeUntilExpiry) return 'secondary';
    
    const minutesLeft = health.timeUntilExpiry / (1000 * 60);
    if (minutesLeft <= 10) return 'destructive';
    if (minutesLeft <= 30) return 'warning';
    return 'success';
  };

  const getStatusText = (health: SessionHealth): string => {
    if (!health.isValid) return 'Invalid';
    if (!health.timeUntilExpiry) return 'Active';
    
    const minutesLeft = health.timeUntilExpiry / (1000 * 60);
    if (minutesLeft <= 10) return 'Expiring Soon';
    if (minutesLeft <= 30) return 'Warning';
    return 'Active';
  };

  if (!user || !sessionHealth) {
    return null;
  }

  const statusColor = getStatusColor(sessionHealth);
  const statusText = getStatusText(sessionHealth);
  const timeLeft = sessionHealth.timeUntilExpiry ? formatTimeUntilExpiry(sessionHealth.timeUntilExpiry) : null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={statusColor === 'success' ? 'default' : statusColor === 'warning' ? 'secondary' : 'destructive'}
              className="flex items-center gap-1 cursor-pointer"
            >
              <Shield className="w-3 h-3" />
              {statusText}
              {timeLeft && (
                <>
                  <Clock className="w-3 h-3 ml-1" />
                  {timeLeft}
                </>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs space-y-1">
              <div>Session Status: {sessionHealth.isValid ? 'Valid' : 'Invalid'}</div>
              {sessionHealth.expiresAt && (
                <div>
                  Expires: {new Date(sessionHealth.expiresAt).toLocaleTimeString()}
                </div>
              )}
              <div>
                Last checked: {new Date(lastCheck).toLocaleTimeString()}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>

        {sessionHealth.isValid && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                {isRefreshing ? 'Refreshing session...' : 'Refresh session'}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
} 