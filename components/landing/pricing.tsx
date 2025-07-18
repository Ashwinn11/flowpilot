"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Rocket, Star, Users, Shield, Clock, BarChart3, Smartphone, Brain, Heart, Sparkles, Target, TrendingUp, ArrowRight, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    price: { monthly: "$0", yearly: "$0" },
    description: "Perfect for getting started",
    features: [
      "Up to 50 tasks per month",
      "Basic AI scheduling",
      "Mobile app access",
      "Email support"
    ],
    icon: Rocket,
    color: "blue",
    emotion: "Getting Started",
    tagline: "Start your journey",
    popular: false
  },
  {
    name: "Pro",
    price: { monthly: "$12", yearly: "$120" },
    description: "For power users and teams",
    features: [
      "Unlimited tasks",
      "Advanced AI scheduling",
      "Priority support",
      "Team collaboration",
      "Analytics dashboard",
      "Custom integrations"
    ],
    icon: Crown,
    color: "purple",
    emotion: "Most Popular",
    tagline: "Unlock your potential",
    popular: true
  },
  {
    name: "Enterprise",
    price: { monthly: "$29", yearly: "$290" },
    description: "For large organizations",
    features: [
      "Everything in Pro",
      "Advanced security",
      "Custom onboarding",
      "Dedicated support",
      "API access",
      "White-label options"
    ],
    icon: Star,
    color: "yellow",
    emotion: "Enterprise Ready",
    tagline: "Scale with confidence",
    popular: false
  }
];

export function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <section id="pricing" className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 dark:from-slate-900 dark:via-purple-950/30 dark:to-blue-950/20 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-20 h-20 sm:w-40 sm:h-40 bg-purple-200/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-16 h-16 sm:w-32 sm:h-32 bg-blue-200/15 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-r from-purple-200/10 to-blue-200/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
            Choose Your Flow
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
            Start free, scale as you grow. No hidden fees, no surprises.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative w-14 h-7 sm:w-16 sm:h-8 rounded-full transition-colors duration-300 ${
                billingCycle === 'yearly' ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <motion.div
                layout
                className={`absolute top-0.5 sm:top-1 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-md ${
                  billingCycle === 'yearly' ? 'right-0.5 sm:right-1' : 'left-0.5 sm:left-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
              Yearly
              <Badge className="ml-1 sm:ml-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs">
                Save 20%
              </Badge>
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="relative"
            >
              <Card className={`relative border-2 transition-all duration-300 hover:shadow-xl ${
                plan.popular 
                  ? 'border-purple-600 shadow-xl sm:scale-105' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600'
              }`}>
                
                {/* Gradient background for popular plan */}
                {plan.popular && (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 opacity-50"></div>
                )}

                {plan.popular && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 z-20"
                  >
                    <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 shadow-lg border-2 border-white dark:border-slate-800 text-xs sm:text-sm font-semibold">
                      <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                      MOST POPULAR
                    </Badge>
                  </motion.div>
                )}
                
                <CardHeader className="text-center pb-3 sm:pb-4 relative z-10 pt-6 sm:pt-8">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg"
                  >
                    <plan.icon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                  </motion.div>
                  
                  <Badge variant="secondary" className={`mb-2 bg-${plan.color}-100 text-${plan.color}-700 dark:bg-${plan.color}-900/30 dark:text-${plan.color}-300 text-xs sm:text-sm`}>
                    {plan.emotion}
                  </Badge>
                  
                  <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {plan.name}
                  </CardTitle>
                  
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-3 sm:mb-4 font-caveat">
                    {plan.tagline}
                  </p>
                  
                  <div className="mb-3 sm:mb-4">
                    <span className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">{plan.price[billingCycle]}</span>
                    <span className="text-sm sm:text-base text-slate-600 dark:text-slate-300">/month</span>
                  </div>
                  
                  <CardDescription className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0 relative z-10">
                  <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <motion.li 
                        key={featureIndex} 
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: featureIndex * 0.1 }}
                        className="flex items-start space-x-2 sm:space-x-3"
                      >
                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-600" />
                        </div>
                        <span className="text-sm sm:text-base text-slate-700 dark:text-slate-300">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>
                  
                  <Link href="/auth" className="w-full">
                    <Button 
                      className={`w-full group relative overflow-hidden ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white' 
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600'
                      }`}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {plan.name === "Free" ? "Get Started" : "Start Free Trial"}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                      {plan.popular && (
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      )}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">
            Questions? We&apos;ve got answers
          </h3>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Can&apos;t find what you&apos;re looking for? Contact our support team.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/auth" className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto group"
              >
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Contact Support
                </span>
              </Button>
            </Link>
            <a href="#faq" className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto group"
              >
                <span className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  View FAQ
                </span>
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 