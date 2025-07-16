"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, Brain, Clock } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="secondary" className="mb-6 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800">
            <Brain className="w-4 h-4 mr-2" />
            AI-Powered Productivity
          </Badge>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-6"
        >
          Master Your Day with{" "}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent"
          >
            Intelligent Planning
          </motion.span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed"
        >
          FlowPilot combines AI-powered task planning with voice input to help you stay focused and productive. 
          Transform scattered thoughts into organized action plans.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
        >
          <Link href="/auth">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white border-0 text-lg px-8 py-6">
                Start 7-Day Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          </Link>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No credit card required • Cancel anytime
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="relative max-w-3xl mx-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-teal-600/20 rounded-2xl blur-3xl"></div>
          <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-8 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Calendar,
                  title: "Smart Scheduling",
                  description: "AI analyzes your patterns to suggest optimal task timing",
                  color: "text-blue-600",
                  delay: 0.8
                },
                {
                  icon: Brain,
                  title: "Voice Planning",
                  description: "Speak your tasks naturally, AI organizes them instantly",
                  color: "text-teal-600",
                  delay: 0.9
                },
                {
                  icon: Clock,
                  title: "Flow States",
                  description: "Maintain focus with intelligent break suggestions",
                  color: "text-indigo-600",
                  delay: 1.0
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: feature.delay }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="text-center"
                >
                  <feature.icon className={`w-12 h-12 mx-auto mb-4 ${feature.color}`} />
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}