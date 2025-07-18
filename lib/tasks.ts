import { supabase } from './supabase';
import type { Database } from './supabase';
import { logger } from './logger';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

interface CacheEntry {
  data: Task[];
  timestamp: number;
  accessCount: number;
}

// Enhanced cache with size limits and LRU eviction
class TaskCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxSize: number;
  private readonly maxAge: number;

  constructor(maxSize: number = 100, maxAge: number = 30 * 1000) {
    this.maxSize = maxSize;
    this.maxAge = maxAge;
  }

  get(key: string): Task[] | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    // Update access count for LRU
    entry.accessCount++;
    this.cache.set(key, entry);
    
    return entry.data;
  }

  set(key: string, data: Task[]): void {
    // Evict least recently used entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 1
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Infinity;
    let oldestTime = Infinity;

    for (const [key, entry] of Array.from(this.cache.entries())) {
      // Prioritize by access count, then by timestamp
      if (entry.accessCount < oldestAccess || 
          (entry.accessCount === oldestAccess && entry.timestamp < oldestTime)) {
        oldestKey = key;
        oldestAccess = entry.accessCount;
        oldestTime = entry.timestamp;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.debug('Evicted cache entry', { key: oldestKey, accessCount: oldestAccess });
    }
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now - entry.timestamp > this.maxAge) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      logger.debug('Cleaned up expired cache entries', { count: expiredKeys.length });
    }
  }

  // Get cache statistics
  getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }
}

// Create cache instance
const taskCache = new TaskCache(100, 30 * 1000); // 100 entries, 30 seconds TTL

// Periodic cleanup
if (typeof window !== 'undefined') {
  setInterval(() => {
    taskCache.cleanup();
  }, 60000); // Clean up every minute
}

export class TaskService {
  // Clear cache for a specific user and date
  static clearCache(userId: string, date?: string) {
    if (date) {
      taskCache.delete(`${userId}-${date}`);
    } else {
      // Clear all cache entries for this user
      const keysToDelete: string[] = [];
      for (const key of Array.from(taskCache['cache'].keys())) {
        if (key.startsWith(`${userId}-`)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => taskCache.delete(key));
    }
  }

  // Get all tasks for a user
  static async getTasks(userId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_at', { ascending: true });

      if (error) {
        logger.error('Failed to fetch tasks', { userId, error: error.message }, error);
        throw error;
      }

      logger.debug('Fetched tasks', { userId, count: data?.length || 0 });
      return data || [];
    } catch (error) {
      logger.error('Error in getTasks', { userId }, error as Error);
      throw error;
    }
  }

  // Get tasks for a specific date
  static async getTasksForDate(userId: string, date: string): Promise<Task[]> {
    const cacheKey = `${userId}-${date}`;
    const cached = taskCache.get(cacheKey);
    
    // Return cached data if available
    if (cached) {
      logger.debug('Cache hit for tasks', { userId, date, count: cached.length });
      return cached;
    }
    
    try {
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

      if (error) {
        logger.error('Failed to fetch tasks for date', { userId, date, error: error.message }, error);
        throw error;
      }
      
      const tasks = data || [];
      
      // Cache the result
      taskCache.set(cacheKey, tasks);
      
      logger.debug('Fetched and cached tasks for date', { userId, date, count: tasks.length });
      return tasks;
    } catch (error) {
      logger.error('Error in getTasksForDate', { userId, date }, error as Error);
      throw error;
    }
  }

  // Create a new task
  static async createTask(task: TaskInsert): Promise<Task> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single();

      if (error) {
        logger.error('Failed to create task', { userId: task.user_id, error: error.message }, error);
        throw error;
      }

      // Clear cache for this user
      this.clearCache(task.user_id);

      // Log the task creation
      await this.logTaskAction(data.id, task.user_id, 'created');

