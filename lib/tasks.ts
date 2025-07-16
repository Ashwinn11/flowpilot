import { supabase } from './supabase';
import type { Database } from './supabase';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export class TaskService {
  // Get all tasks for a user
  static async getTasks(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('scheduled_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Get tasks for a specific date
  static async getTasksForDate(userId: string, date: string): Promise<Task[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString())
      .order('scheduled_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Create a new task
  static async createTask(task: TaskInsert): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();

    if (error) throw error;

    // Log the task creation
    await this.logTaskAction(data.id, task.user_id, 'created');

    return data;
  }

  // Update a task
  static async updateTask(taskId: string, updates: TaskUpdate): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Complete a task
  static async completeTask(taskId: string, userId: string): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;

    // Log the task completion
    await this.logTaskAction(taskId, userId, 'completed');

    return data;
  }

  // Skip a task
  static async skipTask(taskId: string, userId: string): Promise<Task> {
    // Get current task to increment skip count
    const { data: currentTask } = await supabase
      .from('tasks')
      .select('skipped_count')
      .eq('id', taskId)
      .single();

    const { data, error } = await supabase
      .from('tasks')
      .update({
        status: 'skipped',
        skipped_count: (currentTask?.skipped_count || 0) + 1
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;

    // Log the task skip
    await this.logTaskAction(taskId, userId, 'skipped');

    return data;
  }

  // Start a task
  static async startTask(taskId: string, userId: string): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        status: 'in_progress'
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;

    // Log the task start
    await this.logTaskAction(taskId, userId, 'started');

    return data;
  }

  // Delete a task
  static async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  }

  // Get task analytics
  static async getTaskAnalytics(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    const tasks = data || [];
    
    return {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      skippedTasks: tasks.filter(t => t.status === 'skipped').length,
      completionRate: tasks.length > 0 ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0,
      averageSkippedCount: tasks.reduce((sum, t) => sum + t.skipped_count, 0) / tasks.length,
      tasksByArchetype: tasks.reduce((acc, task) => {
        acc[task.archetype] = (acc[task.archetype] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      tasksByPriority: tasks.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  // Get productive hours based on completed tasks
  static async getProductiveHours(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('tasks')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .gte('completed_at', startDate.toISOString());

    if (error) throw error;

    const completedTasks = data || [];
    const hourCounts = new Array(24).fill(0);

    completedTasks.forEach(task => {
      if (task.completed_at) {
        const hour = new Date(task.completed_at).getHours();
        hourCounts[hour]++;
      }
    });

    return hourCounts;
  }

  // Log task actions for analytics
  private static async logTaskAction(taskId: string, userId: string, action: 'created' | 'started' | 'completed' | 'skipped' | 'rescheduled') {
    await supabase
      .from('task_logs')
      .insert({
        task_id: taskId,
        user_id: userId,
        action,
        metadata: { timestamp: new Date().toISOString() }
      });
  }

  // Smart task scheduling based on free time and productivity patterns
  static async scheduleTask(userId: string, task: Omit<TaskInsert, 'user_id' | 'scheduled_at'>): Promise<Task> {
    // Get user's work hours
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('work_hours, timezone')
      .eq('id', userId)
      .single();

    const workHours = profile?.work_hours || { start: '09:00', end: '17:00', days: [1, 2, 3, 4, 5] };
    
    // Get today's tasks to find free time
    const today = new Date();
    const todayTasks = await this.getTasksForDate(userId, today.toISOString().split('T')[0]);
    
    // Simple scheduling: find next available slot
    let scheduledTime = new Date();
    scheduledTime.setHours(parseInt(workHours.start.split(':')[0]), parseInt(workHours.start.split(':')[1]), 0, 0);

    // If it's past work hours, schedule for tomorrow
    if (scheduledTime < new Date()) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    // Find a free slot
    for (let i = 0; i < 24; i++) {
      const proposedTime = new Date(scheduledTime);
      proposedTime.setHours(proposedTime.getHours() + i);
      
      const conflictingTask = todayTasks.find(t => {
        if (!t.scheduled_at) return false;
        const taskStart = new Date(t.scheduled_at);
        const taskEnd = new Date(taskStart.getTime() + (t.duration * 60 * 1000));
        const proposedEnd = new Date(proposedTime.getTime() + (task.duration * 60 * 1000));
        
        return (proposedTime < taskEnd && proposedEnd > taskStart);
      });

      if (!conflictingTask) {
        scheduledTime = proposedTime;
        break;
      }
    }

    return this.createTask({
      ...task,
      user_id: userId,
      scheduled_at: scheduledTime.toISOString()
    });
  }
} 