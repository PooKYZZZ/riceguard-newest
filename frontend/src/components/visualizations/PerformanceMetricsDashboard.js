import React, { useState, useEffect } from 'react';

const PerformanceMetricsDashboard = ({ metrics = {}, isRealTime = true }) => {
  const [animatedValues, setAnimatedValues] = useState({});
  const [selectedMetric, setSelectedMetric] = useState('accuracy');

  // Default metrics if none provided
  const defaultMetrics = {
    accuracy: 92.5,
    processingTime: 1.2,
    modelReliability: 95.8,
    successRate: 98.2,
    uptime: 99.9,
    responseTime: 0.8,
    dailyScans: 156,
    weeklyGrowth: 12.5,
    userSatisfaction: 4.6
  };

  const currentMetrics = { ...defaultMetrics, ...metrics };

  // Animate metrics on mount
  useEffect(() => {
    const animations = {};
    Object.keys(currentMetrics).forEach((key, index) => {
      setTimeout(() => {
        const targetValue = currentMetrics[key];
        const isPercentage = typeof targetValue === 'number' && targetValue <= 100 && targetValue >= 0;
        const isRating = key === 'userSatisfaction';

        let current = 0;
        const increment = targetValue / 50; // 50 steps for smooth animation

        const animate = () => {
          current += increment;
          if (current >= targetValue) {
            current = targetValue;
          }

          if (isPercentage) {
            animations[key] = current.toFixed(1) + '%';
          } else if (isRating) {
            animations[key] = current.toFixed(1);
          } else if (key.includes('time')) {
            animations[key] = current.toFixed(1) + 's';
          } else {
            animations[key] = Math.round(current);
          }

          setAnimatedValues({ ...animations });

          if (current < targetValue) {
            requestAnimationFrame(animate);
          }
        };

        animate();
      }, index * 100);
    });
  }, [currentMetrics]);

  const getMetricStatus = (value, metricType) => {
    if (metricType === 'percentage') {
      if (value >= 95) return { status: 'excellent', color: 'text-green-600', bg: 'bg-green-100' };
      if (value >= 85) return { status: 'good', color: 'text-blue-600', bg: 'bg-blue-100' };
      if (value >= 70) return { status: 'average', color: 'text-yellow-600', bg: 'bg-yellow-100' };
      return { status: 'poor', color: 'text-red-600', bg: 'bg-red-100' };
    }

    if (metricType === 'time') {
      if (value <= 1) return { status: 'excellent', color: 'text-green-600', bg: 'bg-green-100' };
      if (value <= 2) return { status: 'good', color: 'text-blue-600', bg: 'bg-blue-100' };
      if (value <= 3) return { status: 'average', color: 'text-yellow-600', bg: 'bg-yellow-100' };
      return { status: 'poor', color: 'text-red-600', bg: 'bg-red-100' };
    }

    if (metricType === 'rating') {
      if (value >= 4.5) return { status: 'excellent', color: 'text-green-600', bg: 'bg-green-100' };
      if (value >= 4.0) return { status: 'good', color: 'text-blue-600', bg: 'bg-blue-100' };
      if (value >= 3.5) return { status: 'average', color: 'text-yellow-600', bg: 'bg-yellow-100' };
      return { status: 'poor', color: 'text-red-600', bg: 'bg-red-100' };
    }

    return { status: 'good', color: 'text-blue-600', bg: 'bg-blue-100' };
  };

  const getProgressBarColor = (value, metricType) => {
    if (metricType === 'percentage') {
      if (value >= 95) return 'from-green-400 to-green-600';
      if (value >= 85) return 'from-blue-400 to-blue-600';
      if (value >= 70) return 'from-yellow-400 to-yellow-600';
      return 'from-red-400 to-red-600';
    }

    if (metricType === 'time') {
      if (value <= 1) return 'from-green-400 to-green-600';
      if (value <= 2) return 'from-blue-400 to-blue-600';
      if (value <= 3) return 'from-yellow-400 to-yellow-600';
      return 'from-red-400 to-red-600';
    }

    return 'from-blue-400 to-blue-600';
  };

  const metricsConfig = [
    {
      key: 'accuracy',
      label: 'Model Accuracy',
      icon: '🎯',
      type: 'percentage',
      description: 'Overall disease detection accuracy',
      unit: '%'
    },
    {
      key: 'processingTime',
      label: 'Processing Time',
      icon: '⚡',
      type: 'time',
      description: 'Average time to analyze an image',
      unit: 's'
    },
    {
      key: 'modelReliability',
      label: 'Model Reliability',
      icon: '🛡️',
      type: 'percentage',
      description: 'Consistency of predictions',
      unit: '%'
    },
    {
      key: 'successRate',
      label: 'Success Rate',
      icon: '✅',
      type: 'percentage',
      description: 'Successful analysis completion rate',
      unit: '%'
    },
    {
      key: 'uptime',
      label: 'System Uptime',
      icon: '🌟',
      type: 'percentage',
      description: 'System availability',
      unit: '%'
    },
    {
      key: 'responseTime',
      label: 'API Response Time',
      icon: '📡',
      type: 'time',
      description: 'Average API response time',
      unit: 's'
    },
    {
      key: 'dailyScans',
      label: 'Daily Scans',
      icon: '📊',
      type: 'number',
      description: 'Number of scans processed today',
      unit: ''
    },
    {
      key: 'weeklyGrowth',
      label: 'Weekly Growth',
      icon: '📈',
      type: 'percentage',
      description: 'User growth rate this week',
      unit: '%'
    },
    {
      key: 'userSatisfaction',
      label: 'User Satisfaction',
      icon: '😊',
      type: 'rating',
      description: 'Average user rating',
      unit: '/5'
    }
  ];

  const mainMetrics = metricsConfig.slice(0, 6);
  const secondaryMetrics = metricsConfig.slice(6);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Performance Metrics</h3>
          <p className="text-sm text-gray-600 mt-1">Real-time system performance indicators</p>
        </div>
        {isRealTime && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">Live</span>
          </div>
        )}
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {mainMetrics.map((metric) => {
          const value = currentMetrics[metric.key];
          const displayValue = animatedValues[metric.key] || '0';
          const status = getMetricStatus(value, metric.type);
          const progressColor = getProgressBarColor(value, metric.type);

          return (
            <div
              key={metric.key}
              className={`relative rounded-lg p-4 border transition-all duration-300 hover:shadow-md cursor-pointer ${
                selectedMetric === metric.key ? 'border-rice-primary-500 bg-rice-primary-50' : 'border-gray-200 bg-gray-50'
              }`}
              onClick={() => setSelectedMetric(metric.key)}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{metric.icon}</span>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{metric.label}</div>
                    <div className="text-xs text-gray-500">{metric.description}</div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${status.bg} ${status.color}`}>
                  {status.status}
                </span>
              </div>

              {/* Value */}
              <div className="mb-3">
                <div className="text-2xl font-bold text-gray-900">
                  {displayValue}
                  {metric.unit && <span className="text-lg text-gray-500 ml-1">{metric.unit}</span>}
                </div>
              </div>

              {/* Progress Bar */}
              {metric.type !== 'number' && (
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${progressColor} rounded-full transition-all duration-1000 ease-out`}
                      style={{
                        width: metric.type === 'percentage' || metric.type === 'rating' ? `${(value / 100) * 100}%` : `${Math.max(0, 100 - (value * 20))}%`
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Trend Indicator */}
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-gray-500">Performance</span>
                <div className="flex items-center space-x-1">
                  {metric.type === 'time' ? (
                    value <= 1 ? (
                      <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )
                  ) : (
                    <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  )}
                  <span className={metric.type === 'time' ? (value <= 1 ? 'text-green-600' : 'text-yellow-600') : 'text-green-600'}>
                    {metric.type === 'time' ? (value <= 1 ? 'Excellent' : 'Good') : 'Healthy'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Metrics */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Business Metrics</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {secondaryMetrics.map((metric) => {
            const value = currentMetrics[metric.key];
            const displayValue = animatedValues[metric.key] || '0';

            return (
              <div key={metric.key} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{metric.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700">{metric.label}</div>
                    <div className="text-lg font-bold text-gray-900">
                      {displayValue}
                      {metric.unit && <span className="text-sm text-gray-500 ml-1">{metric.unit}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* System Status Summary */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-blue-900">Overall System Health</h4>
            <p className="text-xs text-blue-700 mt-1">All systems operating within normal parameters</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">Optimal</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetricsDashboard;