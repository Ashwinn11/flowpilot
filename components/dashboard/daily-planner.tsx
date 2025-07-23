"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskCard } from "@/components/dashboard/task-card";
import { AddTaskModal } from "@/components/dashboard/add-task-modal";
import { TimelineView } from "@/components/dashboard/timeline-view";
import { Plus, Target, Clock, CheckCircle, Calendar, Gift, MapPin } from "lucide-react";
import { EndOfDayModal } from "@/components/dashboard/end-of-day-modal";
import { useAuth } from "@/contexts/auth-context";
import { TaskService } from "@/lib/tasks";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import type { Database } from "@/lib/supabase";
import type { CalendarEvent } from "@/lib/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from '@/lib/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];

interface DailyPlannerProps {
  calendarData?: {
    events: CalendarEvent[];
    tasks: CalendarEvent[];
    birthdays: CalendarEvent[];
  };
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

// Helper to check if a date is today
function isToday(dateStr: string | undefined) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

// Helper to find a manual task by calendar event/task ID
function findManualTaskByCalendarId(calendarId: string, type: 'calendar_event' | 'calendar_task', tasks: any[]) {
  return tasks.find(t =>
    (type === 'calendar_event' && t.calendar_event_id === calendarId) ||
    (type === 'calendar_task' && t.calendar_task_id === calendarId)
  );
}

// Helper to create or update a manual task for a calendar item
async function upsertManualTaskForCalendarItem({
  calendarItem,
  type,
  status,
  userId,
  TaskService,
  setTasks,
  tasks
}: {
  calendarItem: any,
  type: 'calendar_event' | 'calendar_task',
  status: string,
  userId: string,
  TaskService: any,
  setTasks: any,
  tasks: any[]
}) {
  let manualTask = findManualTaskByCalendarId(calendarItem.id, type, tasks);
  if (manualTask) {
    // Update status
    const updatedTask = await TaskService.updateTask(manualTask.id, { status });
    setTasks((prev: any[]) => prev.map(t => t.id === manualTask.id ? updatedTask : t));
    return updatedTask;
  } else {
    // Create new manual task with reference to calendar item
    const newTask = await TaskService.scheduleTask(userId, {
      title: calendarItem.summary || calendarItem.title || '',
      description: calendarItem.description || '',
      duration: 60, // default or extract from calendarItem
      priority: 'medium',
      archetype: 'reactive',
      status,
      ...(type === 'calendar_event' ? { calendar_event_id: calendarItem.id } : { calendar_task_id: calendarItem.id })
    });
    setTasks((prev: any[]) => [...prev, newTask]);
    return newTask;
  }
}

export function DailyPlanner({ calendarData }: DailyPlannerProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEndOfDay, setShowEndOfDay] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "timeline">("cards");
  const [thoughtDump, setThoughtDump] = useState("");
  const [isProcessingThoughts, setIsProcessingThoughts] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState<string[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const thoughtInputRef = useRef<HTMLTextAreaElement>(null);

  // Filter calendar events/tasks for today only (inside component)
  const todayEvents = (calendarData?.events || []).filter((e: any) =>
    isToday(e.start?.dateTime || e.start?.date)
  );
  const todayCalendarTasks = (calendarData?.tasks || []).filter((e: any) =>
    isToday(e.start?.dateTime || e.start?.date)
  );

  const completedTasks = tasks.filter(task => task.status === "completed").length;
  const totalTasks = tasks.length;

  const loadTodayTasks = useCallback(async () => {
    if (!user) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayTasks = await TaskService.getTasksForDate(user.id, today);
      setTasks(todayTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('We couldn\'t load your tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load tasks for today with optimistic loading
  useEffect(() => {
    if (user) {
      // Start loading immediately, don't block UI
      loadTodayTasks();
    } else {
      setLoading(false); // Don't keep loading if no user
    }
  }, [user, loadTodayTasks]);

  // Check for end of day (after 6 PM)
  useEffect(() => {
    const checkEndOfDay = () => {
      const now = new Date();
      const hour = now.getHours();
      
      // Show end of day modal after 6 PM if not shown today
      if (hour >= 18 && !localStorage.getItem(`eod-${now.toDateString()}`)) {
        setTimeout(() => setShowEndOfDay(true), 2000);
      }
    };

    checkEndOfDay();
  }, []);

  const handleEndOfDaySubmit = async (feedback: any) => {
    if (!user) return;
    
    try {
      // Store that we've shown the modal today
      localStorage.setItem(`eod-${new Date().toDateString()}`, 'true');
      setShowEndOfDay(false);
      
      // Save feedback to Supabase
      const { supabase } = await import('@/lib/supabase');
      await supabase
        .from('daily_feedback')
        .upsert({
          user_id: user.id,
          date: new Date().toISOString().split('T')[0],
          productivity_rating: feedback.productivityRating,
          completed_big_thing: feedback.completedBigThing,
          notes: feedback.notes
        });
      
      toast.success('Thanks for your feedback! We’ve saved it.');
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast.error('Sorry, we couldn’t save your feedback. Please try again.');
    }
  };

  const handleAddTask = async (taskData: any) => {
    if (!user) return;
    
    try {
      const newTask = await TaskService.scheduleTask(user.id, {
        title: taskData.title,
        description: taskData.description || null,
        duration: taskData.duration,
        priority: taskData.priority,
        archetype: taskData.archetype || 'reactive'
      });
      
      setTasks(prev => [...prev, newTask]);
      toast.success('Your new task has been added!');
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('We couldn’t add your task. Please try again.');
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: any) => {
    try {
      const updatedTask = await TaskService.updateTask(taskId, updates);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
      toast.success('Task updated!');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('We couldn’t update your task. Please try again.');
    }
  };

  const handleTaskComplete = async (taskId: string) => {
    if (!user) return;
    
    try {
      const updatedTask = await TaskService.completeTask(taskId, user.id);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
      toast.success('Great job! Task marked as complete.');
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('We couldn’t mark your task as complete. Please try again.');
    }
  };

  const handleTaskSkip = async (taskId: string) => {
    if (!user) return;
    
    try {
      const updatedTask = await TaskService.skipTask(taskId, user.id);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
      toast.success('Task skipped.');
    } catch (error) {
      console.error('Error skipping task:', error);
      toast.error('We couldn’t skip your task. Please try again.');
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await TaskService.deleteTask(taskId, user?.id || '');
      setTasks(prev => prev.filter(task => task.id !== taskId));
      toast.success('Task deleted.');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('We couldn’t delete your task. Please try again.');
    }
  };

  // Placeholder for AI extraction API call
  const extractTasksFromThoughts = async (text: string) => {
    setIsProcessingThoughts(true);
    try {
      const res = await fetch("/api/ai-extract-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Failed to extract tasks");
      const data = await res.json();
      if (!data.tasks || !Array.isArray(data.tasks)) throw new Error("Invalid response from AI");
      setSuggestedTasks(data.tasks);
      setShowReviewModal(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to extract tasks from thoughts");
    } finally {
      setIsProcessingThoughts(false);
    }
  };

  const handleConfirmSuggestedTasks = async () => {
    // Add each suggested task to today (reuse handleAddTask logic)
    for (const title of suggestedTasks) {
      await handleAddTask({ title, description: null, duration: 60, priority: "medium", archetype: "reactive" });
    }
    setSuggestedTasks([]);
    setShowReviewModal(false);
    setThoughtDump("");
  };

  const handleUnifiedTaskComplete = async (task: any, source: string) => {
    if (!user) return;
    if (source === 'manual') {
      await handleTaskComplete(task.id);
    } else {
      await upsertManualTaskForCalendarItem({
        calendarItem: task,
        type: source as 'calendar_event' | 'calendar_task',
        status: 'completed',
        userId: user.id,
        TaskService,
        setTasks,
        tasks
      });
    }
  };

  const handleUnifiedTaskSkip = async (task: any, source: string) => {
    if (!user) return;
    if (source === 'manual') {
      await handleTaskSkip(task.id);
    } else {
      await upsertManualTaskForCalendarItem({
        calendarItem: task,
        type: source as 'calendar_event' | 'calendar_task',
        status: 'skipped',
        userId: user.id,
        TaskService,
        setTasks,
        tasks
      });
    }
  };

  const handleUnifiedTaskUpdate = async (task: any, source: string, updates: any) => {
    if (!user) return;
    if (source === 'manual') {
      await handleTaskUpdate(task.id, updates);
    } else {
      await upsertManualTaskForCalendarItem({
        calendarItem: task,
        type: source as 'calendar_event' | 'calendar_task',
        status: updates.status || 'pending',
        userId: user.id,
        TaskService,
        setTasks,
        tasks
      });
    }
  };

  const handleAddToCalendar = async (task: any) => {
    if (!user) {
      toast.error('You must be logged in to add a task to your calendar.');
      return;
    }
    
    try {
      // If no start_time, set to today at 10:00 AM
      let startTime = task.start_time;
      if (!startTime) {
        const now = new Date();
        now.setHours(10, 0, 0, 0); // 10:00 AM today
        startTime = now.toISOString();
      }
      const duration = task.duration || 60;
      // Get the user's access token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        toast.error('You must be logged in to add a task to your calendar.');
        return;
      }
      const res = await fetch('/api/calendar/add-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          user_id: user.id,
          title: task.title,
          description: task.description,
          startTime,
          duration,
        }),
      });
      if (!res.ok) throw new Error('Failed to add to calendar');
      const data = await res.json();
      if (!data.calendarEventId) throw new Error('No calendar event ID returned');
      // Update the manual task in the database with sync status
      const updatedTask = await TaskService.updateTask(task.id, { 
        calendar_event_id: data.calendarEventId,
        calendar_sync_status: 'synced'
      });
      setTasks((prev: any[]) => prev.map(t => t.id === task.id ? updatedTask : t));
      toast.success(`Task added to your calendar! ${data.eventUrl ? 'View in calendar.' : ''}`);
    } catch (err: any) {
      // Update task with failed sync status
      if (task.id) {
        try {
          await TaskService.updateTask(task.id, { calendar_sync_status: 'failed' });
        } catch (syncError) {
          console.error('Failed to update sync status:', syncError);
        }
      }
      toast.error(err.message || 'Failed to add task to calendar');
    }
  };

  // Normalize mergedTasks for unified display and sorting
  const mergedTasks = [
    ...tasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      startTime: t.start_time || '',
      source: 'manual' as const,
      raw: t
    })),
    ...todayEvents.map(e => ({
      id: e.id,
      title: e.summary || '',
      description: e.description || '',
      startTime: e.start?.dateTime || e.start?.date || '',
      source: 'calendar_event' as const,
      raw: e
    })),
    ...todayCalendarTasks.map(e => ({
      id: e.id,
      title: e.summary || '',
      description: e.description || '',
      startTime: e.start?.dateTime || e.start?.date || '',
      source: 'calendar_task' as const,
      raw: e
    })),
  ];
  // Sort by startTime if available, otherwise by title
  mergedTasks.sort((a, b) => {
    if (a.startTime && b.startTime) return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    return a.title.localeCompare(b.title);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Good {getGreeting()}, {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'}! 👋
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            You have {totalTasks - completedTasks} tasks remaining today
          </p>
        </div>
      </div>

      {/* Progress Overview - move to top below header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[
          {
            title: "Today's Progress",
            value: `${completedTasks}/${totalTasks}`,
            icon: CheckCircle,
            color: "blue",
            gradient: "from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20",
            progress: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
          },
          {
            title: "Focus Time",
            value: `${Math.round(tasks.reduce((sum, task) => sum + task.duration, 0) / 60 * 10) / 10}h`,
            icon: Clock,
            color: "teal",
            subtitle: "Deep work scheduled"
          },
          {
            title: "Streak",
            value: "12",
            icon: Target,
            color: "orange",
            subtitle: "Productive days"
          }
        ].map((stat, index) => (
          <div key={stat.title}>
            <Card className={`border-0 shadow-lg ${stat.gradient || ''} hover:shadow-xl transition-all duration-300`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">{stat.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</span>
                  <stat.icon className={`w-8 h-8 text-${stat.color}-600`} />
                </div>
                {stat.progress !== undefined && (
                  <div className={`w-full bg-${stat.color}-200 rounded-full h-2 mt-3`}>
                    <div 
                      className={`bg-gradient-to-r from-${stat.color}-600 to-teal-600 h-2 rounded-full transition-all duration-1000`}
                      style={{ width: `${stat.progress}%` }}
                    />
                  </div>
                )}
                {stat.subtitle && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{stat.subtitle}</p>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Thought Dump Card (always visible, now below progress) */}
      <Card className="border-0 shadow-lg mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <span role="img" aria-label="lightbulb" className="mr-2">💡</span>
            Dump Your Thoughts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Feeling overwhelmed or not sure where to start? Dump your thoughts below and let AI help you turn them into actionable tasks.
          </p>
          <textarea
            ref={thoughtInputRef}
            className="w-full min-h-[100px] p-3 border rounded-lg bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="Type anything on your mind..."
            value={thoughtDump}
            onChange={e => setThoughtDump(e.target.value)}
            disabled={isProcessingThoughts}
          />
          <div className="flex justify-end mt-4">
            <Button
              onClick={() => extractTasksFromThoughts(thoughtDump)}
              disabled={!thoughtDump.trim() || isProcessingThoughts}
              variant="gradient"
            >
              {isProcessingThoughts ? <LoadingSpinner className="mr-2 h-4 w-4" size={16} /> : null}
              {isProcessingThoughts ? "Processing..." : "Process with AI"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Suggested Tasks Review Modal */}
      {showReviewModal && (
        <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review Suggested Tasks</DialogTitle>
              <DialogDescription>
                Edit or remove any tasks before adding them to your list.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {suggestedTasks.map((task, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={task}
                    onChange={e => {
                      const updated = [...suggestedTasks];
                      updated[idx] = e.target.value;
                      setSuggestedTasks(updated);
                    }}
                    className="flex-1"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => setSuggestedTasks(suggestedTasks.filter((_, i) => i !== idx))}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <Button
                onClick={handleConfirmSuggestedTasks}
                disabled={suggestedTasks.length === 0}
                variant="gradient"
              >
                Add to My Tasks
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Unified Today's Schedule Section (now below thought dump) */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Today's Schedule
          </CardTitle>
          <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">
            All your tasks and events for today, from calendar and manual entries.
          </p>
        </CardHeader>
        <CardContent>
          {mergedTasks.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No tasks or events scheduled for today. Add a task or connect your calendar!
            </div>
          ) : (
            <TimelineView
              tasks={mergedTasks.map(t => t.raw)}
              onComplete={task => handleUnifiedTaskComplete(task, task.calendar_event_id ? 'calendar_event' : task.calendar_task_id ? 'calendar_task' : 'manual')}
              onSkip={task => handleUnifiedTaskSkip(task, task.calendar_event_id ? 'calendar_event' : task.calendar_task_id ? 'calendar_task' : 'manual')}
              onUpdate={(task, updates) => handleUnifiedTaskUpdate(task, task.calendar_event_id ? 'calendar_event' : task.calendar_task_id ? 'calendar_task' : 'manual', updates)}
              onDelete={task => handleTaskDelete(task.id)}
              onAddToCalendar={task => handleAddToCalendar(task)}
            />
          )}
        </CardContent>
      </Card>

      <EndOfDayModal
        isOpen={showEndOfDay}
        onClose={() => setShowEndOfDay(false)}
        onSubmit={handleEndOfDaySubmit}
      />
    </div>
  );
}