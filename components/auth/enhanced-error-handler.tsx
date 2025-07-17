"use client";

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Mail, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface AuthError {
  message: string;
  code?: string;
  type: 'validation' | 'authentication' | 'network' | 'rate_limit' | 'unknown';
  recoverable: boolean;
  retryAfter?: number;
}

interface AuthErrorHandlerProps {
  error: any;
  onRetry?: () => void;
  onClear?: () => void;
}

export function AuthErrorHandler({ error, onRetry, onClear }: AuthErrorHandlerProps) {
  const [parsedError, setParsedError] = useState<AuthError | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<number>(0);

  useEffect(() => {
    if (error) {
      setParsedError(parseAuthError(error));
    } else {
      setParsedError(null);
    }
  }, [error]);

  useEffect(() => {
    if (retryCountdown > 0) {
      const timer = setTimeout(() => {
        setRetryCountdown(retryCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [retryCountdown]);

  const parseAuthError = (error: any): AuthError => {
    if (!error) return { message: '', type: 'unknown', recoverable: false };

    const message = error.message || error.error || 'An unexpected error occurred';
    
    // Rate limiting errors
    if (message.includes('too many') || message.includes('rate limit') || error.status === 429) {
      return {
        message: 'Too many attempts. Please wait before trying again.',
        code: 'RATE_LIMITED',
        type: 'rate_limit',
        recoverable: true,
        retryAfter: error.retryAfter || 60
      };
    }

    // Authentication errors
    if (message.includes('Invalid login credentials') || message.includes('authentication')) {
      return {
        message: 'The email or password you entered is incorrect. Please double-check and try again.',
        code: 'INVALID_CREDENTIALS',
        type: 'authentication',
        recoverable: true
      };
    }

    // Email verification errors
    if (message.includes('Email not confirmed') || message.includes('verification')) {
      return {
        message: 'Please check your email and click the verification link before signing in.',
        code: 'EMAIL_NOT_VERIFIED',
        type: 'authentication',
        recoverable: true
      };
    }

    // Network errors
    if (message.includes('network') || message.includes('fetch') || error.status >= 500) {
      return {
        message: 'Connection issue. Please check your internet and try again.',
        code: 'NETWORK_ERROR',
        type: 'network',
        recoverable: true
      };
    }

    // Validation errors
    if (error.validationErrors || message.includes('validation') || message.includes('invalid')) {
      return {
        message: message,
        code: 'VALIDATION_ERROR',
        type: 'validation',
        recoverable: true
      };
    }

    // Default case
    return {
      message: 'Something went wrong. Please try again or contact support if the problem persists.',
      code: 'UNKNOWN_ERROR',
      type: 'unknown',
      recoverable: true
    };
  };

  const handleRetry = () => {
    if (parsedError?.retryAfter) {
      setRetryCountdown(parsedError.retryAfter);
    }
    onRetry?.();
  };

  const getErrorIcon = (type: AuthError['type']) => {
    switch (type) {
      case 'rate_limit':
        return <Shield className="h-4 w-4" />;
      case 'network':
        return <RefreshCw className="h-4 w-4" />;
      case 'authentication':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getRecoveryActions = (error: AuthError) => {
    const actions = [];

    if (error.type === 'authentication' && error.code === 'EMAIL_NOT_VERIFIED') {
      actions.push(
        <Button
          key="resend"
          variant="outline"
          size="sm"
          onClick={() => {
            toast.info('Feature coming soon: Resend verification email');
          }}
          className="ml-2"
        >
          <Mail className="h-3 w-3 mr-1" />
          Resend Email
        </Button>
      );
    }

    if (error.recoverable && onRetry) {
      actions.push(
        <Button
          key="retry"
          variant="outline"
          size="sm"
          onClick={handleRetry}
          disabled={retryCountdown > 0}
          className="ml-2"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${retryCountdown > 0 ? 'animate-spin' : ''}`} />
          {retryCountdown > 0 ? `Retry in ${retryCountdown}s` : 'Try Again'}
        </Button>
      );
    }

    return actions;
  };

  if (!parsedError || !parsedError.message) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <div className="flex items-start">
        {getErrorIcon(parsedError.type)}
        <div className="ml-2 flex-1">
          <AlertDescription className="text-sm">
            {parsedError.message}
            {parsedError.code && (
              <span className="text-xs text-muted-foreground ml-2">
                Code: {parsedError.code}
              </span>
            )}
          </AlertDescription>
          <div className="flex items-center mt-2">
            {getRecoveryActions(parsedError)}
            {onClear && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="ml-2 text-xs"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </Alert>
  );
}

// Hook for using error handler in forms
export function useAuthErrorHandler() {
  const [error, setError] = useState<any>(null);

  const handleError = (error: any) => {
    setError(error);
    
    // Also show toast for immediate feedback
    const parsedError = error?.message || error?.error || 'An error occurred';
    toast.error(parsedError);
  };

  const clearError = () => {
    setError(null);
  };

  const retryWithClear = (retryFunction: () => void) => {
    clearError();
    retryFunction();
  };

  return {
    error,
    handleError,
    clearError,
    retryWithClear
  };
} 