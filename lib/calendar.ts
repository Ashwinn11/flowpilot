import { supabase } from './supabase';
import { logger } from './logger';

export interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    responseStatus: string;
  }>;
  status: string;
  location?: string;
  transparency?: string; // 'transparent' means the event doesn't block time
  calendarId?: string; // Which calendar this event comes from
  calendarType?: string; // Type of calendar: 'primary', 'birthday', 'task', 'holiday', 'other'
  eventType?: 'event' | 'task' | 'birthday'; // New field to categorize the event type
  colorId?: string; // Google Calendar color ID
  recurringEventId?: string; // For recurring events
  // Task-specific fields (for Google Tasks API)
  taskId?: string;
  taskListId?: string;
  completed?: boolean;
  due?: string;
  notes?: string;
  parent?: string;
  position?: string;
}

export interface FreeTimeSlot {
  start: Date;
  end: Date;
  duration: number; // in minutes
}

export interface WorkHours {
  start: string; // HH:MM format
  end: string;   // HH:MM format
  days: number[]; // 0-6, Sunday = 0
}

export interface CalendarIntegration {
  id: string;
  provider: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  scopes?: string[];
}

export class CalendarService {
  private static readonly CALENDAR_SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/tasks'
  ];

  private static readonly GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
  private static readonly GOOGLE_TASKS_API_BASE = 'https://www.googleapis.com/tasks/v1';

  /**
   * Get or request calendar access for the current user
   */
  static async getCalendarAccess(): Promise<CalendarIntegration | null> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        logger.error('No authenticated user found', { error: userError?.message });
        return null;
      }

      // Check if we already have calendar integration
      const { data: integration, error: integrationError } = await supabase
        .from('calendar_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single();

      if (integrationError && integrationError.code !== 'PGRST116') {
        logger.error('Error checking calendar integration', { error: integrationError.message });
        return null;
      }

      if (integration) {
        // Check if token is still valid
        const expiresAt = integration.expires_at ? new Date(integration.expires_at) : null;
        if (expiresAt && expiresAt > new Date()) {
          return integration;
        }

        // Try to refresh the token
        const refreshedIntegration = await this.refreshCalendarToken(integration);
        if (refreshedIntegration) {
          return refreshedIntegration;
        }
      }

      // No valid integration found, need to initiate OAuth flow
      return null;
    } catch (error: any) {
      logger.error('Error getting calendar access', { error: error.message }, error);
      return null;
    }
  }

  /**
   * Initiate Google Calendar OAuth flow
   */
  static async initiateCalendarAuth(): Promise<{ success: boolean; authUrl?: string; error?: string }> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Build OAuth URL with calendar scopes
      const redirectUri = process.env.NEXT_PUBLIC_CALENDAR_REDIRECT_URI || 'http://localhost:3000/api/auth/calendar/callback';
      
      const params = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        redirect_uri: redirectUri,
        scope: this.CALENDAR_SCOPES.join(' '),
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent',
        state: user.id, // Pass user ID for callback verification
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

      return { success: true, authUrl };
    } catch (error: any) {
      logger.error('Error initiating calendar auth', { error: error.message }, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Refresh calendar access token via secure server-side API
   */
  private static async refreshCalendarToken(integration: CalendarIntegration): Promise<CalendarIntegration | null> {
    try {
      if (!integration.refresh_token) {
        logger.warn('No refresh token available for calendar integration');
        return null;
      }

      // Get the current user session token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        logger.error('No valid session for calendar token refresh');
        return null;
      }

      const response = await fetch('/api/auth/calendar/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        logger.error('Failed to refresh calendar token', { status: response.status });
        return null;
      }

      const data = await response.json();
      
      if (!data.success || !data.integration) {
        logger.error('Invalid response from calendar refresh API');
        return null;
      }

      logger.info('Calendar token refreshed successfully', { integrationId: integration.id });
      return data.integration as CalendarIntegration;
    } catch (error: any) {
      logger.error('Error refreshing calendar token', { error: error.message }, error);
      return null;
    }
  }

  /**
   * Fetch events from user's primary Google Calendar
   */
  static async fetchCalendarEvents(
    integration: CalendarIntegration,
    timeMin?: Date,
    timeMax?: Date
  ): Promise<CalendarEvent[]> {
    try {
      // Default to next 7 days if no time range specified
      if (!timeMin) {
        timeMin = new Date();
      }
      if (!timeMax) {
        timeMax = new Date();
        timeMax.setDate(timeMax.getDate() + 7);
      }

      const params = new URLSearchParams({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '250',
      });

      const response = await fetch(
        `${this.GOOGLE_CALENDAR_API_BASE}/calendars/primary/events?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${integration.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          logger.warn('Calendar token expired, attempting refresh');
          const refreshedIntegration = await this.refreshCalendarToken(integration);
          if (refreshedIntegration) {
            // Retry with refreshed token
            return this.fetchCalendarEvents(refreshedIntegration, timeMin, timeMax);
          }
        }
        throw new Error(`Failed to fetch calendar events: ${response.status}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error: any) {
      logger.error('Error fetching calendar events', { error: error.message }, error);
      throw error;
    }
  }

  /**
   * Fetch all available calendars for the user
   */
  static async fetchCalendarList(integration: CalendarIntegration): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.GOOGLE_CALENDAR_API_BASE}/users/me/calendarList`,
        {
          headers: {
            Authorization: `Bearer ${integration.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          logger.warn('Calendar token expired, attempting refresh');
          const refreshedIntegration = await this.refreshCalendarToken(integration);
          if (refreshedIntegration) {
            return this.fetchCalendarList(refreshedIntegration);
          }
        }
        throw new Error(`Failed to fetch calendar list: ${response.status}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error: any) {
      logger.error('Error fetching calendar list', { error: error.message }, error);
      throw error;
    }
  }

  /**
   * Fetch events from a specific calendar
   */
  static async fetchEventsFromCalendar(
    integration: CalendarIntegration,
    calendarId: string,
    timeMin?: Date,
    timeMax?: Date
  ): Promise<CalendarEvent[]> {
    try {
      // Default to next 7 days if no time range specified
      if (!timeMin) {
        timeMin = new Date();
      }
      if (!timeMax) {
        timeMax = new Date();
        timeMax.setDate(timeMax.getDate() + 7);
      }

      const params = new URLSearchParams({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '250',
      });

      const encodedCalendarId = encodeURIComponent(calendarId);
      const response = await fetch(
        `${this.GOOGLE_CALENDAR_API_BASE}/calendars/${encodedCalendarId}/events?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${integration.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          logger.warn('Calendar token expired, attempting refresh');
          const refreshedIntegration = await this.refreshCalendarToken(integration);
          if (refreshedIntegration) {
            return this.fetchEventsFromCalendar(refreshedIntegration, calendarId, timeMin, timeMax);
          }
        }
        // Don't throw for individual calendar failures, just log and return empty
        logger.warn(`Failed to fetch events from calendar ${calendarId}: ${response.status}`);
        return [];
      }

      const data = await response.json();
      const events = data.items || [];
      
      // Add calendar info to each event
      return events.map((event: any) => ({
        ...event,
        calendarId,
        calendarType: this.getCalendarType(calendarId)
      }));
    } catch (error: any) {
      logger.error(`Error fetching events from calendar ${calendarId}`, { error: error.message }, error);
      return [];
    }
  }

  /**
   * Enhanced method to fetch all calendar data with proper categorization
   */
  static async fetchAllCalendarData(
    integration: CalendarIntegration,
    timeMin?: Date,
    timeMax?: Date
  ): Promise<{
    events: CalendarEvent[];
    tasks: CalendarEvent[];
    birthdays: CalendarEvent[];
    allItems: CalendarEvent[];
  }> {
    try {
      logger.info('Fetching all calendar data including events, tasks, and birthdays');
      
      // Get list of all calendars
      const calendars = await this.fetchCalendarList(integration);
      logger.info(`Found ${calendars.length} calendars`, { 
        calendars: calendars.map(cal => ({ id: cal.id, summary: cal.summary, selected: cal.selected }))
      });

      // Filter to only selected/accessible calendars
      const activeCalendars = calendars.filter(cal => 
        cal.accessRole && 
        ['reader', 'writer', 'owner'].includes(cal.accessRole) &&
        cal.selected !== false // Include if selected is true or undefined
      );

      logger.info(`Fetching data from ${activeCalendars.length} active calendars`);

      // Fetch events from all active calendars in parallel
      const eventPromises = activeCalendars.map(calendar => 
        this.fetchEventsFromCalendar(integration, calendar.id, timeMin, timeMax)
      );

      const eventArrays = await Promise.all(eventPromises);
      
      // Flatten and combine all events
      const allEvents = eventArrays.flat();
      
      // Categorize events by type
      const categorized = this.categorizeCalendarItems(allEvents, activeCalendars);
      
      // Fetch Google Tasks using Tasks API
      const googleTasks = await this.fetchGoogleTasks(integration, timeMin, timeMax);
      
      // Combine calendar tasks with Google Tasks
      const allTasks = [...categorized.tasks, ...googleTasks];
      
      logger.info(`Fetched and categorized calendar data`, {
        totalEvents: allEvents.length,
        events: categorized.events.length,
        calendarTasks: categorized.tasks.length,
        googleTasks: googleTasks.length,
        totalTasks: allTasks.length,
        birthdays: categorized.birthdays.length,
        breakdown: activeCalendars.map((calendar, index) => ({
          calendar: calendar.summary,
          eventCount: eventArrays[index].length,
          type: this.getCalendarType(calendar.id)
        }))
      });

      return {
        events: categorized.events,
        tasks: allTasks,
        birthdays: categorized.birthdays,
        allItems: [...categorized.events, ...allTasks, ...categorized.birthdays]
      };
    } catch (error: any) {
      logger.error('Error fetching all calendar data', { error: error.message }, error);
      throw error;
    }
  }

  /**
   * Categorize calendar items into events, tasks, and birthdays
   */
  private static categorizeCalendarItems(
    events: CalendarEvent[],
    calendars: any[]
  ): {
    events: CalendarEvent[];
    tasks: CalendarEvent[];
    birthdays: CalendarEvent[];
    allItems: CalendarEvent[];
  } {
    const categorized = {
      events: [] as CalendarEvent[],
      tasks: [] as CalendarEvent[],
      birthdays: [] as CalendarEvent[],
      allItems: [] as CalendarEvent[]
    };

    // Create a map of calendar types for quick lookup
    const calendarTypeMap = new Map<string, string>();
    calendars.forEach(cal => {
      calendarTypeMap.set(cal.id, this.getCalendarType(cal.id));
    });

    events.forEach(event => {
      // Add calendar type to event
      const calendarType = calendarTypeMap.get(event.calendarId || '') || 'other';
      event.calendarType = calendarType;

      // Categorize based on calendar type and event properties
      let eventType: 'event' | 'task' | 'birthday' = 'event';
      
      if (calendarType === 'birthday') {
        eventType = 'birthday';
      } else if (calendarType === 'task' || event.summary?.toLowerCase().includes('task')) {
        eventType = 'task';
      } else if (event.transparency === 'transparent') {
        // Transparent events are often tasks or reminders
        eventType = 'task';
      } else {
        eventType = 'event';
      }

      event.eventType = eventType;

      // Add to appropriate category
      switch (eventType) {
        case 'birthday':
          categorized.birthdays.push(event);
          break;
        case 'task':
          categorized.tasks.push(event);
          break;
        case 'event':
        default:
          categorized.events.push(event);
          break;
      }

      categorized.allItems.push(event);
    });

    return categorized;
  }

  /**
   * Enhanced calendar type detection
   */
  private static getCalendarType(calendarId: string): string {
    if (calendarId === 'primary') return 'primary';
    if (calendarId.includes('#contacts@group.v.calendar.google.com')) return 'birthday';
    if (calendarId.includes('tasks') || calendarId.includes('task')) return 'task';
    if (calendarId.includes('holiday') || calendarId.includes('holidays')) return 'holiday';
    if (calendarId.includes('birthday') || calendarId.includes('birthdays')) return 'birthday';
    if (calendarId.includes('reminder') || calendarId.includes('reminders')) return 'task';
    return 'other';
  }

  /**
   * Detect free time slots based on calendar events and work hours
   */
  static findFreeTimeSlots(
    events: CalendarEvent[],
    workHours: WorkHours,
    date: Date,
    minSlotDuration: number = 30 // minimum slot duration in minutes
  ): FreeTimeSlot[] {
    try {
      const freeSlots: FreeTimeSlot[] = [];
      
      // Check if this date is a working day
      const dayOfWeek = date.getDay();
      if (!workHours.days.includes(dayOfWeek)) {
        return freeSlots; // No work on this day
      }

      // Create work day boundaries
      const workStart = new Date(date);
      const [startHour, startMinute] = workHours.start.split(':').map(Number);
      workStart.setHours(startHour, startMinute, 0, 0);

      const workEnd = new Date(date);
      const [endHour, endMinute] = workHours.end.split(':').map(Number);
      workEnd.setHours(endHour, endMinute, 0, 0);

      // Filter and sort events for this day
      const dayEvents = events
        .filter(event => {
          const eventStart = new Date(event.start.dateTime || event.start.date || '');
          const eventDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
          const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          return eventDate.getTime() === targetDate.getTime();
        })
        .filter(event => event.status !== 'cancelled' && event.transparency !== 'transparent')
        .sort((a, b) => {
          const aStart = new Date(a.start.dateTime || a.start.date || '');
          const bStart = new Date(b.start.dateTime || b.start.date || '');
          return aStart.getTime() - bStart.getTime();
        });

      let currentTime = workStart;

      // Check for free time between events
      for (const event of dayEvents) {
        const eventStart = new Date(event.start.dateTime || event.start.date || '');
        const eventEnd = new Date(event.end.dateTime || event.end.date || '');

        // Ensure event times are within work hours
        const clampedEventStart = new Date(Math.max(eventStart.getTime(), workStart.getTime()));
        const clampedEventEnd = new Date(Math.min(eventEnd.getTime(), workEnd.getTime()));

        // Check for free time before this event
        if (currentTime < clampedEventStart) {
          const duration = (clampedEventStart.getTime() - currentTime.getTime()) / (1000 * 60);
          if (duration >= minSlotDuration) {
            freeSlots.push({
              start: new Date(currentTime),
              end: new Date(clampedEventStart),
              duration: Math.floor(duration),
            });
          }
        }

        // Move current time to after this event
        currentTime = new Date(Math.max(currentTime.getTime(), clampedEventEnd.getTime()));
      }

      // Check for free time after the last event until end of work day
      if (currentTime < workEnd) {
        const duration = (workEnd.getTime() - currentTime.getTime()) / (1000 * 60);
        if (duration >= minSlotDuration) {
          freeSlots.push({
            start: new Date(currentTime),
            end: new Date(workEnd),
            duration: Math.floor(duration),
          });
        }
      }

      return freeSlots;
    } catch (error: any) {
      logger.error('Error finding free time slots', { error: error.message }, error);
      return [];
    }
  }

  /**
   * Get free time slots for the next N days
   */
  static async getFreeTimeForPeriod(
    integration: CalendarIntegration,
    workHours: WorkHours,
    days: number = 7,
    minSlotDuration: number = 30
  ): Promise<{ date: Date; freeSlots: FreeTimeSlot[] }[]> {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      // Fetch events for the period
      const events = await this.fetchCalendarEvents(integration, startDate, endDate);

      // Calculate free time for each day
      const result: { date: Date; freeSlots: FreeTimeSlot[] }[] = [];
      
      for (let i = 0; i < days; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + i);
        
        const freeSlots = this.findFreeTimeSlots(events, workHours, currentDate, minSlotDuration);
        
        result.push({
          date: new Date(currentDate),
          freeSlots,
        });
      }

      return result;
    } catch (error: any) {
      logger.error('Error getting free time for period', { error: error.message }, error);
      throw error;
    }
  }

  /**
   * Fetch Google Tasks using the Tasks API
   */
  static async fetchGoogleTasks(
    integration: CalendarIntegration,
    timeMin?: Date,
    timeMax?: Date
  ): Promise<CalendarEvent[]> {
    try {
      logger.info('Fetching Google Tasks using Tasks API');
      
      // First, get all task lists
      const taskLists = await this.fetchTaskLists(integration);
      logger.info(`Found ${taskLists.length} task lists`);

      if (taskLists.length === 0) {
        return [];
      }

      // Fetch tasks from all lists in parallel
      const taskPromises = taskLists.map(taskList => 
        this.fetchTasksFromList(integration, taskList.id, timeMin, timeMax)
      );

      const taskArrays = await Promise.all(taskPromises);
      const allTasks = taskArrays.flat();

      // Convert Google Tasks to CalendarEvent format for consistency
      const calendarEvents = allTasks.map(task => this.convertTaskToCalendarEvent(task));

      logger.info(`Fetched ${calendarEvents.length} Google Tasks`);
      return calendarEvents;
    } catch (error: any) {
      logger.error('Error fetching Google Tasks', { error: error.message }, error);
      return [];
    }
  }

  /**
   * Fetch all task lists for the user
   */
  private static async fetchTaskLists(integration: CalendarIntegration): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.GOOGLE_TASKS_API_BASE}/users/@me/lists`,
        {
          headers: {
            Authorization: `Bearer ${integration.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          logger.warn('Tasks API token expired, attempting refresh');
          const refreshedIntegration = await this.refreshCalendarToken(integration);
          if (refreshedIntegration) {
            return this.fetchTaskLists(refreshedIntegration);
          }
        }
        logger.warn(`Failed to fetch task lists: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.items || [];
    } catch (error: any) {
      logger.error('Error fetching task lists', { error: error.message }, error);
      return [];
    }
  }

  /**
   * Fetch tasks from a specific task list
   */
  private static async fetchTasksFromList(
    integration: CalendarIntegration,
    taskListId: string,
    timeMin?: Date,
    timeMax?: Date
  ): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        maxResults: '100',
        showCompleted: 'false', // Only show active tasks
      });

      // Add date filtering if provided
      if (timeMin) {
        params.append('dueMin', timeMin.toISOString());
      }
      if (timeMax) {
        params.append('dueMax', timeMax.toISOString());
      }

      const response = await fetch(
        `${this.GOOGLE_TASKS_API_BASE}/lists/${taskListId}/tasks?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${integration.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          logger.warn('Tasks API token expired, attempting refresh');
          const refreshedIntegration = await this.refreshCalendarToken(integration);
          if (refreshedIntegration) {
            return this.fetchTasksFromList(refreshedIntegration, taskListId, timeMin, timeMax);
          }
        }
        logger.warn(`Failed to fetch tasks from list ${taskListId}: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.items || [];
    } catch (error: any) {
      logger.error(`Error fetching tasks from list ${taskListId}`, { error: error.message }, error);
      return [];
    }
  }

  /**
   * Convert Google Task to CalendarEvent format
   */
  private static convertTaskToCalendarEvent(task: any): CalendarEvent {
    const dueDate = task.due ? new Date(task.due) : new Date();
    const completedDate = task.completed ? new Date(task.completed) : null;

    return {
      id: task.id,
      summary: task.title,
      description: task.notes || '',
      start: {
        dateTime: dueDate.toISOString(),
        date: dueDate.toISOString().split('T')[0],
        timeZone: 'UTC'
      },
      end: {
        dateTime: dueDate.toISOString(),
        date: dueDate.toISOString().split('T')[0],
        timeZone: 'UTC'
      },
      status: task.status || 'needsAction',
      transparency: 'transparent', // Tasks don't block time
      calendarId: `tasks_${task.listId || 'default'}`,
      calendarType: 'task',
      eventType: 'task',
      // Additional task-specific fields
      taskId: task.id,
      taskListId: task.listId,
      completed: task.completed ? true : false,
      due: task.due,
      notes: task.notes,
      parent: task.parent,
      position: task.position
    };
  }

} 