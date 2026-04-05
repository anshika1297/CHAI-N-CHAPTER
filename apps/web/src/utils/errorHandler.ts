/**
 * Client-side error handling utilities
 * For production error tracking and logging
 */

interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  url?: string;
  userAgent?: string;
  timestamp: string;
}

/**
 * Log error to console and optionally send to error tracking service
 */
export function logError(error: Error, errorInfo?: { componentStack?: string }) {
  const errorData: ErrorInfo = {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo?.componentStack,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    timestamp: new Date().toISOString(),
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error occurred:', errorData);
  }

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Sentry, LogRocket, or your error tracking service
    // Sentry.captureException(error, { contexts: { react: errorInfo } });
    
    // For now, log to console (you can replace with actual error tracking)
    console.error('Production error:', {
      message: errorData.message,
      url: errorData.url,
      timestamp: errorData.timestamp,
    });
  }
}

/**
 * Handle unhandled promise rejections
 */
export function setupGlobalErrorHandlers() {
  if (typeof window === 'undefined') return;

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logError(new Error(event.reason || 'Unhandled promise rejection'), {
      componentStack: 'Global handler',
    });
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    logError(event.error || new Error(event.message), {
      componentStack: 'Global error handler',
    });
  });
}
