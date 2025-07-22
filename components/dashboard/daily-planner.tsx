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
    ...(calendarData?.events || []).map(e => ({
      id: e.id,
      title: e.summary || '',
      description: e.description || '',
      startTime: e.start?.dateTime || e.start?.date || '',
      source: 'calendar_event' as const,
      raw: e
    })),
    ...(calendarData?.tasks || []).map(e => ({
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
      {/* Thought Dump Card (always visible) */}
      <Card className="border-0 shadow-lg">
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
        
        <div className="flex items-center space-x-3">
          <Button
            variant={viewMode === "cards" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("cards")}
          >
            <Target className="w-4 h-4 mr-2" />
            Focus View
          </Button>
          <Button
            variant={viewMode === "timeline" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("timeline")}
          >
            <Clock className="w-4 h-4 mr-2" />
            Task Section
          </Button>
        </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

          {/* Main Content */}
          <AnimatePresence mode="wait">
            {viewMode === "cards" ? (
              <motion.div
                key="cards"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Top 3 Focus Tasks (from mergedTasks) */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="w-5 h-5 mr-2 text-blue-600" />
                      Top 3 Focus Tasks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mergedTasks.slice(0, 3).map((task, index) => (
                        <motion.div
                          key={task.id || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center space-x-3"
                        >
                          <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <div className="flex-1">
                            <TaskCard 
                              task={task.raw}
                              source={task.source}
                              onComplete={task.source === 'manual' ? () => handleTaskComplete(task.id) : undefined}
                              onSkip={task.source === 'manual' ? () => handleTaskSkip(task.id) : undefined}
                              onUpdate={task.source === 'manual' ? (updates) => handleTaskUpdate(task.id, updates) : undefined}
                              onDelete={task.source === 'manual' ? () => handleTaskDelete(task.id) : undefined}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* All Tasks (from mergedTasks) */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>All Tasks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mergedTasks.map((task, index) => (
                        <motion.div
                          key={task.id || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <TaskCard 
                            task={task.raw}
                            source={task.source}
                            onComplete={task.source === 'manual' ? () => handleTaskComplete(task.id) : undefined}
                            onSkip={task.source === 'manual' ? () => handleTaskSkip(task.id) : undefined}
                            onUpdate={task.source === 'manual' ? (updates) => handleTaskUpdate(task.id, updates) : undefined}
                            onDelete={task.source === 'manual' ? () => handleTaskDelete(task.id) : undefined}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <TimelineView tasks={mergedTasks.map(t => t.raw)} />
            )}
          </AnimatePresence>
        </>
      )}

      <EndOfDayModal
        isOpen={showEndOfDay}
        onClose={() => setShowEndOfDay(false)}
        onSubmit={handleEndOfDaySubmit}
      />
    </div>
  );
}