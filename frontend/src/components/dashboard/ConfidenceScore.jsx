import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';

const ConfidenceScore = ({
  score,
  label = "Confidence Score",
  showPercentage = true,
  size = 'md',
  animated = true,
  color = 'auto',
  className,
  ...props
}) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const numericScore = Math.min(100, Math.max(0, parseFloat(score) || 0));
  
  const getConfidenceLevel = (score) => {
    if (score >= 80) return { level: 'high', color: 'green', text: 'High Confidence' };
    if (score >= 60) return { level: 'medium', color: 'amber', text: 'Medium Confidence' };
    return { level: 'low', color: 'red', text: 'Low Confidence' };
  };

  const getScoreColor = () => {
    if (color !== 'auto') return color;
    const level = getConfidenceLevel(numericScore);
    return level.color;
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'h-2',
          text: 'text-sm',
          percentage: 'text-base',
          icon: 'w-4 h-4'
        };
      case 'md':
        return {
          container: 'h-4',
          text: 'text-sm',
          percentage: 'text-lg',
          icon: 'w-5 h-5'
        };
      case 'lg':
        return {
          container: 'h-6',
          text: 'text-base',
          percentage: 'text-xl',
          icon: 'w-6 h-6'
        };
      case 'xl':
        return {
          container: 'h-8',
          text: 'text-lg',
          percentage: 'text-2xl',
          icon: 'w-8 h-8'
        };
      default:
        return {
          container: 'h-4',
          text: 'text-sm',
          percentage: 'text-lg',
          icon: 'w-5 h-5'
        };
    }
  };

  const scoreColor = getScoreColor();
  const level = getConfidenceLevel(numericScore);
  const sizeClasses = getSizeClasses();

  // Animated score counting
  useEffect(() => {
    if (!animated) {
      setDisplayScore(numericScore);
      return;
    }

    setIsAnimating(true);
    setDisplayScore(0);
    
    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const increment = numericScore / steps;
    const stepDuration = duration / steps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      setDisplayScore(Math.round(increment * currentStep));
      
      if (currentStep >= steps) {
        clearInterval(timer);
        setDisplayScore(numericScore);
        setIsAnimating(false);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [numericScore, animated]);

  const getConfidenceIcon = () => {
    const iconClasses = cn(sizeClasses.icon, 'inline-block mr-2');
    
    switch (level.color) {
      case 'green':
        return (
          <svg className={iconClasses} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'amber':
        return (
          <svg className={iconClasses} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'red':
        return (
          <svg className={iconClasses} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getProgressBarColor = () => {
    switch (scoreColor) {
      case 'green':
        return 'from-green-400 to-green-600';
      case 'amber':
        return 'from-amber-400 to-amber-600';
      case 'red':
        return 'from-red-400 to-red-600';
      case 'blue':
        return 'from-blue-400 to-blue-600';
      case 'purple':
        return 'from-purple-400 to-purple-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const getTextColor = () => {
    switch (scoreColor) {
      case 'green':
        return 'text-green-600';
      case 'amber':
        return 'text-amber-600';
      case 'red':
        return 'text-red-600';
      case 'blue':
        return 'text-blue-600';
      case 'purple':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const getBgColor = () => {
    switch (scoreColor) {
      case 'green':
        return 'bg-green-50 border-green-200';
      case 'amber':
        return 'bg-amber-50 border-amber-200';
      case 'red':
        return 'bg-red-50 border-red-200';
      case 'blue':
        return 'bg-blue-50 border-blue-200';
      case 'purple':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={cn('space-y-3', className)} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {getConfidenceIcon()}
          <span className={cn('font-medium text-gray-700', sizeClasses.text)}>
            {label}
          </span>
        </div>
        {showPercentage && (
          <div className="flex items-center space-x-2">
            <span className={cn('font-bold', getTextColor(), sizeClasses.percentage)}>
              {displayScore}%
            </span>
            {isAnimating && (
              <div className="w-2 h-2 bg-rice-primary-600 rounded-full animate-ping" />
            )}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className={cn(
          'w-full bg-gray-200 rounded-full overflow-hidden',
          sizeClasses.container
        )}>
          <div
            className={cn(
              `h-full bg-gradient-to-r ${getProgressBarColor()} rounded-full transition-all duration-700 ease-out`,
              animated && 'animate-slide-up'
            )}
            style={{ width: `${numericScore}%` }}
          >
            {/* Animated shimmer effect */}
            {animated && numericScore > 0 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            )}
          </div>
        </div>

        {/* Centered text overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className={cn(
            'text-xs font-medium text-gray-600 mix-blend-difference',
            'px-2 py-1 bg-white/30 rounded-full backdrop-blur-sm'
          )}>
            {level.text}
          </span>
        </div>
      </div>

      {/* Confidence Level Badge */}
      <div className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border',
        getBgColor(),
        getTextColor()
      )}>
        <div className={cn(
          'w-2 h-2 rounded-full mr-2 animate-pulse',
          level.color === 'green' && 'bg-green-500',
          level.color === 'amber' && 'bg-amber-500',
          level.color === 'red' && 'bg-red-500'
        )} />
        {level.text}
      </div>

      {/* Confidence Details */}
      <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
        <div className="text-center">
          <div className="font-medium text-gray-700">Low</div>
          <div className="text-gray-400">0-59%</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-gray-700">Medium</div>
          <div className="text-gray-400">60-79%</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-gray-700">High</div>
          <div className="text-gray-400">80-100%</div>
        </div>
      </div>
    </div>
  );
};

export default ConfidenceScore;