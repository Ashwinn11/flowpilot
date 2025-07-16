"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Target, Clock, CheckCircle, Flame } from "lucide-react";

const mockData = {
  weeklyStats: {
    completionRate: 85,
    focusTime: 28.5,
    streak: 12,
    tasksCompleted: 34
  },
  dailyProgress: [
    { day: "Mon", completed: 8, total: 10 },
    { day: "Tue", completed: 6, total: 8 },
    { day: "Wed", completed: 9, total: 12 },
    { day: "Thu", completed: 7, total: 9 },
    { day: "Fri", completed: 4, total: 6 },
    { day: "Sat", completed: 0, total: 2 },
    { day: "Sun", completed: 0, total: 0 }
  ],
  productivityHeatmap: Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 24 }, (_, hour) => ({
      day,
      hour,
      value: Math.random() * 100
    }))
  ).flat()
};

export function ProgressView() {
  const { weeklyStats, dailyProgress } = mockData;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Your Progress
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Track your productivity patterns and achievements
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {weeklyStats.completionRate}%
            </div>
            <Progress value={weeklyStats.completionRate} className="h-2" />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-teal-600" />
              Focus Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600 mb-2">
              {weeklyStats.focusTime}h
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">This week</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
              <Flame className="w-4 h-4 mr-2 text-orange-600" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 mb-2">
              {weeklyStats.streak}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Productive days</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
              <Target className="w-4 h-4 mr-2 text-purple-600" />
              Tasks Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 mb-2">
              {weeklyStats.tasksCompleted}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Progress */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            Weekly Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dailyProgress.map((day, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-12 text-sm font-medium text-slate-600 dark:text-slate-400">
                  {day.day}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-900 dark:text-slate-100">
                      {day.completed} / {day.total} tasks
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {day.total > 0 ? Math.round((day.completed / day.total) * 100) : 0}%
                    </Badge>
                  </div>
                  <Progress 
                    value={day.total > 0 ? (day.completed / day.total) * 100 : 0} 
                    className="h-2"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Productivity Heatmap */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Productivity Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
              <span>Time of Day</span>
              <div className="flex items-center space-x-2">
                <span>Less</span>
                <div className="flex space-x-1">
                  <div className="w-3 h-3 bg-slate-200 dark:bg-slate-700 rounded-sm"></div>
                  <div className="w-3 h-3 bg-blue-200 dark:bg-blue-900 rounded-sm"></div>
                  <div className="w-3 h-3 bg-blue-400 dark:bg-blue-700 rounded-sm"></div>
                  <div className="w-3 h-3 bg-blue-600 dark:bg-blue-500 rounded-sm"></div>
                </div>
                <span>More</span>
              </div>
            </div>
            
            <div className="grid grid-cols-24 gap-1">
              {Array.from({ length: 24 }, (_, hour) => (
                <div
                  key={hour}
                  className={`w-4 h-4 rounded-sm ${
                    hour >= 8 && hour <= 18
                      ? Math.random() > 0.5
                        ? "bg-blue-400 dark:bg-blue-600"
                        : "bg-blue-200 dark:bg-blue-800"
                      : "bg-slate-200 dark:bg-slate-700"
                  }`}
                  title={`${hour}:00 - ${hour + 1}:00`}
                />
              ))}
            </div>
            
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>12AM</span>
              <span>6AM</span>
              <span>12PM</span>
              <span>6PM</span>
              <span>12AM</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}