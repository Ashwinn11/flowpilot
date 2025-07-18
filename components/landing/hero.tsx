"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { 
  Calendar, 
  Mic, 
  MessageSquare, 
  TrendingUp, 
  RefreshCw, 
  Target,
  Play,
  ArrowRight,
  Zap,
  Clock,
  CheckCircle,
  Sparkles,
  Star
} from "lucide-react";

export function Hero() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 dark:from-slate-900 dark:via-purple-950/30 dark:to-blue-950/20 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-20 h-20 sm:w-32 sm:h-32 bg-purple-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-16 h-16 sm:w-24 sm:h-24 bg-blue-200/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 sm:w-20 sm:h-20 bg-pink-200/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-40 right-1/3 w-10 h-10 sm:w-16 sm:h-16 bg-yellow-200/20 rounded-full blur-xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Content */}
          <motion.div 
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="space-y-6 sm:space-y-8 order-2 lg:order-1"
          >
            <div className="space-y-4 sm:space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 dark:from-purple-900/40 dark:to-blue-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-700 text-xs sm:text-sm">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI-Powered Productivity
                </Badge>
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.0, delay: 0.4 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight"
              >
                Your Calendar,
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400"> Smarter</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.0, delay: 0.6 }}
                className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 leading-relaxed"
              >
                Connect your calendar, add tasks naturally, and let AI predict your productivity hours. 
                Auto-reschedule, prioritize, and chat with your personal productivity assistant.
              </motion.p>
            </div>

            {/* Key USPs with enhanced styling */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, delay: 0.8 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
            >
              {[
                { icon: Calendar, text: "Calendar Sync", color: "blue" },
                { icon: Mic, text: "Voice Tasks", color: "purple" },
                { icon: MessageSquare, text: "AI Chat", color: "green" },
                { icon: TrendingUp, text: "Smart Predictions", color: "orange" }
              ].map((usp, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 1.0 + index * 0.1 }}
                  className={`flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gradient-to-r from-${usp.color}-50 to-${usp.color}-100/50 dark:from-${usp.color}-900/20 dark:to-${usp.color}-800/20 rounded-xl border border-${usp.color}-200/50 dark:border-${usp.color}-700/30`}
                >
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-${usp.color}-500 to-${usp.color}-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0`}>
                    <usp.icon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{usp.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons with enhanced styling */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, delay: 1.4 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8"
            >
              <Link href="/auth" className="w-full sm:w-auto">
                <Button 
                  size="lg"
                  variant="gradient" 
                  className="group relative overflow-hidden w-full sm:w-auto"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Start Your Free Trial
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Button>
              </Link>
              <a href="#workflow" className="w-full sm:w-auto">
                <Button 
                  size="lg"
                  variant="outline" 
                  className="group w-full sm:w-auto"
                >
                  <span className="flex items-center gap-2">
                    <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                    See How It Works
                  </span>
                </Button>
              </a>
            </motion.div>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.6 }}
              className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left"
            >
              No credit card required • 14-day free trial • Connect your calendar in 2 minutes
            </motion.p>
          </motion.div>

          {/* Right: Single Hero Image with enhanced styling */}
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            className="flex justify-center lg:justify-end order-1 lg:order-2"
          >
            <Card className="w-64 sm:w-80 lg:w-96 bg-white dark:bg-gray-800 border-0 shadow-2xl relative">
              {/* Handwritten annotation */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 1.8 }}
                className="absolute -top-4 sm:-top-6 -left-2 sm:-left-4 z-20"
              >
                <div className="bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg px-2 sm:px-3 py-1 shadow-lg transform -rotate-2">
                  <p className="text-xs sm:text-sm font-caveat text-yellow-800 dark:text-yellow-200">
                    &quot;So organized!&quot;
                  </p>
                </div>
              </motion.div>

              <CardContent className="p-0">
                {/* Mobile Frame */}
                <div className="relative">
                  <div className="w-64 sm:w-80 lg:w-96 h-[500px] sm:h-[600px] lg:h-[700px] bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2rem] sm:rounded-[3rem] p-1 sm:p-2 shadow-2xl">
                    <div className="w-full h-full bg-white dark:bg-gray-800 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
                      {/* Status Bar */}
                      <div className="h-6 sm:h-8 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-between px-4 sm:px-6 text-xs text-gray-600 dark:text-gray-400">
                        <span>9:41</span>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-1.5 sm:w-4 sm:h-2 bg-gray-400 rounded-sm"></div>
                          <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-gray-400 rounded-full"></div>
                        </div>
                      </div>

                      {/* App Content */}
                      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                        {/* Header */}
                        <div className="text-center">
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1">
                            FlowPilot
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Your AI Productivity Assistant
                          </p>
                        </div>

                        {/* Productivity Prediction with enhanced styling */}
                        <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-purple-100 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-purple-800/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-purple-200/50 dark:border-purple-700/30">
                          <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <h4 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">
                              Today&apos;s Productivity
                            </h4>
                            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="space-y-2 sm:space-y-3">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600 dark:text-gray-400">Peak Hours</span>
                              <span className="text-gray-900 dark:text-white font-medium">9:00 AM - 11:00 AM</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 sm:h-2">
                              <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-1.5 sm:h-2 rounded-full" style={{width: '85%'}}></div>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600 dark:text-gray-400">Focus Level</span>
                              <span className="text-purple-600 dark:text-purple-400 font-medium">85%</span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions with enhanced styling */}
                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200/50 dark:border-purple-700/30">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                              <Mic className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Add Task</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Voice or type</p>
                            </div>
                            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                          </div>

                          <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200/50 dark:border-green-700/30">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Ask AI</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Get insights</p>
                            </div>
                            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                          </div>
                        </div>

                        {/* Today's Tasks with enhanced styling */}
                        <div className="space-y-2 sm:space-y-3">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">
                            Today&apos;s Priority Tasks
                          </h4>
                          <div className="space-y-1.5 sm:space-y-2">
                            <div className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/20 rounded-lg border border-red-200/50 dark:border-red-700/30">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 flex-1 min-w-0">Prepare presentation</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">2:00 PM</span>
                            </div>
                            <div className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 bg-gradient-to-r from-yellow-50 to-yellow-100/50 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg border border-yellow-200/50 dark:border-yellow-700/30">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 flex-1 min-w-0">Team meeting</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">3:30 PM</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Floating Elements */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 2.0 }}
                    className="absolute -top-2 sm:-top-4 -right-2 sm:-right-4 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 180, 360]
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </motion.div>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 2.2 }}
                    className="absolute -bottom-2 sm:-bottom-4 -left-2 sm:-left-4 w-4 h-4 sm:w-6 sm:h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.3, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                    </motion.div>
                  </motion.div>
                  
                  {/* Additional decorative elements */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 2.4 }}
                    className="absolute top-1/3 -right-1 sm:-right-2 w-2 h-2 sm:w-3 sm:h-3 bg-purple-300 rounded-full opacity-60"
                  >
                    <motion.div
                      animate={{ 
                        y: [0, -10, 0],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 2.6 }}
                    className="absolute bottom-1/3 -left-0.5 sm:-left-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-300 rounded-full opacity-40"
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.4, 0.8, 0.4]
                      }}
                      transition={{ 
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}