import { AuthForm } from "@/components/auth/auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Zap } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 dark:from-slate-900 dark:via-purple-950/30 dark:to-blue-950/20 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-20 h-20 sm:w-32 sm:h-32 bg-purple-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-16 h-16 sm:w-24 sm:h-24 bg-blue-200/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 sm:w-20 sm:h-20 bg-pink-200/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-40 right-1/3 w-10 h-10 sm:w-16 sm:h-16 bg-yellow-200/20 rounded-full blur-xl"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md space-y-6">
          <Link href="/" className="flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
          
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-md dark:bg-slate-800/80">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-base text-gray-600 dark:text-gray-300">
                Sign in to your FlowPilot account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuthForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 