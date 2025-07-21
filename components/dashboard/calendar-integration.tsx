"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { CalendarService, FreeTimeSlot, WorkHours, CalendarEvent } from '@/lib/calendar';
import type { CalendarIntegration } from '@/lib/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Calendar, Clock, ExternalLink, RefreshCw, AlertCircle, CheckCircle, Users, Target, Gift, MapPin, Video, Phone, Coffee, Briefcase, Heart, Star, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface CalendarIntegrationProps {
  userWorkHours?: WorkHours;
  onFreeTimeSlotsUpdate?: (slots: { date: Date; freeSlots: FreeTimeSlot[] }[]) => void;
  onCalendarDataUpdate?: (data: {
    events: CalendarEvent[];
    tasks: CalendarEvent[];
    birthdays: CalendarEvent[];
  }) => void;
}

// Event type detection function
const getEventIcon = (event: CalendarEvent) => {
  const summary = event.summary?.toLowerCase() || '';
  
  if (summary.includes('meeting') || summary.includes('call') || summary.includes('zoom')) {
    return Video;
  }
  if (summary.includes('call') || summary.includes('phone')) {
    return Phone;
  }
  if (summary.includes('coffee') || summary.includes('lunch') || summary.includes('dinner')) {
    return Coffee;
  }
  if (summary.includes('work') || summary.includes('project') || summary.includes('task')) {
    return Briefcase;
  }
  if (summary.includes('birthday') || summary.includes('anniversary')) {
    return Heart;
  }
  if (summary.includes('important') || summary.includes('urgent')) {
    return Star;
  }
  
  return Calendar;
};

// Event priority detection
const getEventPriority = (event: CalendarEvent) => {
  const summary = event.summary?.toLowerCase() || '';
  
  if (summary.includes('urgent') || summary.includes('important') || summary.includes('critical')) {
    return 'high';
  }
  if (summary.includes('optional') || summary.includes('maybe')) {
    return 'low';
  }
  return 'medium';
};

// Enhanced time formatting
const formatEventTime = (event: CalendarEvent) => {
  const startDate = new Date(event.start.dateTime || event.start.date || '');
  const endDate = new Date(event.end.dateTime || event.end.date || '');
  
  const isAllDay = !event.start.dateTime;
  
  if (isAllDay) {
    return 'All day';
  }
  
  const startTime = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  
  const endTime = endDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  
  return `${startTime} - ${endTime}`;
};

// Enhanced date formatting
const formatEventDate = (event: CalendarEvent) => {
  const date = new Date(event.start.dateTime || event.start.date || '');
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }
};

