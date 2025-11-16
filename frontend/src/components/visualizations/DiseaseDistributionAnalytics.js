import React, { useState, useEffect } from 'react';

const DiseaseDistributionAnalytics = ({ historicalData = [], currentDisease = null }) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [animatedBars, setAnimatedBars] = useState({});

  // Sample historical data if none provided
  const defaultData = [
    { disease: 'Healthy', count: 45, trend: 'up', percentage: 45 },
    { disease: 'Bacterial Leaf Blight', count: 20, trend: 'down', percentage: 20 },
    { disease: 'Brown Spot', count: 18, trend: 'stable', percentage: 18 },
    { disease: 'Leaf Smut', count: 12, trend: 'up', percentage: 12 },
    { disease: 'Other', count: 5, trend: 'stable', percentage: 5 }
  ];

  const data = historicalData.length > 0 ? historicalData : defaultData;

  // Animate bars on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const animations = {};
      data.forEach((item, index) => {
        setTimeout(() => {
          animations[item.disease] = true;
          setAnimatedBars({ ...animations });
        }, index * 100);
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [data]);

  const getDiseaseColor = (diseaseName) => {
    const diseaseLower = diseaseName.toLowerCase();
    if (diseaseLower.includes('healthy')) return {
      bg: 'bg-green-500',
      light: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-200'
    };
    if (diseaseLower.includes('bacterial')) return {
      bg: 'bg-red-500',
      light: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200'
    };
    if (diseaseLower.includes('brown')) return {
      bg: 'bg-amber-500',
      light: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-200'
    };
    if (diseaseLower.includes('smut')) return {
      bg: 'bg-purple-500',
      light: 'bg-purple-100',
      text: 'text-purple-700',
      border: 'border-purple-200'
    };
    return {
      bg: 'bg-blue-500',
      light: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-200'
    };
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>;
      case 'down':
        return <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>;
      default:
        return <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>;
    }
  };

  const timeRanges = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' }
  ];

  const totalDetections = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Disease Distribution Analytics</h3>
          <p className="text-sm text-gray-600 mt-1">Historical disease detection patterns</p>
        </div>

        {/* Time Range Selector */}
        <div className="mt-4 sm:mt-0 flex space-x-2">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => setSelectedTimeRange(range.value)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors duration-200 ${
                selectedTimeRange === range.value
                  ? 'bg-rice-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-900">{totalDetections}</div>
          <div className="text-sm text-blue-700">Total Scans</div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-900">{data[0]?.count || 0}</div>
          <div className="text-sm text-green-700">Healthy Plants</div>
        </div>
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-4">
          <div className="text-2xl font-bold text-amber-900">{totalDetections - (data[0]?.count || 0)}</div>
          <div className="text-sm text-amber-700">Diseases Found</div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-900">{Math.round((totalDetections - (data[0]?.count || 0)) / totalDetections * 100)}%</div>
          <div className="text-sm text-purple-700">Disease Rate</div>
        </div>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Disease Frequency</h4>
        {data.map((item, index) => {
          const colors = getDiseaseColor(item.disease);
          const isCurrentDisease = currentDisease && item.disease.toLowerCase().includes(currentDisease.toLowerCase());

          return (
            <div
              key={item.disease}
              className={`relative rounded-lg p-3 transition-all duration-300 ${
                isCurrentDisease ? colors.light + ' ' + colors.border + ' border-2' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${colors.bg}`}></div>
                  <span className={`font-medium text-sm ${isCurrentDisease ? colors.text : 'text-gray-700'}`}>
                    {item.disease}
                  </span>
                  {isCurrentDisease && (
                    <span className="text-xs bg-white px-2 py-1 rounded-full border">Current</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                  <span className="text-xs text-gray-500">({item.percentage}%)</span>
                  {getTrendIcon(item.trend)}
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                <div
                  className={`h-full ${colors.bg} rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2`}
                  style={{
                    width: animatedBars[item.disease] ? `${item.percentage}%` : '0%',
                    transitionDelay: `${index * 50}ms`
                  }}
                >
                  {animatedBars[item.disease] && item.percentage > 10 && (
                    <span className="text-xs text-white font-medium">{item.percentage}%</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Disease Insights */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Key Insights
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• {data[0]?.count || 0} out of {totalDetections} plants are healthy ({Math.round((data[0]?.count || 0) / totalDetections * 100)}%)</li>
          <li>• {data[1]?.disease || 'Bacterial Leaf Blight'} is the most common disease ({data[1]?.count || 0} cases)</li>
          <li>• Disease detection rate has {data.find(d => d.disease.toLowerCase().includes('bacterial'))?.trend === 'up' ? 'increased' : 'decreased'} in the selected period</li>
        </ul>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="px-4 py-2 bg-rice-primary-600 text-white text-sm rounded-lg hover:bg-rice-primary-700 transition-colors duration-200">
          View Full Report
        </button>
        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors duration-200">
          Export Data
        </button>
        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors duration-200">
          Set Alerts
        </button>
      </div>
    </div>
  );
};

export default DiseaseDistributionAnalytics;