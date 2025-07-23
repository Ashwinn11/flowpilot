"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskCard } from "./task-card";
import { Calendar, Clock, ExternalLink, RefreshCw, Gift, CheckSquare, Globe } from "lucide-react";
import { CalendarService, CalendarEvent } from "@/lib/calendar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";

import type { Database } from "@/lib/supabase";
import React from "react"; // Added for React.createElement

type Task = Database['public']['Tables']['tasks']['Row'];

interface TimelineViewProps {
  tasks: (Task | CalendarEvent)[];
  onComplete?: (task: any) => void;
  onSkip?: (task: any) => void;
  onUpdate?: (task: any, updates: any) => void;
  onDelete?: (task: any) => void;
  onAddToCalendar?: (task: any) => void;
}

interface TimelineItem {
  id: string;
  type: 'task' | 'event';
  title: string;
  time?: Date;
  duration?: number;
  task?: Task;
  event?: CalendarEvent;
}

export function TimelineView({ tasks, onComplete, onSkip, onUpdate, onDelete, onAddToCalendar }: TimelineViewProps) {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Fetch calendar events
  const fetchCalendarEvents = async (showToast = false) => {
    try {
      console.log('🔍 [Timeline Debug] Starting calendar fetch...');
      const integration = await CalendarService.getCalendarAccess();
      console.log('🔍 [Timeline Debug] Integration:', integration ? 'Found' : 'Not found');
      
      if (integration) {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        console.log('🔍 [Timeline Debug] Fetching events from:', today.toISOString(), 'to:', tomorrow.toISOString());
        
        const calendarData = await CalendarService.fetchAllCalendarData(integration, today, tomorrow);
        const events = calendarData.allItems;
        console.log('🔍 [Timeline Debug] Fetched events:', events.length, events);
        
        setCalendarEvents(events);
        
        // Breakdown by calendar type
        const breakdown = {
          events: calendarData.events.length,
          tasks: calendarData.tasks.length,
          birthdays: calendarData.birthdays.length,
          total: events.length
        };
        
        setDebugInfo({
          integration: !!integration,
          eventCount: events.length,
          timeRange: { from: today.toISOString(), to: tomorrow.toISOString() },
          breakdown,
          events: events.map(e => ({
            id: e.id,
            summary: e.summary,
            start: e.start,
            end: e.end,
            calendarType: e.calendarType,
            calendarId: e.calendarId
          }))
        });
        
        if (showToast) {
          toast.success(`Refreshed! Found ${events.length} calendar items (${breakdown.events} events, ${breakdown.birthdays} birthdays, ${breakdown.tasks} tasks)`);
        }
      } else {
        console.log('🔍 [Timeline Debug] No calendar integration found');
        setDebugInfo({
          integration: false,
          eventCount: 0,
          error: 'No calendar integration'
        });
        if (showToast) {
          toast.error('No calendar integration found. Please connect your calendar first.');
        }
      }
    } catch (error) {
      console.error('🔍 [Timeline Debug] Error fetching calendar events:', error);
      setDebugInfo({
        integration: null,
        eventCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      if (showToast) {
        toast.error('Failed to fetch calendar events: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Get event styling based on calendar type
  const getEventStyling = (calendarType: string) => {
    switch (calendarType) {
      case 'birthday':
        return {
          borderColor: 'border-pink-200 dark:border-pink-800',
          bgColor: 'bg-pink-50/50 dark:bg-pink-900/10',
          iconColor: 'text-pink-600',
          badgeColor: 'bg-pink-100 text-pink-700',
          icon: Gift,
          label: 'Birthday'
        };
      case 'task':
        return {
          borderColor: 'border-green-200 dark:border-green-800',
          bgColor: 'bg-green-50/50 dark:bg-green-900/10',
          iconColor: 'text-green-600',
          badgeColor: 'bg-green-100 text-green-700',
          icon: CheckSquare,
          label: 'Task'
        };
      case 'holiday':
        return {
          borderColor: 'border-orange-200 dark:border-orange-800',
          bgColor: 'bg-orange-50/50 dark:bg-orange-900/10',
          iconColor: 'text-orange-600',
          badgeColor: 'bg-orange-100 text-orange-700',
          icon: Globe,
          label: 'Holiday'
        };
      default: // primary and other
        return {
          borderColor: 'border-purple-200 dark:border-purple-800',
          bgColor: 'bg-purple-50/50 dark:bg-purple-900/10',
          iconColor: 'text-purple-600',
          badgeColor: 'bg-purple-100 text-purple-700',
          icon: Calendar,
          label: 'Event'
        };
    }
  };

  // Initial load
  useEffect(() => {
    fetchCalendarEvents();
  }, []);

  // Manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchCalendarEvents(true);
  };

  // Combine tasks and calendar events into timeline items
  const createTimelineItems = (): TimelineItem[] => {
    const items: TimelineItem[] = [];

    // Add tasks to timeline
    tasks.forEach(item => {
      if ('title' in item && 'scheduled_at' in item) { // Check if it's a Task
        items.push({
          id: `task-${item.id}`,
          type: 'task',
          title: item.title,
          time: item.scheduled_at ? new Date(item.scheduled_at) : undefined,
          duration: item.duration,
          task: item,
        });
      } else if ('summary' in item && 'start' in item) { // Check if it's a CalendarEvent
        const startTime = item.start.dateTime ? new Date(item.start.dateTime) : undefined;
        const endTime = item.end.dateTime ? new Date(item.end.dateTime) : undefined;
        const duration = startTime && endTime 
          ? Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
          : undefined;

        items.push({
          id: `event-${item.id}`,
          type: 'event',
          title: item.summary || 'Untitled Event',
          time: startTime,
          duration,
          event: item,
        });
      }
    });

    // Sort by time, putting items without time at the end
    return items.sort((a, b) => {
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.getTime() - b.time.getTime();
    });
  };

  const timelineItems = createTimelineItems();

  // Debug log
  console.log('timelineItems', timelineItems);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  try {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                Task Section
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  title="Refresh calendar events"
                  aria-label="Refresh calendar events"
                >
                  {refreshing ? (
                    <LoadingSpinner className="h-3 w-3 mr-1" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  Refresh
                </Button>
                {debugInfo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('🔍 [Timeline Debug Info]', debugInfo);
                      alert(JSON.stringify(debugInfo, null, 2));
                    }}
                    title="View debug information"
                    aria-label="View debug information"
                  >
                    Debug Info
                  </Button>
                )}
              </div>
            </CardTitle>
            {debugInfo && (
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Calendar: {debugInfo.integration ? '✅ Connected' : '❌ Not connected'} | 
                Events: {debugInfo.eventCount} | 
                Tasks: {tasks.length}
                {debugInfo.breakdown && (
                  <span> | Types: {Object.entries(debugInfo.breakdown).map(([type, count]: [string, any]) => `${count} ${type}`).join(', ')}</span>
                )}
                {debugInfo.error && <span className="text-red-500"> | Error: {debugInfo.error}</span>}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner className="h-6 w-6" />
                <span className="ml-2 text-sm text-slate-600">Loading calendar events...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {timelineItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-3"
                  >
                    {/* Time indicator */}
                    <div className="flex-shrink-0 w-16 text-right">
                      {item.time ? (
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          {formatTime(item.time)}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400">
                          Not scheduled
                        </div>
                      )}
                    </div>
                    {/* Use TaskCard for all items */}
                    <div className="flex-1">
                      <TaskCard
                        task={item.task || item.event}
                        source={item.type === 'task' ? 'manual' : (item.event?.eventType === 'task' ? 'calendar_task' : 'calendar_event')}
                        onComplete={item.type === 'task' ? () => onComplete && onComplete(item.task) : undefined}
                        onSkip={item.type === 'task' ? () => onSkip && onSkip(item.task) : undefined}
                        onUpdate={item.type === 'task' ? (updates => onUpdate && onUpdate(item.task, updates)) : undefined}
                        onDelete={item.type === 'task' ? () => onDelete && onDelete(item.task) : undefined}
                        onAddToCalendar={item.type === 'task' && onAddToCalendar ? () => onAddToCalendar(item.task) : undefined}
                      />
                    </div>
                  </motion.div>
                ))}
                
                {timelineItems.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">
                      No tasks, events, birthdays, or calendar items for today
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Try refreshing or check if your calendar is connected. We fetch from all your calendars including birthdays and tasks.
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  } catch (err) {
    return (
      <div className="p-4 bg-red-100 text-red-800 rounded">
        Error rendering timeline: {err instanceof Error ? err.message : String(err)}
      </div>
    );
  }
}