export function CalendarIntegration({ userWorkHours, onFreeTimeSlotsUpdate, onCalendarDataUpdate }: CalendarIntegrationProps) {
  const [integration, setIntegration] = useState<CalendarIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [freeTimeData, setFreeTimeData] = useState<{ date: Date; freeSlots: FreeTimeSlot[] }[]>([]);
  const [calendarData, setCalendarData] = useState<{
    events: CalendarEvent[];
    tasks: CalendarEvent[];
    birthdays: CalendarEvent[];
  }>({ events: [], tasks: [], birthdays: [] });
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'free-time' | 'events' | 'tasks' | 'birthdays'>('free-time');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Default work hours if not provided
  const defaultWorkHours: WorkHours = {
    start: '09:00',
    end: '17:00',
    days: [1, 2, 3, 4, 5], // Monday to Friday
  };

  const workHours = userWorkHours || defaultWorkHours;

  // Check for OAuth callback results
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const calendarSuccess = urlParams.get('calendar_success');
    const calendarError = urlParams.get('calendar_error');

    if (calendarSuccess) {
      toast.success("Calendar Connected! Your Google Calendar has been successfully connected.");
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      // Refresh integration status
      checkIntegrationStatus();
    } else if (calendarError) {
      const errorMessages: Record<string, string> = {
        invalid_callback: 'Invalid authorization callback',
        token_exchange_failed: 'Failed to exchange authorization code',
        no_access_token: 'No access token received',
        storage_failed: 'Failed to store calendar integration',
        unexpected_error: 'An unexpected error occurred',
      };
      
      const errorMessage = errorMessages[calendarError] || 'Calendar connection failed';
      toast.error(`Calendar Connection Failed: ${errorMessage}`);
      setError(errorMessage);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [toast]);

  // Check integration status on mount
  const checkIntegrationStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const currentIntegration = await CalendarService.getCalendarAccess();
      setIntegration(currentIntegration);
      
      if (currentIntegration) {
        await loadCalendarData(currentIntegration);
      }
    } catch (error: any) {
      logger.error('Error checking calendar integration status', { error: error.message });
      setError('Failed to check calendar integration status');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all calendar data
  const loadCalendarData = useCallback(async (calendarIntegration: CalendarIntegration) => {
    try {
      // Load free time data
      const freeTimeResults = await CalendarService.getFreeTimeForPeriod(
        calendarIntegration,
        workHours,
        7, // Next 7 days
        30  // Minimum 30-minute slots
      );
      
      setFreeTimeData(freeTimeResults);
      onFreeTimeSlotsUpdate?.(freeTimeResults);

      // Load all calendar data (events, tasks, birthdays)
      const allCalendarData = await CalendarService.fetchAllCalendarData(
        calendarIntegration,
        new Date(),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
      );

      setCalendarData({
        events: allCalendarData.events,
        tasks: allCalendarData.tasks,
        birthdays: allCalendarData.birthdays,
      });

      onCalendarDataUpdate?.({
        events: allCalendarData.events,
        tasks: allCalendarData.tasks,
        birthdays: allCalendarData.birthdays,
      });

      logger.info('Calendar data loaded successfully', {
        events: allCalendarData.events.length,
        tasks: allCalendarData.tasks.length,
        birthdays: allCalendarData.birthdays.length,
      });
    } catch (error: any) {
      logger.error('Error loading calendar data', { error: error.message });
      setError('Failed to load calendar data');
    }
  }, [workHours, onFreeTimeSlotsUpdate, onCalendarDataUpdate]);

  // Initiate calendar connection
  const connectCalendar = useCallback(async () => {
    try {
      setConnecting(true);
      setError(null);
      
      const { success, authUrl, error: authError } = await CalendarService.initiateCalendarAuth();
      
      if (success && authUrl) {
        // Redirect to Google OAuth
        window.location.href = authUrl;
      } else {
        throw new Error(authError || 'Failed to initiate calendar authorization');
      }
         } catch (error: any) {
       logger.error('Error connecting calendar', { error: error.message });
       setError(error.message);
       toast.error(`Connection Failed: ${error.message}`);
     } finally {
       setConnecting(false);
     }
  }, [toast]);

  // Refresh calendar data
  const refreshCalendarData = useCallback(async () => {
    if (!integration) return;
    
    try {
             setRefreshing(true);
       setError(null);
       await loadCalendarData(integration);
       toast.success("Calendar Refreshed: Your calendar data has been updated.");
     } catch (error: any) {
       logger.error('Error refreshing calendar data', { error: error.message });
       setError('Failed to refresh calendar data');
       toast.error("Refresh Failed: Failed to refresh calendar data");
     } finally {
       setRefreshing(false);
     }
  }, [integration, toast, loadCalendarData]);

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Filter events by priority
  const getFilteredEvents = () => {
    if (filterPriority === 'all') {
      return calendarData.events;
    }
    return calendarData.events.filter(event => getEventPriority(event) === filterPriority);
  };

  useEffect(() => {
    checkIntegrationStatus();
  }, [checkIntegrationStatus]);

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner className="h-8 w-8" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendar Integration
          {integration && (
            <Badge variant="secondary" className="ml-auto bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {integration 
            ? "Your Google Calendar is connected and syncing free time slots."
            : "Connect your Google Calendar to automatically detect free time for task scheduling."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!integration ? (
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Connect your Google Calendar to enable smart scheduling
            </p>
            <Button
              onClick={connectCalendar}
              disabled={connecting}
              className="min-w-[160px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              {connecting ? (
                <>
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect Google Calendar
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Integration Status */}
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Google Calendar Connected
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshCalendarData}
                disabled={refreshing}
                className="border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30"
              >
                {refreshing ? (
                  <LoadingSpinner className="h-3 w-3 mr-1" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                Refresh
              </Button>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('free-time')}
                className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors ${
                  activeTab === 'free-time'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-b-2 border-blue-700 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Clock className="h-3 w-3 inline mr-1" />
                Free Time
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors ${
                  activeTab === 'events'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-b-2 border-blue-700 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Calendar className="h-3 w-3 inline mr-1" />
                Events ({calendarData.events.length})
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors ${
                  activeTab === 'tasks'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-b-2 border-blue-700 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Target className="h-3 w-3 inline mr-1" />
                Tasks ({calendarData.tasks.length})
              </button>
              <button
                onClick={() => setActiveTab('birthdays')}
                className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors ${
                  activeTab === 'birthdays'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-b-2 border-blue-700 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Gift className="h-3 w-3 inline mr-1" />
                Birthdays ({calendarData.birthdays.length})
              </button>
            </div>

            {/* Priority Filter for Events */}
            {activeTab === 'events' && calendarData.events.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">Filter:</span>
                <div className="flex gap-1">
                  {(['all', 'high', 'medium', 'low'] as const).map((priority) => (
                    <button
                      key={priority}
                      onClick={() => setFilterPriority(priority)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        filterPriority === priority
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                      }`}
                    >
                      {priority === 'all' ? 'All' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab Content */}
            <div className="max-h-64 overflow-y-auto">
              {activeTab === 'free-time' && (
                <div>
                  {freeTimeData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No free time slots found for the selected period.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {freeTimeData.map((dayData, dayIndex) => (
                        dayData.freeSlots.length > 0 && (
                          <div key={dayIndex} className="border rounded-lg p-3 bg-white dark:bg-slate-800 shadow-sm">
                            <h5 className="font-medium text-sm mb-2 text-gray-900 dark:text-gray-100">
                              {formatDate(dayData.date)}
                            </h5>
                            <div className="grid gap-1">
                              {dayData.freeSlots.map((slot, slotIndex) => (
                                <div
                                  key={slotIndex}
                                  className="flex items-center justify-between text-xs bg-blue-50 dark:bg-blue-900/20 rounded px-2 py-1 border border-blue-200 dark:border-blue-800"
                                >
                                  <span className="text-blue-700 dark:text-blue-300">
                                    {formatTime(slot.start)} - {formatTime(slot.end)}
                                  </span>
                                  <Badge variant="outline" className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                    {slot.duration}m
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'events' && (
                <div>
                  {getFilteredEvents().length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {filterPriority === 'all' ? 'No events found for the selected period.' : `No ${filterPriority} priority events found.`}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {getFilteredEvents().slice(0, 10).map((event, index) => {
                        const EventIcon = getEventIcon(event);
                        const priority = getEventPriority(event);
                        const priorityColors = {
                          high: 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
                          medium: 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
                          low: 'bg-gray-100 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                        };
                        
                        return (
                          <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${priorityColors[priority]} shadow-sm hover:shadow-md transition-shadow`}>
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <EventIcon className="h-4 w-4 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{event.summary}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  <span>{formatEventDate(event)}</span>
                                  <span>•</span>
                                  <span>{formatEventTime(event)}</span>
                                </div>
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ml-2 ${
                                priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                                priority === 'medium' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                                'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {priority.charAt(0).toUpperCase() + priority.slice(1)}
                            </Badge>
                          </div>
                        );
                      })}
                      {getFilteredEvents().length > 10 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          +{getFilteredEvents().length - 10} more events
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tasks' && (
                <div>
                  {calendarData.tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No tasks found for the selected period.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {calendarData.tasks.slice(0, 10).map((task, index) => {
                        const TaskIcon = getEventIcon(task);
                        const priority = getEventPriority(task);
                        const priorityColors = {
                          high: 'bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300',
                          medium: 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300',
                          low: 'bg-gray-100 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                        };
                        
                        return (
                          <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${priorityColors[priority]} shadow-sm hover:shadow-md transition-shadow`}>
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <TaskIcon className="h-4 w-4 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{task.summary}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  <span>{formatEventDate(task)}</span>
                                  <span>•</span>
                                  <span>{formatEventTime(task)}</span>
                                </div>
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ml-2 ${
                                priority === 'high' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                                priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                                'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {priority.charAt(0).toUpperCase() + priority.slice(1)}
                            </Badge>
                          </div>
                        );
                      })}
                      {calendarData.tasks.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          +{calendarData.tasks.length - 10} more tasks
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'birthdays' && (
                <div>
                  {calendarData.birthdays.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No birthdays found for the selected period.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {calendarData.birthdays.slice(0, 10).map((birthday, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Heart className="h-4 w-4 text-pink-600 dark:text-pink-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate text-pink-700 dark:text-pink-300">{birthday.summary}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-1">
                                <span>{formatEventDate(birthday)}</span>
                                <span>•</span>
                                <span>{formatEventTime(birthday)}</span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs ml-2 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300">
                            Birthday
                          </Badge>
                        </div>
                      ))}
                      {calendarData.birthdays.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          +{calendarData.birthdays.length - 10} more birthdays
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 