import React from 'react';
import { cn } from '../../utils/cn';

// Error Boundary Class Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Generate unique error ID for tracking
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      errorInfo,
      errorId: this.state.errorId || `ERR-${Date.now()}`
    });

    // Log error details for debugging (in production, send to error tracking service)
    if (process.env.NODE_ENV === 'production') {
      // In a real app, you'd send this to Sentry, LogRocket, etc.
      console.group('🚨 Error Details');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Error ID:', this.state.errorId);
      console.groupEnd();
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
          fallback={this.props.fallback}
          className={this.props.className}
        />
      );
    }

    return this.props.children;
  }
}

// Error Fallback Component
const ErrorFallback = ({
  error,
  errorInfo,
  errorId,
  onRetry,
  onReload,
  fallback,
  className
}) => {
  // Custom fallback component
  if (fallback) {
    return typeof fallback === 'function' ? fallback({ error, onRetry, onReload }) : fallback;
  }

  return (
    <div className={cn(
      'min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50',
      'flex items-center justify-center p-4',
      className
    )}>
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-100 p-8 text-center">
        {/* Error Icon */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        {/* Error Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Something went wrong
        </h1>

        {/* Error Message */}
        <p className="text-gray-600 mb-6">
          We're having trouble processing your request. This could be due to a network issue or a temporary problem with our services.
        </p>

        {/* Error ID (for debugging) */}
        {errorId && (
          <div className="bg-gray-50 rounded-lg p-3 mb-6 text-xs text-gray-500">
            <span className="font-medium">Error ID:</span> {errorId}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full btn-primary"
            aria-label="Try again to resolve the error"
          >
            Try Again
          </button>
          
          <button
            onClick={onReload}
            className="w-full btn-secondary"
            aria-label="Reload the page to start fresh"
          >
            Reload Page
          </button>
        </div>

        {/* Additional Help */}
        <details className="mt-6 text-left">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            Need more help?
          </summary>
          <div className="mt-3 p-4 bg-blue-50 rounded-lg text-xs text-blue-800">
            <ul className="space-y-2">
              <li className="flex items-start">
                <svg className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Check your internet connection
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Try uploading a different image
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Contact support if the problem persists
              </li>
            </ul>
          </div>
        </details>
      </div>
    </div>
  );
};

// Agricultural-Themed Error Boundary
export const AgriculturalErrorBoundary = ({ children, ...props }) => (
  <ErrorBoundary
    {...props}
    fallback={({ error, onRetry, onReload }) => (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-green-100 p-8 text-center">
          {/* Agricultural Error Icon */}
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🌾</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Oops! Something went wrong
          </h1>

          <p className="text-gray-600 mb-6">
            Even the best crops sometimes face unexpected weather. Don't worry, we'll get your rice leaf analysis back on track!
          </p>

          <div className="space-y-3">
            <button
              onClick={onRetry}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors duration-200 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
            
            <button
              onClick={onReload}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Start Fresh
            </button>
          </div>
        </div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

// Inline Error Component for smaller components
export const InlineError = ({ 
  error, 
  onRetry, 
  onDismiss,
  title = "Something went wrong",
  className 
}) => {
  return (
    <div className={cn(
      'bg-red-50 border-l-4 border-red-400 p-4 rounded-lg animate-fade-in',
      className
    )} role="alert" aria-live="polite">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {title}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            {typeof error === 'string' ? error : error?.message || 'An unexpected error occurred'}
          </div>
          
          {onRetry && (
            <div className="mt-3 flex space-x-3">
              <button
                onClick={onRetry}
                className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-md hover:bg-red-200 transition-colors duration-200"
              >
                Try Again
              </button>
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-sm text-red-600 hover:text-red-800 transition-colors duration-200"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Toast Error Notification
export const ErrorToast = ({ 
  error, 
  onDismiss, 
  autoDismiss = 5000,
  className 
}) => {
  React.useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(onDismiss, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onDismiss]);

  return (
    <div className={cn(
      'fixed top-4 right-4 z-50 max-w-sm bg-white rounded-lg shadow-xl border border-red-200 p-4 animate-slide-in-right',
      className
    )} role="alert" aria-live="assertive">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
        
        <div className="ml-3 flex-1">
          <h4 className="text-sm font-medium text-gray-900">Error</h4>
          <p className="mt-1 text-sm text-gray-500">
            {typeof error === 'string' ? error : error?.message || 'Something went wrong'}
          </p>
        </div>
        
        {onDismiss && (
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              aria-label="Dismiss error"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorBoundary;