import React, { Component, ReactNode, ErrorInfo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component for graceful error handling
 * Catches React errors and prevents the entire app from crashing
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error Boundary caught an error:", error, errorInfo);
    }

    // Call optional onError callback
    this.props.onError?.(error, errorInfo);

    this.setState({
      errorInfo,
    });

    // In production, you might want to send this to an error tracking service
    // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack }}});
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="max-w-md w-full">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription className="mt-2">
                {process.env.NODE_ENV === "development" ? (
                  <div className="space-y-2">
                    <p className="font-semibold">{this.state.error?.message}</p>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm">Error details</summary>
                      <pre className="mt-2 text-xs overflow-auto max-h-48 bg-black/10 p-2 rounded">
                        {this.state.errorInfo?.componentStack}
                      </pre>
                    </details>
                  </div>
                ) : (
                  <p>An unexpected error occurred. Please try refreshing the page.</p>
                )}
              </AlertDescription>
              <div className="mt-4 flex gap-2">
                <Button onClick={this.handleReset} variant="outline" size="sm">
                  Try Again
                </Button>
                <Button onClick={() => window.location.reload()} variant="default" size="sm">
                  Reload Page
                </Button>
              </div>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Specialized error boundary for route components
 */
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert variant="destructive" className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Page Error</AlertTitle>
            <AlertDescription>
              This page encountered an error. Try navigating back or refreshing.
            </AlertDescription>
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              Go Back
            </Button>
          </Alert>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
