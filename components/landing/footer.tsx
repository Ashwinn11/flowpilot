"use client";

import { motion } from "framer-motion";
import { Zap, Linkedin, Twitter, Instagram, Heart, Sparkles, ArrowRight, Star, Play } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-br from-slate-900 to-purple-950 dark:from-gray-950 dark:to-slate-900 text-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 bg-purple-500 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-blue-500 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-purple-400 rounded-full blur-lg"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Main CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            
            <h3 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Life?
            </h3>
            <p className="text-xl text-purple-100 mb-6 font-caveat">
              &quot;Stop drowning in chaos. Start flowing with purpose.&quot;
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/auth">
                <Button 
                  size="lg" 
                  variant="glass" 
                  className="group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Sign Up
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="group border-white/30 text-white hover:bg-white/10"
              >
                <span className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Watch Demo
                </span>
              </Button>
            </div>
            
            <p className="text-purple-200 mt-4 text-sm">
              No credit card required • 7-day free trial
            </p>
          </div>
        </motion.div>
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="md:col-span-2"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">
                FlowPilot
              </span>
            </div>
            <p className="text-purple-200 mb-6 max-w-md">
              Your personal AI productivity companion. Stop drowning in chaos. Start flowing with purpose.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              {[
                { icon: Linkedin, href: "#", label: "LinkedIn" },
                { icon: Twitter, href: "#", label: "Twitter" },
                { icon: Instagram, href: "#", label: "Instagram" }
              ].map((social, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href={social.href} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all duration-300 border border-white/20">
                    <social.icon className="w-5 h-5 text-purple-200" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h4 className="text-lg font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-3">
              {[
                { name: "Features", href: "#features" },
                { name: "How it Works", href: "#workflow" },
                { name: "Pricing", href: "#pricing" },
                { name: "FAQ", href: "#faq" }
              ].map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className="text-purple-200 hover:text-white transition-colors duration-300 flex items-center gap-2 group">
                    <span>{link.name}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Company Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h4 className="text-lg font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-3">
              {[
                { name: "About Us", href: "/about" },
                { name: "Contact", href: "/contact" },
                { name: "Careers", href: "/careers" },
                { name: "Blog", href: "/blog" }
              ].map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className="text-purple-200 hover:text-white transition-colors duration-300 flex items-center gap-2 group">
                    <span>{link.name}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="border-t border-white/20 pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <p className="text-purple-200 text-sm">
                © 2024 FlowPilot. Made with 
              </p>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              >
                <Heart className="w-4 h-4 text-red-400" />
              </motion.div>
              <p className="text-purple-200 text-sm">
                for productive people.
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-purple-200 hover:text-white transition-colors text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-purple-200 hover:text-white transition-colors text-sm">
                Terms of Service
              </Link>
              <div className="flex items-center gap-1 text-purple-200 text-sm">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>Trusted by 10,000+ users</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}