"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, CheckCircle, Circle, Play, Pause } from "lucide-react";

import type { Database } from "@/lib/supabase";

type Task = Database['public']['Tables']['tasks']['Row'];

interface DayTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTask?: Task;
}

// Mock data for the full day timeline
const mockDayTasks: Task[] = [
  {
    id: "1",
    user_id: "mock-user",
    title: "Morning routine & coffee",
    description: null,
    duration: 30,
    priority: "low",
    status: "completed",
    scheduled_at: "2024-01-15T08:00:00Z",
    archetype: "reactive",
    completed_at: null,
    skipped_count: 0,
    created_at: "2024-01-15T07:50:00Z",
    updated_at: "2024-01-15T08:00:00Z"
  },
  {
    id: "2",
    user_id: "mock-user",
    title: "Review quarterly reports",
    description: null,
    duration: 90,
    priority: "high",
    status: "completed",
    scheduled_at: "2024-01-15T09:00:00Z",
    archetype: "analytical",
    completed_at: null,
    skipped_count: 0,
    created_at: "2024-01-15T08:50:00Z",
    updated_at: "2024-01-15T09:00:00Z"
  },
  {
    id: "3",
    user_id: "mock-user",
    title: "Team standup meeting",
    description: null,
    duration: 30,
    priority: "medium",
    status: "completed",
    scheduled_at: "2024-01-15T10:30:00Z",
    archetype: "collaborative",
    completed_at: null,
    skipped_count: 0,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "4",
    user_id: "mock-user",
    title: "Focus break",
    description: null,
    duration: 15,
    priority: "low",
    status: "completed",
    scheduled_at: "2024-01-15T11:00:00Z",
    archetype: "reactive",
    completed_at: null,
    skipped_count: 0,
    created_at: "2024-01-15T10:50:00Z",
    updated_at: "2024-01-15T11:00:00Z"
  },
  {
    id: "5",
    user_id: "mock-user",
    title: "Client presentation prep",
    description: null,
    duration: 120,
    priority: "high",
    status: "in_progress",
    scheduled_at: "2024-01-15T11:15:00Z",
    archetype: "creative",
    completed_at: null,
    skipped_count: 0,
    created_at: "2024-01-15T11:00:00Z",
    updated_at: "2024-01-15T11:15:00Z"
  },
  {
    id: "6",
    user_id: "mock-user",
    title: "Lunch break",
    description: null,
    duration: 60,
    priority: "low",
    status: "pending",
    scheduled_at: "2024-01-15T13:15:00Z",
    archetype: "reactive",
    completed_at: null,
    skipped_count: 0,
    created_at: "2024-01-15T13:00:00Z",
    updated_at: "2024-01-15T13:15:00Z"
  },
  {
    id: "7",
    user_id: "mock-user",
    title: "Design system updates",
    description: null,
    duration: 120,
    priority: "high",
    status: "pending",
    scheduled_at: "2024-01-15T14:15:00Z",
    archetype: "creative",
    completed_at: null,
    skipped_count: 0,
    created_at: "2024-01-15T14:00:00Z",
    updated_at: "2024-01-15T14:15:00Z"
  },
  {
    id: "8",
    user_id: "mock-user",
    title: "Code review session",
    description: null,
    duration: 45,
    priority: "medium",
    status: "pending",
    scheduled_at: "2024-01-15T16:15:00Z",
    archetype: "analytical",
    completed_at: null,
    skipped_count: 0,
    created_at: "2024-01-15T16:00:00Z",
    updated_at: "2024-01-15T16:15:00Z"
  },
  {
    id: "9",
    user_id: "mock-user",
    title: "Wrap up & planning",
    description: null,
    duration: 30,
    priority: "low",
    status: "pending",
    scheduled_at: "2024-01-15T17:00:00Z",
    archetype: "analytical",
    completed_at: null,
    skipped_count: 0,
    created_at: "2024-01-15T16:50:00Z",
    updated_at: "2024-01-15T17:00:00Z"
  }
];

