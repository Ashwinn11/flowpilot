"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { AuthAPI } from "@/lib/auth-api";
import { AuthValidator } from "@/lib/auth-validation";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function ResetPasswordForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string[];
    isStrong: boolean;
    requirements: any;
  } | null>(null);
  const [validationError, setValidationError] = useState("");
  const [sessionCheck, setSessionCheck] = useState<{ loading: boolean; hasSession: boolean }>({ loading: true, hasSession: false });

  // Check for valid session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        setSessionCheck({ loading: false, hasSession: data.hasSession });
        
        if (!data.hasSession) {
          setValidationError('Invalid or expired reset link. Please request a new password reset.');
        }
      } catch (error) {
        console.error('Session check error:', error);
        setSessionCheck({ loading: false, hasSession: false });
        setValidationError('Unable to verify reset link. Please try again.');
      }
    };
    
    checkSession();
  }, []);

  // Update password strength when password changes
  useEffect(() => {
    if (password) {
      setPasswordStrength(AuthValidator.getPasswordStrength(password));
    } else {
      setPasswordStrength(null);
    }
  }, [password]);

  const getPasswordStrengthColor = () => {
    if (!passwordStrength) return 'bg-gray-200';
    if (passwordStrength.score >= 8) return 'bg-green-500';
    if (passwordStrength.score >= 6) return 'bg-blue-500';
    if (passwordStrength.score >= 4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getPasswordStrengthText = () => {
    if (!passwordStrength) return '';
    if (passwordStrength.score >= 8) return 'Very Strong';
    if (passwordStrength.score >= 6) return 'Strong';
    if (passwordStrength.score >= 4) return 'Medium';
    return 'Weak';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setValidationError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setValidationError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password strength
    const passwordValidation = AuthValidator.validatePassword(password);
    if (!passwordValidation.isValid) {
      setValidationError(AuthValidator.getErrorMessage(passwordValidation.errors));
      setLoading(false);
      return;
    }

    try {
      const result = await AuthAPI.resetPassword({
        password,
        confirmPassword
      });
      
      if (result?.success) {
        toast.success("Password reset successfully! You can now sign in with your new password.");
        router.push('/auth');
      } else {
        setValidationError(result?.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setValidationError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sessionCheck.loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Verifying reset link...</CardTitle>
          <CardDescription>
            Please wait while we verify your password reset link.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  if (!sessionCheck.hasSession) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
          <CardDescription>
            The password reset link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p>• Password reset links expire after 1 hour for security</p>
            <p>• Please request a new password reset link</p>
            <p>• Make sure to use the link within 1 hour of receiving it</p>
          </div>
          <div className="pt-4 space-y-3">
            <Link href="/forgot-password">
              <Button variant="gradient" className="w-full">
                Request New Reset Link
              </Button>
            </Link>
            <Link href="/auth">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to sign in
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Reset your password</CardTitle>
        <CardDescription>
          Enter your new password below. Make sure it&apos;s strong and secure.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
              New password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setValidationError(""); // Clear error when user types
                }}
                className={`pr-10 h-12 bg-white/80 backdrop-blur-sm border-2 ${
                  validationError 
                    ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400' 
                    : 'border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400'
                } dark:bg-slate-800/80`}
                autoComplete="new-password"
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

            {/* Password strength indicator */}
            {password && passwordStrength && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Password strength:</span>
                  <span className={`font-medium ${
                    passwordStrength.score >= 8 ? 'text-green-600 dark:text-green-400' :
                    passwordStrength.score >= 6 ? 'text-blue-600 dark:text-blue-400' :
                    passwordStrength.score >= 4 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {getPasswordStrengthText()}
                  </span>
                </div>
                <Progress 
                  value={passwordStrength.score * 10} 
                  className="h-2"
                />
                <div className={`h-1 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`} 
                     style={{ width: `${passwordStrength.score * 10}%` }} />
              </div>
            )}

            {/* Password requirements */}
            {password && passwordStrength && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Requirements:</p>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <span className={passwordStrength.requirements.length ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {passwordStrength.requirements.length ? '✓' : '✗'} 8+ chars
                  </span>
                  <span className="mx-1">•</span>
                  <span className={passwordStrength.requirements.lowercase ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {passwordStrength.requirements.lowercase ? '✓' : '✗'} <strong>a-z</strong>
                  </span>
                  <span className="mx-1">•</span>
                  <span className={passwordStrength.requirements.uppercase ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {passwordStrength.requirements.uppercase ? '✓' : '✗'} <strong>A-Z</strong>
                  </span>
                  <span className="mx-1">•</span>
                  <span className={passwordStrength.requirements.numbers ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {passwordStrength.requirements.numbers ? '✓' : '✗'} <strong>0-9</strong>
                  </span>
                  <span className="mx-1">•</span>
                  <span className={passwordStrength.requirements.special ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {passwordStrength.requirements.special ? '✓' : '✗'} <strong>!@#$%</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">
              Confirm new password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setValidationError(""); // Clear error when user types
                }}
                className={`pr-10 h-12 bg-white/80 backdrop-blur-sm border-2 ${
                  validationError 
                    ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400' 
                    : 'border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400'
                } dark:bg-slate-800/80`}
                autoComplete="new-password"
                required
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Passwords do not match
              </p>
            )}
          </div>

          {validationError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                {validationError}
              </p>
            </div>
          )}

          <Button
            type="submit"
            variant="gradient"
            className="w-full h-12"
            disabled={loading || !password || !confirmPassword || password !== confirmPassword || (passwordStrength ? !passwordStrength.isStrong : false)}
          >
            {loading ? "Resetting..." : "Reset password"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/auth">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to sign in
            </Button>
          </Link>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Security tip:</strong> Use a unique password that you don&apos;t use anywhere else.
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 