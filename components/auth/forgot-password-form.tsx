"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { AuthAPI } from "@/lib/auth-api";
import { AuthValidator } from "@/lib/auth-validation";
import { toast } from "sonner";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { GoogleIcon } from "@/components/ui/icons";

export function ForgotPasswordForm() {
  const { signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [oauthOnly, setOauthOnly] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setValidationError("");
    setOauthOnly(false);
    setOauthProvider(null);

    // Validate email
    const emailValidation = AuthValidator.validateEmail(email);
    if (!emailValidation.isValid) {
      setValidationError(AuthValidator.getErrorMessage(emailValidation.errors));
      setLoading(false);
      return;
    }

    try {
      const result = await AuthAPI.forgotPassword(emailValidation.sanitizedData!.email);
      
      if (result?.success) {
        toast.success(result.message || 'Password reset email sent successfully!');
        setEmailSent(true);
      } else if (result?.error) {
        setValidationError(result.error);
        // Show Google sign-in suggestion for common errors
        if (
          result.error.toLowerCase().includes('no account found') ||
          result.error.toLowerCase().includes('invalid email')
        ) {
          setOauthOnly(true);
          setOauthProvider('google');
        }
      } else if (result?.code === 'oauth_only') {
        setOauthOnly(true);
        setOauthProvider(result.provider || 'google');
        setValidationError(result.error || '');
      } else {
        setValidationError(result?.error || 'Failed to send password reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setValidationError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-xl">Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a password reset link to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p>• Check your inbox for an email from FlowPilot</p>
            <p>• Click the link in the email to reset your password</p>
            <p>• The link will expire in 1 hour for security</p>
          </div>
          
          <div className="pt-4 space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setEmailSent(false);
                setEmail("");
              }}
            >
              Send another email
            </Button>
            
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
        <CardTitle className="text-2xl">Forgot your password?</CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
              Email address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setValidationError(""); // Clear error when user types
                }}
                className={`pl-10 h-12 bg-white/80 backdrop-blur-sm border-2 ${
                  validationError 
                    ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400' 
                    : 'border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400'
                } dark:bg-slate-800/80`}
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>
            {validationError && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {validationError}
              </p>
            )}
            {oauthOnly && (
              <Button
                type="button"
                variant="outline"
                className="w-full mt-2"
                onClick={() => signInWithGoogle()}
              >
                <span className="flex items-center justify-center">
                  <GoogleIcon className="w-5 h-5 mr-2" />
                  Sign in with Google
                </span>
              </Button>
            )}
          </div>

          <Button
            type="submit"
            variant="gradient"
            className="w-full h-12"
            disabled={loading || !email.trim()}
          >
            {loading ? "Sending..." : "Send reset link"}
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
            <strong>Can&apos;t find the email?</strong> Check your spam folder or try requesting another reset link.
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 