const priorityColors = {
  high: "border-red-500 bg-red-50 dark:bg-red-900/20",
  medium: "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20",
  low: "border-green-500 bg-green-50 dark:bg-green-900/20"
};

const statusIcons = {
  completed: CheckCircle,
  in_progress: Play,
  pending: Circle
};

const statusColors = {
  completed: "text-green-600",
  in_progress: "text-blue-600",
  pending: "text-slate-400"
};

export function DayTimelineModal({ isOpen, onClose, selectedTask }: DayTimelineModalProps) {
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();

  const getTimePosition = (scheduledAt: string | null) => {
    if (!scheduledAt) return 0;
    const taskTime = new Date(scheduledAt);
    const taskHour = taskTime.getHours();
    const taskMinute = taskTime.getMinutes();
    
    // Calculate position from 8 AM to 6 PM (10 hours = 100%)
    const startHour = 8;
    const totalHours = 10;
    const position = ((taskHour - startHour) + (taskMinute / 60)) / totalHours * 100;
    
    return Math.max(0, Math.min(100, position));
  };

  const getCurrentTimePosition = () => {
    const startHour = 8;
    const totalHours = 10;
    const position = ((currentHour - startHour) + (currentMinute / 60)) / totalHours * 100;
    
    return Math.max(0, Math.min(100, position));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden" aria-describedby="day-timeline-modal-desc">
        <div id="day-timeline-modal-desc" style={{position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden'}}>
          Timeline and details for the selected day.
        </div>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Today&apos;s Timeline
            {selectedTask && (
              <Badge variant="outline" className="ml-3">
                Focused on: {selectedTask.title}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <div className="relative">
            {/* Time ruler */}
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-4 px-4">
              {Array.from({ length: 11 }, (_, i) => (
                <span key={i} className="flex-1 text-center">
                  {(8 + i).toString().padStart(2, '0')}:00
                </span>
              ))}
            </div>

            {/* Timeline container */}
            <div className="relative bg-slate-100 dark:bg-slate-800 rounded-lg p-4 min-h-[400px]">
              {/* Current time indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                style={{ left: `${getCurrentTimePosition()}%` }}
              >
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full"></div>
                <div className="absolute -top-6 -left-8 text-xs text-red-600 font-medium whitespace-nowrap">
                  Now
                </div>
              </motion.div>

              {/* Hour grid lines */}
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700"
                  style={{ left: `${(i / 10) * 100}%` }}
                />
              ))}

              {/* Tasks */}
              <div className="relative h-full">
                {mockDayTasks.map((task, index) => {
                  const position = getTimePosition(task.scheduled_at);
                  const width = (task.duration / 60) / 10 * 100; // Convert duration to percentage
                  const StatusIcon = statusIcons[task.status as keyof typeof statusIcons];
                  const isSelected = selectedTask?.id === task.id;
                  
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        scale: isSelected ? 1.05 : 1
                      }}
                      transition={{ delay: index * 0.1 }}
                      className={`absolute h-16 ${
                        priorityColors[task.priority as keyof typeof priorityColors]
                      } border-l-4 rounded-r-lg shadow-sm hover:shadow-md transition-all duration-200 ${
                        isSelected ? 'ring-2 ring-blue-500 z-10' : ''
                      }`}
                      style={{
                        left: `${position}%`,
                        width: `${width}%`,
                        top: `${index * 20}px`,
                        minWidth: '120px'
                      }}
                    >
                      <div className="p-2 h-full flex items-center">
                        <StatusIcon className={`w-4 h-4 mr-2 ${statusColors[task.status as keyof typeof statusColors]}`} />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {task.title}
                          </h4>
                          <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                            <Clock className="w-3 h-3 mr-1" />
                            {task.duration}m
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-slate-600 dark:text-slate-400">Completed</span>
              </div>
              <div className="flex items-center">
                <Play className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-slate-600 dark:text-slate-400">In Progress</span>
              </div>
              <div className="flex items-center">
                <Circle className="w-4 h-4 text-slate-400 mr-2" />
                <span className="text-slate-600 dark:text-slate-400">Pending</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}