import React from 'react';
import { cn } from '../../utils/cn';

// Base Loading Spinner Component
export const LoadingSpinner = ({
  size = 'md',
  color = 'primary',
  className,
  ...props
}) => {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20'
  };

  const colorClasses = {
    primary: 'border-rice-primary-600',
    secondary: 'border-rice-secondary-600',
    white: 'border-white',
    gray: 'border-gray-600',
    success: 'border-green-600',
    warning: 'border-amber-600',
    error: 'border-red-600'
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-transparent border-t-current',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Pulse Loading Component
export const PulseLoader = ({
  size = 'md',
  count = 3,
  color = 'primary',
  className,
  ...props
}) => {
  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  const colorClasses = {
    primary: 'bg-rice-primary-600',
    secondary: 'bg-rice-secondary-600',
    white: 'bg-white',
    gray: 'bg-gray-600',
    success: 'bg-green-600',
    warning: 'bg-amber-600',
    error: 'bg-red-600'
  };

  return (
    <div className={cn('flex items-center space-x-2', className)} role="status" aria-label="Loading" {...props}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'rounded-full animate-bounce',
            sizeClasses[size],
            colorClasses[color]
          )}
          style={{
            animationDelay: `${index * 0.15}s`,
            animationDuration: '1.4s'
          }}
        />
      ))}
    </div>
  );
};

// Skeleton Loading Component
export const SkeletonLoader = ({
  lines = 3,
  className,
  ...props
}) => {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-label="Loading content" {...props}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'h-4 bg-gray-200 rounded-full animate-pulse',
            index === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
};

// Card Skeleton Loader
export const CardSkeleton = ({
  title = true,
  subtitle = false,
  lines = 3,
  avatar = false,
  className,
  ...props
}) => {
  return (
    <div className={cn('bg-white rounded-2xl shadow-lg p-6', className)} role="status" aria-label="Loading card" {...props}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-4">
          {avatar && (
            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
          )}
          <div className="flex-1 space-y-2">
            {title && <div className="h-6 bg-gray-200 rounded-lg animate-pulse w-1/3" />}
            {subtitle && <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-1/2" />}
          </div>
        </div>
        
        {/* Content Lines */}
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-4 bg-gray-200 rounded-lg animate-pulse',
                index === lines - 1 ? 'w-4/5' : 'w-full'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Progress Bar Component
export const ProgressBar = ({
  value = 0,
  max = 100,
  size = 'md',
  color = 'primary',
  animated = true,
  showPercentage = false,
  label,
  className,
  ...props
}) => {
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
    xl: 'h-8'
  };

  const colorClasses = {
    primary: 'bg-rice-primary-600',
    secondary: 'bg-rice-secondary-600',
    success: 'bg-green-600',
    warning: 'bg-amber-600',
    error: 'bg-red-600',
    info: 'bg-blue-600'
  };

  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('space-y-2', className)} {...props}>
      {label && (
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showPercentage && (
            <span className="text-sm text-gray-500">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className={cn(
        'w-full bg-gray-200 rounded-full overflow-hidden',
        sizeClasses[size]
      )}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            colorClasses[color],
            animated && 'animate-slide-up'
          )}
          style={{ width: `${percentage}%` }}
        >
          {/* Animated shimmer effect */}
          {animated && percentage > 0 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          )}
        </div>
      </div>
    </div>
  );
};

// Analysis Loading State Component
export const AnalysisLoading = ({
  title = "Analyzing Your Image",
  message = "Our AI model is examining the rice leaf for disease patterns...",
  steps = [
    "Validating image format",
    "Pre-processing image data",
    "Running AI analysis",
    "Generating recommendations"
  ],
  currentStep = 0,
  className,
  ...props
}) => {
  return (
    <div className={cn('text-center py-12', className)} role="status" aria-label="Analysis in progress" {...props}>
      <div className="flex justify-center mb-6">
        <div className="relative">
          <LoadingSpinner size="xl" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-rice-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        {message}
      </p>

      {/* Progress Steps */}
      <div className="max-w-sm mx-auto">
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center space-x-3 text-sm transition-all duration-300',
                index === currentStep ? 'text-rice-primary-600 font-medium' : 
                index < currentStep ? 'text-green-600' : 'text-gray-400'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300',
                index === currentStep ? 'bg-rice-primary-100 text-rice-primary-700 ring-2 ring-rice-primary-500' :
                index < currentStep ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              )}>
                {index < currentStep ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span className={index === currentStep ? 'animate-pulse' : ''}>
                {step}
              </span>
              {index === currentStep && (
                <PulseLoader size="xs" count={3} color="primary" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Animated dots */}
      <div className="flex justify-center space-x-2 mt-8">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={cn(
              'w-2 h-2 bg-rice-primary-600 rounded-full animate-bounce',
              'opacity-60'
            )}
            style={{
              animationDelay: `${index * 0.15}s`,
              animationDuration: '1.4s'
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Full Page Loading Overlay
export const LoadingOverlay = ({
  visible = false,
  message = "Loading...",
  children,
  className,
  ...props
}) => {
  if (!visible) return children;

  return (
    <div className="relative">
      {/* Overlay */}
      <div className={cn(
        'absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center',
        className
      )} {...props}>
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 font-medium">{message}</p>
        </div>
      </div>
      
      {/* Content (blurred) */}
      <div className="filter blur-sm pointer-events-none">
        {children}
      </div>
    </div>
  );
};

// Loading States Collection
const LoadingStates = {
  LoadingSpinner,
  PulseLoader,
  SkeletonLoader,
  CardSkeleton,
  ProgressBar,
  AnalysisLoading,
  LoadingOverlay
};

export default LoadingStates;