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

interface Task {
  id: string;
  title: string;
  duration: number;
  priority: string;
  status: string;
  scheduled_at: string;
  archetype: string;
}

interface TaskCardProps {
  task: Task;
  isMinimal?: boolean;
  onClick?: () => void;
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

export function TaskCard({ task, isMinimal = false, onClick }: TaskCardProps) {
  const [isCompleted, setIsCompleted] = useState(task.status === "completed");
  const [showTimeline, setShowTimeline] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const scheduledTime = new Date(task.scheduled_at).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const handleToggleComplete = () => {
    setIsCompleted(!isCompleted);
    // TODO: Update task status in database
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
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`font-medium ${isCompleted ? 'line-through text-slate-500' : 'text-slate-900 dark:text-slate-100'} ${isMinimal ? 'text-sm' : ''}`}>
                    {task.title}
                  </h3>
                  {!isMinimal && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                
                <div className={`flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400 ${isMinimal ? 'text-xs space-x-3' : ''}`}>
                  <div className="flex items-center">
                    <Clock className={`mr-1 ${isMinimal ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    {task.duration}m
                  </div>
                  <div className="flex items-center">
                    <Calendar className={`mr-1 ${isMinimal ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    {scheduledTime}
                  </div>
                </div>
                
                {!isMinimal && (
                  <div className="flex items-center space-x-2 mt-3">
                    <Badge
                      variant="secondary"
                      className={priorityColors[task.priority as keyof typeof priorityColors]}
                    >
                      {task.priority}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={archetypeColors[task.archetype as keyof typeof archetypeColors]}
                    >
                      {task.archetype}
                    </Badge>
                  </div>
                )}
              </div>
            
              {isMinimal && (
                <motion.div
                  animate={{ rotate: showTimeline ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <DayTimelineModal
        isOpen={showTimeline}
        onClose={() => setShowTimeline(false)}
        selectedTask={task}
      />
    </>
  );
}