"use client";

import { useState, useEffect, useCallback } from "react";
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

type Task = Database['public']['Tables']['tasks']['Row'];

interface DailyPlannerProps {
  calendarData?: {
    events: CalendarEvent[];
    tasks: CalendarEvent[];
    birthdays: CalendarEvent[];
  };
}

export function DailyPlanner({ calendarData }: DailyPlannerProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showEndOfDay, setShowEndOfDay] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "timeline">("cards");

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
      setIsAddModalOpen(false);
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
          <div>
            <Button onClick={() => setIsAddModalOpen(true)} className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>
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

          {/* Calendar Data Section */}
          {calendarData && (calendarData.events.length > 0 || calendarData.tasks.length > 0 || calendarData.birthdays.length > 0) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Calendar Items
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Events */}
                {calendarData.events.length > 0 && (
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Events ({calendarData.events.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {calendarData.events.slice(0, 3).map((event, index) => {
                        const isToday = new Date(event.start.dateTime || event.start.date || '').toDateString() === new Date().toDateString();
                        const isUrgent = event.summary?.toLowerCase().includes('urgent') || event.summary?.toLowerCase().includes('important');
                        
                        return (
                          <div key={index} className={`text-sm p-3 rounded-lg border transition-all duration-200 ${
                            isToday 
                              ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' 
                              : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700'
                          } ${isUrgent ? 'ring-2 ring-red-200 dark:ring-red-800' : ''}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium truncate ${isUrgent ? 'text-red-700 dark:text-red-300' : 'text-gray-900 dark:text-gray-100'}`}>
                                  {event.summary}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  <span>
                                    {new Date(event.start.dateTime || event.start.date || '').toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </span>
                                </div>
                              </div>
                              {isToday && (
                                <Badge variant="outline" className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ml-2">
                                  Today
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {calendarData.events.length > 3 && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 text-center py-2">
                          +{calendarData.events.length - 3} more events
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Tasks */}
                {calendarData.tasks.length > 0 && (
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Tasks ({calendarData.tasks.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {calendarData.tasks.slice(0, 3).map((task, index) => {
                        const isToday = new Date(task.start.dateTime || task.start.date || '').toDateString() === new Date().toDateString();
                        const isUrgent = task.summary?.toLowerCase().includes('urgent') || task.summary?.toLowerCase().includes('important');
                        
                        return (
                          <div key={index} className={`text-sm p-3 rounded-lg border transition-all duration-200 ${
                            isToday 
                              ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800' 
                              : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700'
                          } ${isUrgent ? 'ring-2 ring-red-200 dark:ring-red-800' : ''}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium truncate ${isUrgent ? 'text-red-700 dark:text-red-300' : 'text-gray-900 dark:text-gray-100'}`}>
                                  {task.summary}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  <span>
                                    {new Date(task.start.dateTime || task.start.date || '').toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </span>
                                </div>
                              </div>
                              {isToday && (
                                <Badge variant="outline" className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 ml-2">
                                  Today
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {calendarData.tasks.length > 3 && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 text-center py-2">
                          +{calendarData.tasks.length - 3} more tasks
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Birthdays */}
                {calendarData.birthdays.length > 0 && (
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-pink-700 dark:text-pink-300 flex items-center gap-2">
                        <Gift className="h-4 w-4" />
                        Birthdays ({calendarData.birthdays.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {calendarData.birthdays.slice(0, 3).map((birthday, index) => {
                        const isToday = new Date(birthday.start.dateTime || birthday.start.date || '').toDateString() === new Date().toDateString();
                        
                        return (
                          <div key={index} className={`text-sm p-3 rounded-lg border transition-all duration-200 ${
                            isToday 
                              ? 'bg-pink-100 dark:bg-pink-900/30 border-pink-200 dark:border-pink-800' 
                              : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700'
                          }`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate text-pink-700 dark:text-pink-300">
                                  {birthday.summary}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  <span>
                                    {new Date(birthday.start.dateTime || birthday.start.date || '').toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              {isToday && (
                                <Badge variant="outline" className="text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 ml-2">
                                  Today
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {calendarData.birthdays.length > 3 && (
                        <p className="text-xs text-pink-600 dark:text-pink-400 text-center py-2">
                          +{calendarData.birthdays.length - 3} more birthdays
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

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
                {tasks.length === 0 ? (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="py-12 text-center">
                      <div className="text-slate-400 mb-4">
                        <Target className="w-12 h-12 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                        No tasks for today
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-4">
                        Add your first task to get started with your productive day!
                      </p>
                      <Button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Task
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Top 3 Focus Tasks */}
                    <Card className="border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Target className="w-5 h-5 mr-2 text-blue-600" />
                          Top 3 Focus Tasks
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {tasks.slice(0, 3).map((task, index) => (
                            <motion.div
                              key={task.id}
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
                                  task={task} 
                                  onComplete={() => handleTaskComplete(task.id)}
                                  onSkip={() => handleTaskSkip(task.id)}
                                  onUpdate={(updates) => handleTaskUpdate(task.id, updates)}
                                  onDelete={() => handleTaskDelete(task.id)}
                                />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* All Tasks */}
                    <Card className="border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle>All Tasks</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {tasks.map((task, index) => (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <TaskCard 
                                task={task}
                                onComplete={() => handleTaskComplete(task.id)}
                                onSkip={() => handleTaskSkip(task.id)}
                                onUpdate={(updates) => handleTaskUpdate(task.id, updates)}
                                onDelete={() => handleTaskDelete(task.id)}
                              />
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </motion.div>
            ) : (
              <TimelineView tasks={tasks} />
            )}
          </AnimatePresence>
        </>
      )}

      <AddTaskModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onAddTask={handleAddTask}
      />

      <EndOfDayModal
        isOpen={showEndOfDay}
        onClose={() => setShowEndOfDay(false)}
        onSubmit={handleEndOfDaySubmit}
      />
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}