"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { GoogleIcon, MicrosoftIcon } from "@/components/ui/icons";
import { Mail, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { AuthAPI } from "@/lib/auth-api";
import { AuthValidator, AuthErrorMessages } from "@/lib/auth-validation";

export function AuthForm() {
  const { user, signInWithGoogle, signInWithMicrosoft, signInWithEmail } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showOAuthMessage, setShowOAuthMessage] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    if (user) {
      console.log('AuthForm: User detected, redirecting to dashboard', user.email);
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSignInClick = async () => {
    if (!email) {
      toast.error(AuthErrorMessages.EMAIL_REQUIRED);
      return;
    }

    setLoading(true);
    setEmailChecked(false);
    setProvider(null);
    setEmailError(null);
    setShowPasswordField(false);
    setShowOAuthMessage(false);
    setIsNewUser(false);

    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setEmailChecked(true);

      if (!data.exists) {
        // Check if we have a message indicating the secure fallback
        if (data.message) {
          // Secure fallback - show generic message
          setEmailError(data.message);
          setShowPasswordField(false);
          setProvider(null);
        } else {
          // New user - redirect to signup with pre-filled email
          setIsNewUser(true);
          toast.info(AuthErrorMessages.NEW_USER_REDIRECT);
          router.push(`/signup?email=${encodeURIComponent(email)}`);
        }
      } else if (data.provider === 'google' || data.provider === 'microsoft') {
        // OAuth user - show message to use OAuth
        setProvider(data.provider);
        setShowOAuthMessage(true);
        setEmailError(null);
      } else if (data.provider === 'password') {
        // Manual user - show password field
        setShowPasswordField(true);
        setProvider(null);
        setEmailError(null);
      } else {
        setEmailError('This email is registered, but the provider is unknown.');
        setShowPasswordField(false);
        setProvider(null);
      }
    } catch (e) {
      setEmailError('Could not check email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      // Don't show success toast here - let the dashboard handle it for new users
      // or show it only for returning users
      // The auth context will handle the session and redirect automatically
    } catch (error: any) {
      console.error('Auth error:', error);
      // Handle specific error types
      if (error.message?.includes('Email not confirmed')) {
        toast.error('Please verify your email address before signing in. Check your inbox for a verification link.');
      } else if (error.message?.includes('Invalid login credentials')) {
        toast.error('Invalid email or password. Please check your credentials and try again.');
      } else {
        toast.error('Sorry, we couldn\'t sign you in. Double-check your details and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = useCallback(async () => {
    try {
      // Validate email if provided
      if (email) {
        const emailValidation = AuthValidator.validateEmail(email);
        if (!emailValidation.isValid) {
          toast.error('Please enter a valid email address');
          return;
        }
      }

      const result = await signInWithGoogle();
      if (result && !result.success) {
        toast.error(result.error || 'Google sign-in failed. Please try again.');
        return;
      }
      // Success toast will be handled by the auth context or dashboard
    } catch (error) {
      toast.error('Google sign-in failed. Please try again.');
      console.error('OAuth error:', error);
    } finally {
      setLoading(false);
    }
  }, [email, signInWithGoogle]);

  const handleMicrosoftSignIn = useCallback(async () => {
    try {
      // Validate email if provided
      if (email) {
        const emailValidation = AuthValidator.validateEmail(email);
        if (!emailValidation.isValid) {
          toast.error('Please enter a valid email address');
          return { success: false, error: 'Invalid email address' };
        }
      }

      const result = await signInWithMicrosoft();
      if (result && !result.success) {
        toast.error(result.error || 'Microsoft sign-in failed. Please try again.');
        return;
      }
      // Success toast will be handled by the auth context or dashboard
    } catch (error) {
      toast.error('Microsoft sign-in failed. Please try again.');
      console.error('OAuth error:', error);
    } finally {
      setLoading(false);
    }
  }, [email, signInWithMicrosoft]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Button
          variant="outline"
          className="w-full h-12 bg-white/80 backdrop-blur-sm hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border-2 border-gray-200 dark:border-gray-700"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <GoogleIcon className="w-5 h-5 mr-3" />
          Continue with Google
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 bg-white/80 backdrop-blur-sm hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border-2 border-gray-200 dark:border-gray-700"
          onClick={handleMicrosoftSignIn}
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
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailChecked(false);
                setProvider(null);
                setEmailError(null);
                setShowPasswordField(false);
                setShowOAuthMessage(false);
                setIsNewUser(false);
              }}
              className="pl-10 h-12 bg-white/80 backdrop-blur-sm border-2 border-gray-200 dark:bg-slate-800/80 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400"
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Sign In Button - shows after email entry */}
        {email && !emailChecked && !loading && (
          <Button
            type="button"
            variant="gradient"
            className="w-full h-12"
            onClick={handleSignInClick}
          >
            Sign In
          </Button>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{AuthErrorMessages.CHECKING_ACCOUNT}</p>
          </div>
        )}

        {/* OAuth User Message */}
        {showOAuthMessage && provider && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Account Found
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                  This email is registered with {provider.charAt(0).toUpperCase() + provider.slice(1)}. Please use the {provider.charAt(0).toUpperCase() + provider.slice(1)} button above to sign in.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => provider === 'google' ? signInWithGoogle() : signInWithMicrosoft()}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/30"
                >
                  {provider === 'google' ? (
                    <>
                      <GoogleIcon className="w-4 h-4 mr-2" />
                      Sign in with Google
                    </>
                  ) : (
                    <>
                      <MicrosoftIcon className="w-4 h-4 mr-2" />
                      Sign in with Microsoft
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {emailChecked && emailError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center text-sm text-red-600 dark:text-red-400">
            {emailError}
          </div>
        )}

        {/* Password Field for Manual Users */}
        {showPasswordField && (
          <>
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
                  disabled={loading}
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
            
            {/* Forgot Password Link */}
            <div className="text-right">
              <Link 
                href={`/forgot-password?email=${encodeURIComponent(email)}`}
                className="text-sm text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
              >
                Forgot your password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full h-12"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </>
        )}
      </form>

      {/* New User Section - only show if no email checked yet */}
      {!emailChecked && (
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
      )}

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