import { Zap } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="px-4 sm:px-6 lg:px-8 py-16 bg-slate-900 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-3 mb-6 md:mb-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-teal-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">FlowPilot</span>
          </div>
          
          <div className="flex items-center space-x-8 text-sm text-slate-400">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/support" className="hover:text-white transition-colors">
              Support
            </Link>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
          <p>&copy; 2024 FlowPilot. All rights reserved. Built with AI-powered productivity in mind.</p>
        </div>
      </div>
    </footer>
  );
}