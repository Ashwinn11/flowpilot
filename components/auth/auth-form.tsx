"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { GoogleIcon, MicrosoftIcon } from "@/components/ui/icons";
import { Mail, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function AuthForm() {
  const { user, signInWithGoogle, signInWithMicrosoft, signUpWithEmail, signInWithEmail } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
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
      if (isLogin) {
        await signInWithEmail(email, password);
        toast.success('Successfully signed in!');
      } else {
        await signUpWithEmail(email, password);
        toast.success('Account created! Please check your email to verify your account.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'microsoft') => {
    try {
      setLoading(true);
      if (provider === 'google') {
        await signInWithGoogle();
      } else {
        await signInWithMicrosoft();
      }
    } catch (error) {
      toast.error(`Failed to sign in with ${provider}`);
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
          className="w-full h-12 bg-white hover:bg-gray-50 dark:bg-slate-800 dark:hover:bg-slate-700"
          onClick={() => handleOAuthLogin("google")}
          disabled={loading}
        >
          <GoogleIcon className="w-5 h-5 mr-3" />
          Continue with Google
        </Button>
        
        <Button
          variant="outline"
          className="w-full h-12 bg-white hover:bg-gray-50 dark:bg-slate-800 dark:hover:bg-slate-700"
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
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={isLogin ? "Enter your password" : "Create a password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10 h-12"
              autoComplete={isLogin ? "current-password" : "new-password"}
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
          className="w-full h-12 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white"
          disabled={loading}
        >
          {loading ? "Starting your trial..." : isLogin ? "Sign In" : "Start Free Trial"}
        </Button>
      </form>

      <div className="text-center text-sm">
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="text-blue-600 hover:text-blue-500 font-medium"
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>

      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
            <strong>7-day free trial</strong> • No credit card required • Cancel anytime
          </p>
        </CardContent>
      </Card>
    </div>
  );
}