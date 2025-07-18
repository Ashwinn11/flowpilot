"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { GoogleIcon, MicrosoftIcon } from "@/components/ui/icons";
import { Mail, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export function AuthForm() {
  const { user, signInWithGoogle, signInWithMicrosoft, signInWithEmail } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await signInWithEmail(email, password);
      toast.success('Welcome back! You\'ve signed in successfully.');
    } catch (error: any) {
      toast.error('Sorry, we couldn\'t sign you in. Double-check your details and try again.');
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'microsoft') => {
    try {
      setLoading(true);
      let result;
      if (provider === 'google') {
        result = await signInWithGoogle();
      } else {
        result = await signInWithMicrosoft();
      }
      if (result && !result.success) {
        toast.error(result.error || `Oops! Signing in with ${provider} didn't work. Please try again.`);
        return;
      }
    } catch (error) {
      toast.error(`Oops! Signing in with ${provider} didn't work. Please try again.`);
      console.error('OAuth error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Button
          variant="outline"
          className="w-full h-12 bg-white/80 backdrop-blur-sm hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border-2 border-gray-200 dark:border-gray-700"
          onClick={() => handleOAuthLogin("google")}
          disabled={loading}
        >
          <GoogleIcon className="w-5 h-5 mr-3" />
          Continue with Google
        </Button>
        
        <Button
          variant="outline"
          className="w-full h-12 bg-white/80 backdrop-blur-sm hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border-2 border-gray-200 dark:border-gray-700"
          onClick={() => handleOAuthLogin("microsoft")}
          disabled={loading}
        >
          <MicrosoftIcon className="w-5 h-5 mr-3" />
          Continue with Microsoft
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-2 text-gray-500 dark:text-gray-400">Or continue with</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 bg-white/80 backdrop-blur-sm border-2 border-gray-200 dark:bg-slate-800/80 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10 h-12 bg-white/80 backdrop-blur-sm border-2 border-gray-200 dark:bg-slate-800/80 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400"
              autoComplete="current-password"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <Button
          type="submit"
          variant="gradient"
          className="w-full h-12"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      {/* Signup Section */}
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-2 text-gray-500 dark:text-gray-400">New to FlowPilot?</span>
          </div>
        </div>

        <Link href="/signup">
          <Button
            variant="outline"
            className="w-full h-12 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 dark:hover:from-purple-900/30 dark:hover:to-blue-900/30 border-2 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200"
          >
            Create your account
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Start your 7-day free trial • No credit card required
        </p>
      </div>

      <Card className="border-purple-200 bg-purple-50/80 backdrop-blur-sm dark:bg-purple-900/20 dark:border-purple-800">
        <CardContent className="p-4">
          <p className="text-sm text-purple-800 dark:text-purple-200 text-center">
            <strong>7-day free trial</strong> • No credit card required • Cancel anytime
          </p>
        </CardContent>
      </Card>
    </div>
  );
}