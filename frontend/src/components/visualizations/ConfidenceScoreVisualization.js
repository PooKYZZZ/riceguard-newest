import React, { useEffect, useState, useRef } from 'react';

const ConfidenceScoreVisualization = ({ confidence, isAnalyzing = false, disease = 'unknown' }) => {
  const [animatedConfidence, setAnimatedConfidence] = useState(0);
  const [displayConfidence, setDisplayConfidence] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);

  const confidenceValue = parseFloat(confidence) || 0;

  // Get disease-specific colors
  const getDiseaseColor = (diseaseName) => {
    const diseaseLower = diseaseName.toLowerCase();
    if (diseaseLower.includes('healthy')) return {
      primary: '#22c55e',
      secondary: '#16a34a',
      gradient: 'from-green-400 to-green-600',
      bgLight: 'bg-green-50',
      borderLight: 'border-green-200'
    };
    if (diseaseLower.includes('bacterial')) return {
      primary: '#ef4444',
      secondary: '#dc2626',
      gradient: 'from-red-400 to-red-600',
      bgLight: 'bg-red-50',
      borderLight: 'border-red-200'
    };
    if (diseaseLower.includes('brown')) return {
      primary: '#f59e0b',
      secondary: '#d97706',
      gradient: 'from-amber-400 to-amber-600',
      bgLight: 'bg-amber-50',
      borderLight: 'border-amber-200'
    };
    if (diseaseLower.includes('smut')) return {
      primary: '#8b5cf6',
      secondary: '#7c3aed',
      gradient: 'from-purple-400 to-purple-600',
      bgLight: 'bg-purple-50',
      borderLight: 'border-purple-200'
    };
    return {
      primary: '#06b6d4',
      secondary: '#0891b2',
      gradient: 'from-cyan-400 to-cyan-600',
      bgLight: 'bg-cyan-50',
      borderLight: 'border-cyan-200'
    };
  };

  const colors = getDiseaseColor(disease);

  // Smooth animation for confidence score
  useEffect(() => {
    if (isAnalyzing) {
      setAnimatedConfidence(0);
      setDisplayConfidence(0);
      setIsComplete(false);
      return;
    }

    const animate = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const progress = Math.min((timestamp - startTimeRef.current) / 1500, 1); // 1.5 second animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = easeOutQuart * confidenceValue;

      setAnimatedConfidence(currentValue);
      setDisplayConfidence(Math.round(currentValue));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsComplete(true);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      startTimeRef.current = null;
    };
  }, [confidenceValue, isAnalyzing]);

  // Get confidence level
  const getConfidenceLevel = (score) => {
    if (score >= 85) return { level: 'High', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 70) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'Low', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const confidenceLevel = getConfidenceLevel(confidenceValue);

  if (isAnalyzing) {
    return (
      <div className={`${colors.bgLight} rounded-xl p-6 border ${colors.borderLight}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Analyzing Confidence</h3>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-gray-300 to-gray-400 rounded-full animate-pulse"></div>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-3 text-center">Processing image...</p>
      </div>
    );
  }

  return (
    <div className={`${colors.bgLight} rounded-xl p-6 border ${colors.borderLight} transition-all duration-300 ${isComplete ? 'scale-105' : 'scale-100'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Confidence Score</h3>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${confidenceLevel.bg} ${confidenceLevel.color}`}>
          {confidenceLevel.level} Confidence
        </div>
      </div>

      {/* Circular Progress Indicator */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="transform -rotate-90 w-32 h-32">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="#e5e7eb"
              strokeWidth="12"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke={colors.primary}
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - animatedConfidence / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-100 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-800">{displayConfidence}%</div>
              <div className="text-xs text-gray-500">Accuracy</div>
            </div>
          </div>
        </div>
      </div>

      {/* Linear Progress Bar */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Model Confidence</span>
          <span className="text-sm font-bold text-gray-900">{displayConfidence}%</span>
        </div>
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full transition-all duration-300 ease-out relative overflow-hidden`}
              style={{ width: `${animatedConfidence}%` }}
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shine"></div>
            </div>
          </div>

          {/* Tick marks */}
          <div className="absolute inset-0 flex items-center justify-between px-1">
            <div className="w-1 h-1 bg-gray-400 rounded-full opacity-50"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full opacity-50"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full opacity-50"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full opacity-50"></div>
          </div>
        </div>
      </div>

      {/* Confidence Indicators */}
      <div className="mt-6 grid grid-cols-3 gap-2">
        <div className={`text-center p-2 rounded-lg transition-all duration-300 ${
          confidenceValue >= 85 ? colors.bgLight + ' ' + colors.borderLight + ' border' : 'opacity-40'
        }`}>
          <div className="text-xs text-gray-600">High</div>
          <div className="text-sm font-semibold">85%+</div>
        </div>
        <div className={`text-center p-2 rounded-lg transition-all duration-300 ${
          confidenceValue >= 70 && confidenceValue < 85 ? colors.bgLight + ' ' + colors.borderLight + ' border' : 'opacity-40'
        }`}>
          <div className="text-xs text-gray-600">Medium</div>
          <div className="text-sm font-semibold">70-84%</div>
        </div>
        <div className={`text-center p-2 rounded-lg transition-all duration-300 ${
          confidenceValue < 70 ? colors.bgLight + ' ' + colors.borderLight + ' border' : 'opacity-40'
        }`}>
          <div className="text-xs text-gray-600">Low</div>
          <div className="text-sm font-semibold">&lt;70%</div>
        </div>
      </div>

      {/* Additional Metrics */}
      {isComplete && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Detection Quality:</span>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.round(confidenceValue / 20) ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfidenceScoreVisualization;