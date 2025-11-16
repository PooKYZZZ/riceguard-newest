import React, { useState, useEffect } from 'react';

const UserGuidanceVisualization = ({ isActive = false }) => {
  const [currentTip, setCurrentTip] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showDetailed, setShowDetailed] = useState(false);

  const photoTips = [
    {
      title: 'Lighting is Key',
      icon: '☀️',
      color: 'bg-yellow-100 border-yellow-300',
      iconColor: 'text-yellow-600',
      description: 'Use natural daylight for best results',
      details: 'Take photos between 10 AM - 4 PM when sunlight is brightest. Avoid direct overhead sunlight that can cause harsh shadows.',
      visual: (
        <div className="flex justify-center items-center h-32">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-full flex items-center justify-center">
              <span className="text-4xl">🌤️</span>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      )
    },
    {
      title: 'Focus on Affected Areas',
      icon: '🎯',
      color: 'bg-red-100 border-red-300',
      iconColor: 'text-red-600',
      description: 'Zoom in on disease symptoms',
      details: 'Get close to the leaf lesions, spots, or discoloration. Keep the camera 4-6 inches away for optimal focus.',
      visual: (
        <div className="flex justify-center items-center h-32">
          <div className="relative">
            <div className="w-32 h-20 bg-green-200 rounded-lg relative overflow-hidden">
              <div className="absolute top-4 left-6 w-4 h-4 bg-red-400 rounded-full"></div>
              <div className="absolute top-8 left-12 w-3 h-3 bg-orange-400 rounded-full"></div>
              <div className="absolute bottom-4 left-8 w-5 h-3 bg-yellow-400 rounded-full"></div>
            </div>
            <div className="absolute inset-0 border-2 border-red-400 rounded-lg animate-pulse"></div>
            <div className="absolute -top-1 -left-1 w-6 h-6 border-l-2 border-t-2 border-red-500"></div>
          </div>
        </div>
      )
    },
    {
      title: 'Include Healthy Tissue',
      icon: '🍃',
      color: 'bg-green-100 border-green-300',
      iconColor: 'text-green-600',
      description: 'Show both healthy and affected areas',
      details: 'Include some healthy leaf tissue in the frame for comparison. This helps the AI better identify disease patterns.',
      visual: (
        <div className="flex justify-center items-center h-32">
          <div className="w-32 h-20 bg-gradient-to-r from-green-300 to-green-200 rounded-lg relative overflow-hidden">
            <div className="absolute left-8 w-16 h-20 bg-green-200 border-l-2 border-green-400"></div>
            <div className="absolute right-4 w-12 h-20 bg-yellow-200 border-l-2 border-yellow-400">
              <div className="absolute top-4 right-2 w-3 h-3 bg-orange-400 rounded-full"></div>
              <div className="absolute bottom-6 right-3 w-2 h-2 bg-red-400 rounded-full"></div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Steady & Clear',
      icon: '📷',
      color: 'bg-blue-100 border-blue-300',
      iconColor: 'text-blue-600',
      description: 'Keep your hands steady, avoid blur',
      details: 'Hold your phone with both hands or rest your elbows on a stable surface. Tap the screen to focus before capturing.',
      visual: (
        <div className="flex justify-center items-center h-32">
          <div className="relative">
            <div className="w-16 h-24 bg-gray-800 rounded-lg relative">
              <div className="absolute top-2 left-2 right-2 h-16 bg-gray-900 rounded">
                <div className="absolute top-4 left-4 w-8 h-8 bg-green-200 rounded border-2 border-green-400"></div>
              </div>
              <div className="absolute bottom-2 left-4 w-8 h-2 bg-gray-600 rounded-full"></div>
            </div>
            <div className="absolute -right-4 top-4 text-2xl">✋</div>
            <div className="absolute -left-4 top-4 text-2xl">✋</div>
          </div>
        </div>
      )
    },
    {
      title: 'Multiple Angles',
      icon: '🔄',
      color: 'bg-purple-100 border-purple-300',
      iconColor: 'text-purple-600',
      description: 'Capture different perspectives',
      details: 'Take photos from top, bottom, and side views. Some diseases are more visible from certain angles.',
      visual: (
        <div className="flex justify-center items-center h-32">
          <div className="flex space-x-2">
            <div className="w-12 h-12 bg-green-200 rounded-lg transform rotate-12 border-2 border-purple-300"></div>
            <div className="w-12 h-12 bg-green-200 rounded-lg transform -rotate-12 border-2 border-purple-300"></div>
            <div className="w-12 h-12 bg-green-200 rounded-lg transform rotate-45 border-2 border-purple-300"></div>
          </div>
        </div>
      )
    }
  ];

  // Auto-rotate tips
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentTip((prev) => (prev + 1) % photoTips.length);
        setIsAnimating(false);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, [isActive, photoTips.length]);

  const currentTipData = photoTips[currentTip];

  const qualityMetrics = [
    { label: 'Light Quality', value: 85, color: 'bg-yellow-500' },
    { label: 'Focus Clarity', value: 90, color: 'bg-blue-500' },
    { label: 'Composition', value: 75, color: 'bg-green-500' },
    { label: 'Stability', value: 95, color: 'bg-purple-500' }
  ];

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 border border-gray-200 transition-all duration-500 ${
      isActive ? 'scale-105 shadow-xl' : 'scale-100'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Photo Taking Guide</h3>
          <p className="text-sm text-gray-600 mt-1">Tips for better disease detection</p>
        </div>
        <button
          onClick={() => setShowDetailed(!showDetailed)}
          className="text-sm text-rice-primary-600 hover:text-rice-primary-700 font-medium"
        >
          {showDetailed ? 'Simple' : 'Detailed'}
        </button>
      </div>

      {/* Main Tip Display */}
      <div className={`${currentTipData.color} rounded-lg p-4 mb-6 border transition-all duration-300 ${
        isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
      }`}>
        <div className="flex items-start space-x-3">
          <div className={`text-2xl ${currentTipData.iconColor}`}>{currentTipData.icon}</div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 text-lg">{currentTipData.title}</h4>
            <p className="text-gray-700 text-sm mt-1">{currentTipData.description}</p>
            {showDetailed && (
              <p className="text-gray-600 text-xs mt-2 italic">{currentTipData.details}</p>
            )}
          </div>
        </div>

        {/* Visual Illustration */}
        <div className="mt-4 bg-white bg-opacity-50 rounded-lg p-2">
          {currentTipData.visual}
        </div>
      </div>

      {/* Tip Navigation */}
      <div className="flex items-center justify-center space-x-2 mb-6">
        {photoTips.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentTip(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentTip
                ? 'w-8 bg-rice-primary-600'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to tip ${index + 1}`}
          />
        ))}
      </div>

      {/* Photo Quality Meter */}
      {showDetailed && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Photo Quality Checklist</h4>
          <div className="space-y-2">
            {qualityMetrics.map((metric) => (
              <div key={metric.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{metric.label}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-full ${metric.color} rounded-full transition-all duration-1000`}
                      style={{ width: `${metric.value}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 w-10">{metric.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Tips Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {photoTips.slice(0, 4).map((tip, index) => (
          <button
            key={index}
            onClick={() => setCurrentTip(index)}
            className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
              index === currentTip ? tip.color : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className={index === currentTip ? tip.iconColor : 'text-gray-600'}>{tip.icon}</span>
              <span className={`text-sm font-medium ${
                index === currentTip ? 'text-gray-900' : 'text-gray-600'
              }`}>{tip.title}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Common Mistakes to Avoid */}
      {showDetailed && (
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <h4 className="text-sm font-semibold text-red-900 mb-2 flex items-center">
            <span className="mr-2">⚠️</span>
            Common Mistakes to Avoid
          </h4>
          <ul className="text-xs text-red-800 space-y-1">
            <li>• Taking photos in dim lighting or at night</li>
            <li>• Camera shake causing blurry images</li>
            <li>• Only capturing healthy tissue without symptoms</li>
            <li>• Shooting from too far away</li>
            <li>• Including distracting backgrounds</li>
          </ul>
        </div>
      )}

      {/* Action Button */}
      <div className="mt-4 text-center">
        <button className="px-6 py-2 bg-rice-primary-600 text-white rounded-lg hover:bg-rice-primary-700 transition-colors duration-200 text-sm font-medium">
          Practice Camera Settings
        </button>
      </div>
    </div>
  );
};

export default UserGuidanceVisualization;