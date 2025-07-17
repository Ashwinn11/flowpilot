"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/contexts/auth-context";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const prevUser = useRef(user);
  const prevLoading = useRef(loading);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      if (prevUser.current !== user) {
        console.log("[DEBUG] ProtectedRoute user changed:", user);
        prevUser.current = user;
      }
      if (prevLoading.current !== loading) {
        console.log("[DEBUG] ProtectedRoute loading changed:", loading);
        prevLoading.current = loading;
      }
    }
  }, [user, loading]);

  // Memoize the auth state to prevent unnecessary re-renders
  const authState = useMemo(() => ({
    isAuthenticated: !!user,
    isLoading: loading
  }), [user, loading]);

  useEffect(() => {
    if (!authState.isLoading && !authState.isAuthenticated) {
      router.push("/auth");
    }
  }, [authState.isAuthenticated, authState.isLoading, router]);

  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}