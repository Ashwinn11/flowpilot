import { Suspense } from "react";
import SignupWrapper from "@/components/auth/signup-wrapper";

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 relative overflow-hidden flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    }>
      <SignupWrapper />
    </Suspense>
  );
} 