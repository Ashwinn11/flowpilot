import { Suspense } from "react";
import AuthCodeErrorWrapper from "@/components/auth/auth-code-error-wrapper";

export default function AuthCodeErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-purple-900/20 dark:to-slate-900 p-4">
        <div className="w-full max-w-md">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    }>
      <AuthCodeErrorWrapper />
    </Suspense>
  );
} 