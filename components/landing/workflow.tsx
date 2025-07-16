"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, Brain, Calendar, CheckCircle, BarChart3, Zap } from "lucide-react";

const workflowSteps = [
  {
    icon: Mic,
    title: "Voice Input",
    description: "Speak naturally or type your tasks",
    detail: "Just say 'Prepare presentation for Friday at 10am' and FlowPilot understands",
    color: "from-blue-500 to-blue-600",
    delay: 0.1
  },
  {
    icon: Brain,
    title: "AI Processing",
    description: "GPT-4 analyzes and structures your tasks",
    detail: "Automatically extracts time, priority, duration, and task type",
    color: "from-purple-500 to-purple-600",
    delay: 0.2
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Optimal time slots based on your patterns",
    detail: "Considers your energy levels, meeting conflicts, and work preferences",
    color: "from-teal-500 to-teal-600",
    delay: 0.3
  },
  {
    icon: CheckCircle,
    title: "Execute & Track",
    description: "Stay focused with intelligent reminders",
    detail: "Real-time progress tracking with contextual break suggestions",
    color: "from-green-500 to-green-600",
    delay: 0.4
  },
  {
    icon: BarChart3,
    title: "Learn & Improve",
    description: "Continuous optimization of your workflow",
    detail: "AI learns your patterns to suggest better scheduling over time",
    color: "from-orange-500 to-orange-600",
    delay: 0.5
  }
];

export function Workflow() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge variant="secondary" className="mb-6 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800">
            <Zap className="w-4 h-4 mr-2" />
            How It Works
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            From Chaos to Clarity in{" "}
            <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              5 Simple Steps
            </span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            See how FlowPilot transforms scattered thoughts into organized, actionable plans
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection Lines */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 via-teal-200 via-green-200 to-orange-200 dark:from-blue-800 dark:via-purple-800 dark:via-teal-800 dark:via-green-800 dark:to-orange-800 transform -translate-y-1/2 z-0"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 relative z-10">
            {workflowSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: step.delay }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="relative"
              >
                <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 h-full">
                  <CardContent className="p-6 text-center">
                    {/* Step Number */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="w-8 h-8 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-400">
                        {index + 1}
                      </div>
                    </div>

                    {/* Icon */}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                      className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-lg`}
                    >
                      <step.icon className="w-8 h-8 text-white" />
                    </motion.div>

                    {/* Content */}
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      {step.description}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 leading-relaxed">
                      {step.detail}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Demo Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20"
        >
          <Card className="border-0 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  See It In Action
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Watch how a simple voice command becomes a perfectly scheduled task
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                {/* Input */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="text-center"
                >
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 mb-4">
                    <Mic className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                        "Prepare presentation slides for the board meeting tomorrow at 2 PM"
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Voice Input</p>
                </motion.div>

                {/* Arrow */}
                <div className="hidden lg:flex justify-center">
                  <motion.div
                    animate={{ x: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-slate-400"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.div>
                </div>

                {/* Output */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 1.0 }}
                  className="text-center"
                >
                  <div className="bg-teal-50 dark:bg-teal-900/20 rounded-2xl p-6 mb-4">
                    <Calendar className="w-12 h-12 text-teal-600 mx-auto mb-4" />
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm text-left">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">Prepare presentation slides</h4>
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">High</Badge>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                        <p>📅 Tomorrow, 2:00 PM</p>
                        <p>⏱️ 90 minutes</p>
                        <p>🎨 Creative work</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Structured Task</p>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}