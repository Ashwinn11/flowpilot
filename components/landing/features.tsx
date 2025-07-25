"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Mic, 
  Brain, 
  Calendar, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Play,
  Zap,
  Target,
  BarChart3,
  RefreshCw,
  Smartphone,
  MessageSquare,
  Bell,
  Plus,
  Search,
  Sparkles,
  ArrowRight
} from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Voice-Powered Task Management",
    description: "Add tasks naturally with your voice. FlowPilot understands context and automatically categorizes your tasks.",
    accent: "Effortlessly",
    color: "purple",
    gradient: "from-purple-500 to-purple-600",
    bgGradient: "from-purple-50 to-purple-100",
    darkBgGradient: "from-purple-900/20 to-purple-800/20",
    details: [
      "Natural voice commands and dictation",
      "Automatic task categorization",
      "Context-aware task creation",
      "Multi-language support"
    ],
    mobileContent: {
      header: "Voice Tasks",
      status: "Listening...",
      tasks: [
        { text: "Schedule team meeting for tomorrow", status: "scheduled" },
        { text: "Review quarterly reports", status: "pending" },
        { text: "Call client about project updates", status: "completed" }
      ],
      notification: "Task added successfully!"
    }
  },
  {
    icon: Brain,
    title: "AI-Powered Productivity Insights",
    description: "Get intelligent recommendations for optimal task scheduling and productivity patterns.",
    accent: "Intelligently",
    color: "blue",
    gradient: "from-blue-500 to-blue-600",
    bgGradient: "from-blue-50 to-blue-100",
    darkBgGradient: "from-blue-900/20 to-blue-800/20",
    details: [
      "Smart task prioritization",
      "Productivity pattern analysis",
      "Optimal scheduling recommendations",
      "Performance insights and trends"
    ],
    mobileContent: {
      header: "AI Insights",
      status: "Analyzing...",
      tasks: [
        { text: "Peak productivity: 9-11 AM", status: "optimized" },
        { text: "Focus on high-priority tasks", status: "recommended" },
        { text: "Schedule breaks every 90 min", status: "completed" }
      ],
      notification: "Your productivity is up 25%!"
    }
  },
  {
    icon: Calendar,
    title: "Seamless Calendar Integration",
    description: "Connect your existing calendar and let FlowPilot optimize your schedule automatically.",
    accent: "Seamlessly",
    color: "green",
    gradient: "from-green-500 to-green-600",
    bgGradient: "from-green-50 to-green-100",
    darkBgGradient: "from-green-900/20 to-green-800/20",
    details: [
      "Multi-calendar synchronization",
      "Automatic conflict resolution",
      "Smart time blocking",
      "Real-time schedule updates"
    ],
    mobileContent: {
      header: "Calendar Sync",
      status: "Connected",
      tasks: [
        { text: "Team meeting rescheduled", status: "scheduled" },
        { text: "Client call confirmed", status: "completed" },
        { text: "Focus time blocked", status: "optimized" }
      ],
      notification: "Calendar synced perfectly!"
    }
  }
];