      logger.info('Task created successfully', { taskId: data.id, userId: task.user_id });
      return data;
    } catch (error) {
      logger.error('Error in createTask', { userId: task.user_id }, error as Error);
      throw error;
    }
  }

  // Update a task
  static async updateTask(taskId: string, updates: TaskUpdate): Promise<Task> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update task', { taskId, error: error.message }, error);
        throw error;
      }

      // Clear cache for this user
      if (data.user_id) {
        this.clearCache(data.user_id);
      }

      logger.debug('Task updated successfully', { taskId, userId: data.user_id });
      return data;
    } catch (error) {
      logger.error('Error in updateTask', { taskId }, error as Error);
      throw error;
    }
  }

  // Complete a task
  static async completeTask(taskId: string, userId: string): Promise<Task> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to complete task', { taskId, userId, error: error.message }, error);
        throw error;
      }

      // Log the task completion
      await this.logTaskAction(taskId, userId, 'completed');

      // Clear cache for this user
      this.clearCache(userId);

      logger.info('Task completed successfully', { taskId, userId });
      return data;
    } catch (error) {
      logger.error('Error in completeTask', { taskId, userId }, error as Error);
      throw error;
    }
  }

  // Skip a task
  static async skipTask(taskId: string, userId: string): Promise<Task> {
    try {
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

      if (error) {
        logger.error('Failed to skip task', { taskId, userId, error: error.message }, error);
        throw error;
      }

      // Log the task skip
      await this.logTaskAction(taskId, userId, 'skipped');

      // Clear cache for this user
      this.clearCache(userId);

      logger.info('Task skipped successfully', { taskId, userId });
      return data;
    } catch (error) {
      logger.error('Error in skipTask', { taskId, userId }, error as Error);
      throw error;
    }
  }

  // Start a task
  static async startTask(taskId: string, userId: string): Promise<Task> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          status: 'in_progress'
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to start task', { taskId, userId, error: error.message }, error);
        throw error;
      }

      // Log the task start
      await this.logTaskAction(taskId, userId, 'started');

      // Clear cache for this user
      this.clearCache(userId);

      logger.info('Task started successfully', { taskId, userId });
      return data;
    } catch (error) {
      logger.error('Error in startTask', { taskId, userId }, error as Error);
      throw error;
    }
  }

  // Delete a task
  static async deleteTask(taskId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        logger.error('Failed to delete task', { taskId, userId, error: error.message }, error);
        throw error;
      }

      // Clear cache for this user
      this.clearCache(userId);

      logger.info('Task deleted successfully', { taskId, userId });
    } catch (error) {
      logger.error('Error in deleteTask', { taskId, userId }, error as Error);
      throw error;
    }
  }

  // Get task analytics
  static async getTaskAnalytics(userId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());

      if (error) {
        logger.error('Failed to fetch task analytics', { userId, days, error: error.message }, error);
        throw error;
      }

      const tasks = data || [];
      
      const analytics = {
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

      logger.debug('Task analytics generated', { userId, days, totalTasks: analytics.totalTasks });
      return analytics;
    } catch (error) {
      logger.error('Error in getTaskAnalytics', { userId, days }, error as Error);
      throw error;
    }
  }

  // Get productive hours based on completed tasks
  static async getProductiveHours(userId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('tasks')
        .select('completed_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .not('completed_at', 'is', null)
        .gte('completed_at', startDate.toISOString());

      if (error) {
        logger.error('Failed to fetch productive hours', { userId, days, error: error.message }, error);
        throw error;
      }

      const completedTasks = data || [];
      const hourCounts = new Array(24).fill(0);

      completedTasks.forEach(task => {
        if (task.completed_at) {
          const hour = new Date(task.completed_at).getHours();
          hourCounts[hour]++;
        }
      });

      logger.debug('Productive hours calculated', { userId, days, completedTasks: completedTasks.length });
      return hourCounts;
    } catch (error) {
      logger.error('Error in getProductiveHours', { userId, days }, error as Error);
      throw error;
    }
  }

  // Log task actions for analytics
  private static async logTaskAction(taskId: string, userId: string, action: 'created' | 'started' | 'completed' | 'skipped' | 'rescheduled') {
    try {
      await supabase
        .from('task_logs')
        .insert({
          task_id: taskId,
          user_id: userId,
          action,
          metadata: { timestamp: new Date().toISOString() }
        });

      logger.debug('Task action logged', { taskId, userId, action });
    } catch (error) {
      // Don't throw error for logging failures, just log them
      logger.warn('Failed to log task action', { taskId, userId, action, error: (error as Error).message });
    }
  }

  // Schedule a task for a specific time
  static async scheduleTask(userId: string, task: Omit<TaskInsert, 'user_id' | 'scheduled_at'>): Promise<Task> {
    try {
      const scheduledTask: TaskInsert = {
        ...task,
        user_id: userId,
        scheduled_at: new Date().toISOString() // Default to now, can be overridden
      };

      const result = await this.createTask(scheduledTask);
      logger.info('Task scheduled successfully', { taskId: result.id, userId });
      return result;
    } catch (error) {
      logger.error('Error in scheduleTask', { userId }, error as Error);
      throw error;
    }
  }

  // Preload today's tasks for faster dashboard loading
  static async preloadTodayTasks(userId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      await this.getTasksForDate(userId, today);
      logger.debug('Preloaded today\'s tasks', { userId });
    } catch (error) {
      logger.warn('Failed to preload today\'s tasks', { userId, error: (error as Error).message });
      // Don't throw error for preloading failures
    }
  }

  // Get cache statistics (for debugging/monitoring)
  static getCacheStats() {
    return taskCache.getStats();
  }

  // Clear all cache (for testing or memory management)
  static clearAllCache() {
    taskCache.clear();
    logger.info('All task cache cleared');
  }
}