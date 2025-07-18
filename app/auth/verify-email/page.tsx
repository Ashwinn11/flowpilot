"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-purple-900/20 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-xl">Verify your email</CardTitle>
            <CardDescription>
              We&apos;ve sent a verification link to complete your account setup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p>• Check your inbox for an email from FlowPilot</p>
              <p>• Click the verification link in the email</p>
              <p>• Once verified, your account will be activated and you can sign in</p>
            </div>
            
            <div className="pt-4 space-y-3">
              <Link href="/auth">
                <Button variant="gradient" className="w-full">
                  Go to sign in
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              
              <div className="text-center">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                Didn&apos;t receive the email? Check your spam folder or contact support.
              </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 