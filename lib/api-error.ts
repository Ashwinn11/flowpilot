// Utility to standardize API error responses
export function generateErrorResponse({
  error,
  userMessage = 'An unexpected error occurred',
  status = 500,
  validationErrors
}: {
  error?: any;
  userMessage?: string;
  status?: number;
  validationErrors?: any[];
}) {
  return {
    success: false,
    error: userMessage,
    message: userMessage,
    validationErrors: validationErrors || undefined,
    status
  };
} 