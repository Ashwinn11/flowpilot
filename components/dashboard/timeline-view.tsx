"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCard } from "./task-card";
import { Calendar } from "lucide-react";

interface Task {
  id: string;
  title: string;
  duration: number;
  priority: string;
  status: string;
  scheduled_at: string;
  archetype: string;
}

interface TimelineViewProps {
  tasks: Task[];
}

export function TimelineView({ tasks }: TimelineViewProps) {
  const sortedTasks = [...tasks].sort((a, b) => 
    new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Tasks Only View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <TaskCard task={task} isMinimal={true} />
              </motion.div>
            ))}
            
            {sortedTasks.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400">No tasks scheduled for today</p>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}