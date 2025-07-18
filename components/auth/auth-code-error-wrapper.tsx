"use client";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, Mail } from "lucide-react";
import Link from "next/link";

export default function AuthCodeErrorWrapper() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const getErrorMessage = () => {
    if (error === 'access_denied' && errorDescription?.includes('expired')) {
      return 'The verification link has expired. Please request a new one.';
    }
    if (error === 'access_denied') {
      return 'The verification link is invalid or has expired.';
    }
    return 'There was an error verifying your email. Please try again.';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-purple-900/20 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-xl">Verification Error</CardTitle>
            <CardDescription>
              {getErrorMessage()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p>• Check that you clicked the correct link from your email</p>
              <p>• Make sure the link hasn&apos;t expired (links expire after 1 hour)</p>
              <p>• Try signing in with your email and password</p>
            </div>
            
            <div className="pt-4 space-y-3">
              <Link href="/auth">
                <Button variant="gradient" className="w-full">
                  Try signing in
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              
              <Link href="/forgot-password">
                <Button variant="outline" className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Request new verification email
                </Button>
              </Link>
              
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Still having trouble? Contact our support team.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 