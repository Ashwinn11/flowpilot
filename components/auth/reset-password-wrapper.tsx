"use client";
import { useSearchParams } from "next/navigation";
import { ResetPasswordForm } from "./reset-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordWrapper() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const error_code = searchParams.get("error_code");
  const error_description = searchParams.get("error_description");

  const hasError = error || error_code || error_description;
  const isExpired =
    error_code === "otp_expired" ||
    (error_description && error_description.includes("expired"));

  if (hasError && isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-purple-900/20 dark:to-slate-900 p-4">
        <div className="w-full max-w-md">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl">Reset Link Expired</CardTitle>
              <CardDescription>
                The password reset link has expired or is invalid.
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-purple-900/20 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <ResetPasswordForm />
      </div>
    </div>
  );
} 