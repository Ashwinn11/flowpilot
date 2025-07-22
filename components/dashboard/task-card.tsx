"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Clock, MoreVertical, Edit3, Trash2, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { DayTimelineModal } from "./day-timeline-modal";

import type { Database } from "@/lib/supabase";

type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskCardProps {
  task: any; // normalized task object
  source: 'manual' | 'calendar_event' | 'calendar_task';
  isMinimal?: boolean;
  onClick?: () => void;
  onComplete?: () => void;
  onSkip?: () => void;
  onUpdate?: (updates: any) => void;
  onDelete?: () => void;
}

const priorityColors = {
  high: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
  low: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
};

const archetypeColors = {
  analytical: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
  creative: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
  collaborative: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300"
};

export function TaskCard({ task, source, isMinimal = false, onClick, onComplete, onSkip, onUpdate, onDelete }: TaskCardProps) {
  const [isCompleted, setIsCompleted] = useState(task.status === "completed");
  const [showTimeline, setShowTimeline] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const scheduledTime = task.startTime
    ? new Date(task.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Not scheduled';

  const handleToggleComplete = () => {
    setIsCompleted(!isCompleted);
    if (onComplete && !isCompleted) {
      onComplete();
    } else if (onSkip && isCompleted) {
      onSkip();
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      setShowTimeline(true);
    }
  };

  return (
    <>
      <motion.div
        ref={cardRef}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className="cursor-pointer"
        onClick={handleCardClick}
      >
        <Card className={`border-0 shadow-sm transition-all duration-300 hover:shadow-lg ${
          isCompleted ? 'bg-slate-50 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-800'
        } ${isMinimal ? 'hover:bg-blue-50 dark:hover:bg-blue-900/10' : ''}`}>
          <CardContent className={isMinimal ? "p-3" : "p-4"}>
            <div className="flex items-start space-x-3">
              {/* Only show checkbox for manual tasks */}
              {source === 'manual' && (
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleComplete();
                  }}
                >
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={handleToggleComplete}
                    className="mt-1"
                  />
                </motion.div>
              )}
              {/* Show calendar icon for calendar_event or calendar_task */}
              {source !== 'manual' && (
                <div className="mt-1">
                  <span className="mt-1" title={source === 'calendar_event' ? 'Calendar Event' : 'Calendar Task'}>
                    <Calendar className="w-5 h-5 text-blue-500" />
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`font-medium ${isCompleted ? 'line-through text-slate-500' : 'text-slate-900 dark:text-slate-100'} ${isMinimal ? 'text-sm' : ''}`}>
                    {task.title}
                  </h3>
                  {/* Source badge */}
                  {source !== 'manual' && (
                    <Badge variant="outline" className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {source === 'calendar_event' ? 'Calendar Event' : 'Calendar Task'}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                  {task.description}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {scheduledTime}
                </div>
              </div>
              {/* Only show actions for manual tasks */}
              {source === 'manual' && !isMinimal && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={e => e.stopPropagation()}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onUpdate && onUpdate({ status: isCompleted ? 'pending' : 'completed' })}>
                      <Edit3 className="w-4 h-4 mr-2" />
                      {isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onSkip && onSkip()}>
                      <Clock className="w-4 h-4 mr-2" />
                      Skip
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => onDelete && onDelete()}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
      {/* Timeline modal, if needed */}
      <AnimatePresence>
        {showTimeline && (
          <DayTimelineModal isOpen={showTimeline} onClose={() => setShowTimeline(false)} selectedTask={task} />
        )}
      </AnimatePresence>
    </>
  );
}