export function Features() {
  return (
    <section id="features" className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-blue-950/30 dark:to-purple-950/20 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-20 h-20 sm:w-32 sm:h-32 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-16 h-16 sm:w-24 sm:h-24 bg-purple-200/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 sm:w-20 sm:h-20 bg-green-200/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-40 right-1/3 w-8 h-8 sm:w-16 sm:h-16 bg-yellow-200/20 rounded-full blur-xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0 }}
          className="text-center mb-12 sm:mb-16"
        >
          <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 dark:from-blue-900/40 dark:to-purple-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-700 mb-4 text-xs sm:text-sm">
            <Sparkles className="w-3 h-3 mr-1" />
            Powerful Features
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
            Everything you need to
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400"> stay productive</span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
            FlowPilot combines cutting-edge AI with intuitive design to transform how you manage your time and tasks.
          </p>
        </motion.div>

        <div className="space-y-12 sm:space-y-16">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, delay: index * 0.2 }}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center ${
                index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
              }`}
            >
              {/* Content */}
              <motion.div 
                initial={{ opacity: 0, x: index % 2 === 1 ? 50 : -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.0, delay: 0.3 }}
                className={`space-y-4 sm:space-y-6 ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}
              >
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="flex items-center gap-2 sm:gap-3"
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                    <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <Badge variant="secondary" className={`bg-gradient-to-r ${feature.bgGradient} dark:${feature.darkBgGradient} text-${feature.color}-700 dark:text-${feature.color}-300 border border-${feature.color}-200 dark:border-${feature.color}-700 font-caveat text-sm sm:text-base`}>
                    {feature.accent}
                  </Badge>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                >
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-4 sm:mb-6">
                    {feature.description}
                  </p>
                  
                  <ul className="space-y-2 sm:space-y-3">
                    {feature.details.map((detail, detailIndex) => (
                      <motion.li 
                        key={detailIndex} 
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.9 + detailIndex * 0.1 }}
                        className="flex items-start space-x-2 sm:space-x-3"
                      >
                        <div className={`w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r ${feature.gradient} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                        </div>
                        <span className="text-sm sm:text-base text-slate-700 dark:text-slate-300">{detail}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              </motion.div>

              {/* Mobile Demo */}
              <motion.div 
                initial={{ opacity: 0, x: index % 2 === 1 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.0, delay: 0.4 }}
                className={`relative ${index % 2 === 1 ? 'lg:col-start-1' : ''}`}
              >
                <motion.div 
                  whileHover={{ 
                    scale: 1.02,
                    rotateY: 2,
                    rotateZ: 1
                  }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  {/* Phone frame */}
                  <motion.div 
                    animate={{ 
                      y: [0, -8, 0],
                      rotateY: [0, 1, 0]
                    }}
                    transition={{ 
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-56 h-72 sm:w-72 sm:h-96 mx-auto bg-gradient-to-b from-slate-800 via-slate-700 to-slate-900 rounded-[2rem] sm:rounded-[3rem] border-6 sm:border-8 border-slate-600 shadow-2xl relative overflow-hidden"
                  >
                    {/* Screen */}
                    <div className="absolute inset-1.5 sm:inset-2 bg-gradient-to-b from-white to-gray-50 dark:from-slate-800 dark:to-slate-700 rounded-xl sm:rounded-2xl overflow-hidden">
                      {/* Header */}
                      <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className={`bg-gradient-to-r ${feature.gradient} p-3 sm:p-4 text-white relative overflow-hidden`}
                      >
                        <div className="absolute inset-0 opacity-20">
                          <motion.div 
                            animate={{ 
                              scale: [1, 1.2, 1],
                              opacity: [0.2, 0.4, 0.2]
                            }}
                            transition={{ 
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="absolute top-1 sm:top-2 right-1 sm:right-2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"
                          />
                          <motion.div 
                            animate={{ 
                              scale: [1, 1.5, 1],
                              opacity: [0.2, 0.6, 0.2]
                            }}
                            transition={{ 
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between relative z-10">
                          <div>
                            <h4 className="font-semibold text-white text-base sm:text-lg">
                              {feature.mobileContent.header}
                            </h4>
                            <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                              <motion.div 
                                animate={{ 
                                  scale: [1, 1.2, 1],
                                  opacity: [0.4, 1, 0.4]
                                }}
                                transition={{ 
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                                className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full"
                              />
                              <p className="text-xs text-white/90">
                                {feature.mobileContent.status}
                              </p>
                            </div>
                          </div>
                          <motion.div
                            animate={{ 
                              rotate: [0, 10, -10, 0]
                            }}
                            transition={{ 
                              duration: 3,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          >
                            <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </motion.div>
                        </div>
                      </motion.div>
                      
                      {/* Content */}
                      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                        {feature.mobileContent.tasks.map((task, taskIndex) => (
                          <motion.div
                            key={taskIndex}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.8 + taskIndex * 0.1 }}
                            whileHover={{ 
                              scale: 1.01,
                              x: 3
                            }}
                            className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700 dark:to-gray-600/50 rounded-lg p-2 sm:p-3 border border-gray-200/50 dark:border-gray-600/30 relative overflow-hidden"
                          >
                            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                              <motion.div 
                                animate={{ 
                                  scale: [1, 1.2, 1],
                                  opacity: [0.6, 1, 0.6]
                                }}
                                transition={{ 
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                                  task.status === 'completed' ? 'bg-green-500' :
                                  task.status === 'scheduled' ? 'bg-blue-500' :
                                  task.status === 'pending' ? 'bg-yellow-500' :
                                  task.status === 'optimized' ? 'bg-purple-500' :
                                  task.status === 'recommended' ? 'bg-orange-500' :
                                  'bg-gray-500'
                                }`}
                              />
                              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                {task.status}
                              </span>
                            </div>
                            
                            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">
                              {task.text}
                            </p>
                            
                            {task.status === 'completed' && (
                              <motion.div 
                                initial={{ width: 0 }}
                                whileInView={{ width: "100%" }}
                                transition={{ duration: 1.0, delay: 1.0 + taskIndex * 0.1 }}
                                className="h-0.5 sm:h-1 bg-green-500 rounded-full mt-1.5 sm:mt-2"
                              />
                            )}
                          </motion.div>
                        ))}
                        
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.8, delay: 1.2 }}
                          whileHover={{ 
                            scale: 1.02,
                            rotateZ: 1
                          }}
                          className={`bg-gradient-to-r ${feature.bgGradient} dark:${feature.darkBgGradient} rounded-lg p-2 sm:p-3 border border-${feature.color}-200/50 dark:border-${feature.color}-700/30 relative overflow-hidden`}
                        >
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <motion.div
                              animate={{ 
                                rotate: [0, 180, 360]
                              }}
                              transition={{ 
                                duration: 4,
                                repeat: Infinity,
                                ease: "linear"
                              }}
                            >
                              <Sparkles className={`w-3 h-3 sm:w-4 sm:h-4 text-${feature.color}-500 dark:text-${feature.color}-400`} />
                            </motion.div>
                            <p className="text-xs sm:text-sm text-gray-900 dark:text-white font-caveat text-sm sm:text-base">
                              &quot;{feature.mobileContent.notification}&quot;
                            </p>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Floating elements */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    animate={{ 
                      y: [0, -12, 0],
                      rotate: [0, 180, 360]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1.4
                    }}
                    className="absolute -top-3 sm:-top-4 -right-3 sm:-right-4 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full shadow-lg"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    animate={{ 
                      y: [0, 12, 0],
                      rotate: [0, -180, -360]
                    }}
                    transition={{ 
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1.6
                    }}
                    className="absolute -bottom-3 sm:-bottom-4 -left-3 sm:-left-4 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full shadow-lg"
                  />
                  
                  {/* Handwritten annotation */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 1.8 }}
                    whileHover={{ 
                      scale: 1.05,
                      rotateZ: 3
                    }}
                    className="absolute -bottom-6 sm:-bottom-8 -right-6 sm:-right-8 z-10"
                  >
                    <div className={`bg-gradient-to-r from-${feature.color}-100 to-${feature.color}-200 dark:from-${feature.color}-900/40 dark:to-${feature.color}-800/40 border-2 border-${feature.color}-300 dark:border-${feature.color}-600 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 shadow-lg transform rotate-3`}>
                      <p className={`text-sm sm:text-base font-caveat text-${feature.color}-800 dark:text-${feature.color}-200 font-semibold`}>
                        &quot;{feature.accent} amazing!&quot;
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-12"
        >
          <Link href="/auth" className="w-full sm:w-auto">
            <Button 
              size="lg" 
              variant="gradient" 
              className="group relative overflow-hidden w-full sm:w-auto"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started Free
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </Button>
          </Link>
          <a href="#pricing" className="w-full sm:w-auto">
            <Button 
              size="lg" 
              variant="outline" 
              className="group w-full sm:w-auto"
            >
              <span className="flex items-center gap-2">
                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                See Pricing
              </span>
            </Button>
          </a>
        </motion.div>
      </div>
    </section>
  );
}