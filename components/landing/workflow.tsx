"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, CheckCircle, ArrowRight, TrendingUp, Zap, X, AlertCircle, Star, Target, Sparkles, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Workflow() {
  return (
    <section id="workflow" className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 dark:from-slate-900 dark:via-purple-950/30 dark:to-blue-950/20 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 right-10 w-20 h-20 sm:w-40 sm:h-40 bg-purple-200/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-16 h-16 sm:w-32 sm:h-32 bg-blue-200/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 sm:w-60 sm:h-60 bg-gradient-to-r from-purple-200/10 to-blue-200/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 px-3 sm:px-4 py-2 rounded-full mb-4 sm:mb-6"
          >
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300">How It Works</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6"
          >
            From Chaos to{" "}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Clarity
            </span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4"
          >
            See how FlowPilot transforms your scattered productivity into focused, AI-powered success
          </motion.p>
        </div>

        {/* Before, Magic, and After Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-center">
          {/* Before State */}
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative order-1 lg:order-1"
          >
            {/* Caveat font text on top */}
            <div className="text-center mb-3 sm:mb-4">
              <span className="font-caveat text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
                Chaos
              </span>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-200 dark:border-gray-700 relative overflow-hidden">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 text-center">Before FlowPilot</h3>
              
              <div className="relative h-48 sm:h-56 lg:h-64">
                {/* Rotated scattered chips */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="absolute top-2 sm:top-4 left-2 sm:left-4 transform rotate-12"
                >
                  <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-2 sm:p-3 border-2 border-red-300 dark:border-red-600 shadow-md">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <X className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-red-700 dark:text-red-300 font-medium">
                        Forgotten tasks
                      </span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="absolute top-12 sm:top-16 right-3 sm:right-6 transform -rotate-6"
                >
                  <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-2 sm:p-3 border-2 border-orange-300 dark:border-orange-600 shadow-md">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-orange-700 dark:text-orange-300 font-medium">
                        Robotic reminders
                      </span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 transform rotate-8"
                >
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-2 sm:p-3 border-2 border-yellow-300 dark:border-yellow-600 shadow-md">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <X className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                        Scattered tools
                      </span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.9 }}
                  className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 transform -rotate-12"
                >
                  <div className="bg-pink-100 dark:bg-pink-900/30 rounded-lg p-2 sm:p-3 border-2 border-pink-300 dark:border-pink-600 shadow-md">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <X className="w-3 h-3 sm:w-4 sm:h-4 text-pink-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-pink-700 dark:text-pink-300 font-medium">
                        Zero focus
                      </span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 1.1 }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-3"
                >
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2 sm:p-3 border-2 border-gray-300 dark:border-gray-600 shadow-md">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <X className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">
                        Manual planning
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Magic Happens Here Section - Enhanced */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.0, delay: 0.6 }}
            className="flex flex-col items-center justify-center order-2 lg:order-2 my-6 lg:my-0"
          >
            {/* Enhanced arrow with animation */}
            <div className="bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full p-4 sm:p-6 shadow-lg border-2 border-purple-200 dark:border-purple-700 relative overflow-hidden">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <svg width="60" height="30" viewBox="0 0 80 40" className="transform sm:w-20 sm:h-10">
                  <path
                    d="M10 20 Q25 10 40 20 Q55 30 70 20 L70 20 L60 10 M70 20 L60 30"
                    stroke="url(#arrowGradient)"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <defs>
                    <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
              </motion.div>
              
              {/* Floating sparkles around the arrow */}
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2"
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
              </motion.div>
              
              <motion.div
                animate={{ 
                  rotate: -360,
                  scale: [1, 1.3, 1]
                }}
                transition={{ 
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute -bottom-1 sm:-bottom-2 -left-1 sm:-left-2"
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
              </motion.div>
            </div>
          </motion.div>

          {/* After State */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative order-3 lg:order-3"
          >
            {/* Caveat font text on top */}
            <div className="text-center mb-3 sm:mb-4">
              <span className="font-caveat text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                Clarity
              </span>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-200 dark:border-gray-700 relative overflow-hidden">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 text-center">With FlowPilot</h3>
              
              <div className="relative h-48 sm:h-56 lg:h-64">
                {/* Rotated organized chips */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="absolute top-2 sm:top-4 left-2 sm:left-4 transform rotate-3"
                >
                  <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-2 sm:p-3 border-2 border-green-300 dark:border-green-600 shadow-md">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-green-700 dark:text-green-300 font-medium">
                        Smart reminders
                      </span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="absolute top-12 sm:top-16 right-3 sm:right-6 transform -rotate-2"
                >
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2 sm:p-3 border-2 border-blue-300 dark:border-blue-600 shadow-md">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Target className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 font-medium">
                        Laser focus
                      </span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 transform rotate-1"
                >
                  <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-2 sm:p-3 border-2 border-purple-300 dark:border-purple-600 shadow-md">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-purple-700 dark:text-purple-300 font-medium">
                        Unified tools
                      </span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.9 }}
                  className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 transform -rotate-1"
                >
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-lg p-2 sm:p-3 border-2 border-emerald-300 dark:border-emerald-600 shadow-md">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                        AI planning
                      </span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 1.1 }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-2"
                >
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-lg p-2 sm:p-3 border-2 border-indigo-300 dark:border-indigo-600 shadow-md">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                        Peak performance
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Success Story Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-12 sm:mt-16">
          {[
            {
              title: "Time Saver",
              description: "Save 2+ hours daily",
              icon: Clock,
              color: "blue",
              gradient: "from-blue-500 to-blue-600",
              bgGradient: "from-blue-50 to-blue-100",
              darkBgGradient: "from-blue-900/20 to-blue-800/20"
            },
            {
              title: "Pure Focus",
              description: "Zero distractions",
              icon: Target,
              color: "purple",
              gradient: "from-purple-500 to-purple-600",
              bgGradient: "from-purple-50 to-purple-100",
              darkBgGradient: "from-purple-900/20 to-purple-800/20"
            },
            {
              title: "Unstoppable",
              description: "Achieve more daily",
              icon: TrendingUp,
              color: "green",
              gradient: "from-green-500 to-green-600",
              bgGradient: "from-green-50 to-green-100",
              darkBgGradient: "from-green-900/20 to-green-800/20"
            }
          ].map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
              whileHover={{ 
                scale: 1.05,
                rotateY: 5
              }}
              className={`bg-gradient-to-br ${card.bgGradient} dark:${card.darkBgGradient} rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-${card.color}-200/50 dark:border-${card.color}-700/30 shadow-lg relative overflow-hidden`}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${card.gradient} rounded-xl flex items-center justify-center shadow-md`}>
                  <card.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
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
                  <Sparkles className={`w-4 h-4 sm:w-5 sm:h-5 text-${card.color}-400`} />
                </motion.div>
              </div>
              
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                {card.title}
              </h4>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                {card.description}
              </p>
              
              {/* Handwritten annotation */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                className="absolute top-2 right-2"
              >
                <div className={`bg-gradient-to-r from-${card.color}-100 to-${card.color}-200 dark:from-${card.color}-900/40 dark:to-${card.color}-800/40 border border-${card.color}-300 dark:border-${card.color}-600 rounded-lg px-2 sm:px-3 py-1 shadow-md transform rotate-3`}>
                  <p className={`text-xs sm:text-sm font-caveat text-${card.color}-800 dark:text-${card.color}-200 font-semibold`}>
                    &quot;{card.title}&quot;
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.5 }}
          className="text-center mt-12 sm:mt-16"
        >
          <Link href="/auth">
            <Button 
              size="lg"
              variant="gradient" 
              className="group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Your Transformation
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}