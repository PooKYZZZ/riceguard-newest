import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { uploadScan, getRecommendation } from "../api";

// Simple skip link for accessibility
const SkipLink = ({ targetId, children }) => (
  <a href={`#${targetId}`} className="skip-link">
    {children}
  </a>
);

// Simple loading spinner with rice theme
const LoadingSpinner = ({ message = "Processing" }) => (
  <div className="flex flex-col items-center space-y-4" role="status" aria-live="polite">
    <div className="w-12 h-12 spinner border-4 border-rice-secondary-200 border-t-rice-secondary-600"></div>
    <span className="text-lg font-semibold text-rice-secondary-800">{message}</span>
    <span className="sr-only">Loading, please wait</span>
  </div>
);

// Progress stepper component
const ProgressStepper = ({ currentStep }) => {
  const steps = [
    { id: 1, name: 'Upload', icon: '📷', status: currentStep >= 1 ? 'completed' : 'pending' },
    { id: 2, name: 'Analysis', icon: '🔬', status: currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : 'pending' },
    { id: 3, name: 'Results', icon: '🌾', status: currentStep >= 3 ? 'completed' : 'pending' }
  ];

  return (
    <div className="backdrop-blur-lg bg-white/60 rounded-xl border border-rice-secondary-200/50 p-4 mb-6">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            {/* Step circle */}
            <div className={`
              relative flex items-center justify-center w-12 h-12 rounded-full border-3 transition-all duration-300
              ${step.status === 'completed' ? 'bg-rice-secondary-500 border-rice-secondary-600 shadow-lg' :
                step.status === 'active' ? 'bg-rice-secondary-400 border-rice-secondary-500 shadow-md animate-pulse-slow' :
                'bg-white border-rice-secondary-300'}
            `}>
              <span className="text-xl">{step.icon}</span>
              {step.status === 'completed' && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>

            {/* Step label */}
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                step.status === 'active' ? 'text-rice-secondary-700' :
                step.status === 'completed' ? 'text-rice-secondary-800' :
                'text-gray-500'
              }`}>
                {step.name}
              </p>
            </div>

            {/* Connecting line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-6 h-0.5 bg-gradient-to-r from-rice-secondary-400 to-rice-secondary-200 relative">
                <div className={`
                  absolute top-0 left-0 h-full bg-rice-secondary-500 transition-all duration-500
                  ${step.status === 'completed' ? 'w-full' : 'w-0'}
                `}></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Simple error boundary with rice theme
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ScanPage Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-rice-secondary-100 via-rice-primary-50 to-rice-secondary-200 flex items-center justify-center p-4">
          <div className="max-w-lg w-full text-center backdrop-blur-lg bg-white/70 rounded-xl shadow-xl border border-rice-secondary-200/50 p-8">
            <div className="text-6xl mb-4">🌾</div>
            <h1 className="text-2xl font-bold text-rice-secondary-800 mb-4">Something went wrong</h1>
            <p className="text-rice-secondary-700 mb-6">
              We're having trouble with the disease detection system. Please try refreshing the page.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-3 bg-rice-secondary-600 text-white rounded-lg font-semibold hover:bg-rice-secondary-700 focus:outline-none focus:ring-2 focus:ring-rice-secondary-500 shadow-lg hover:shadow-xl transition-all duration-200"
                aria-label="Refresh the page to try again"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-4 py-3 bg-white/80 text-rice-secondary-800 border border-rice-secondary-300 rounded-lg font-semibold hover:bg-rice-secondary-50 focus:outline-none focus:ring-2 focus:ring-rice-secondary-500 shadow-lg hover:shadow-xl transition-all duration-200"
                aria-label="Go back to home page"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Enhanced upload zone with agricultural theme
const UploadZone = ({ onImageSelect, preview }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      onImageSelect({ target: { files: [files[0]] } });
    }
  }, [onImageSelect]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (e) => {
    onImageSelect(e);
  };

  return (
    <div
      className={`
        relative cursor-pointer rounded-xl overflow-hidden backdrop-blur-xl
        ${isDragging
          ? 'border-4 border-rice-secondary-500 bg-rice-secondary-50/80'
          : 'border-3 border-rice-secondary-400/50 bg-white/60 hover:bg-white/70'
        }
        hover:border-rice-secondary-500/70
        border-dashed transition-all duration-300
        shadow-xl hover:shadow-2xl
        border-white/40
      `}
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      aria-label="Upload rice leaf image for disease detection"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className={`min-h-[350px] md:min-h-[400px] p-6 md:p-8 flex flex-col items-center justify-center`}>
        {preview ? (
          <div className="relative w-full h-full min-h-[350px]">
            <img
              src={preview}
              alt="Uploaded rice leaf showing disease symptoms"
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity duration-200 rounded-lg flex items-center justify-center">
              <div className="text-white text-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                <div className="text-3xl mb-2">📷</div>
                <p className="text-base font-semibold">Click to take a new photo</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-8 w-full max-w-lg">
            {/* Upload icon */}
            <div className="text-7xl text-rice-secondary-600 animate-bounce-gentle">
              📸
            </div>

            {/* Upload text */}
            <div className="space-y-5">
              <h2 className="text-3xl font-bold text-rice-secondary-800">
                Upload Rice Leaf Photo
              </h2>
              <p className="text-lg text-rice-secondary-700 leading-relaxed">
                Take a clear photo of the affected rice leaf for instant AI disease detection
              </p>
              <p className="text-base text-rice-secondary-600">
                Supported: JPG, PNG, GIF (Max 8MB) • Works best with good lighting
              </p>
            </div>

            {/* Browse button */}
            <button className="px-8 py-4 bg-rice-secondary-600 text-white rounded-lg font-semibold hover:bg-rice-secondary-700 focus:outline-none focus:ring-2 focus:ring-rice-secondary-500 text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
              Browse Files
            </button>
          </div>
        )}
      </div>

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-rice-secondary-500/20 backdrop-blur-md rounded-xl flex items-center justify-center">
          <div className="text-center p-6 backdrop-blur-lg bg-white/90 rounded-lg border border-rice-secondary-300/50">
            <div className="text-4xl mb-4 animate-bounce-gentle">🌾</div>
            <p className="text-lg font-bold text-rice-secondary-800">Drop your photo here!</p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="sr-only"
        aria-label="Select image file for disease analysis"
      />
    </div>
  );
};

// Enhanced results panel with agricultural theme
const ResultsPanel = ({ result, isAnalyzing }) => {
  if (isAnalyzing) {
    return (
      <div className="backdrop-blur-xl bg-white/80 rounded-xl shadow-2xl border border-rice-secondary-200/50 p-6">
        <div className="text-center py-12">
          <LoadingSpinner message="Analyzing Your Rice Leaf" />
          <div className="mt-6">
            <p className="text-lg text-rice-secondary-700">
              Our AI is examining your rice leaf for disease patterns...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const getDiseaseStatus = (disease) => {
    const diseaseLower = disease.toLowerCase();
    if (diseaseLower.includes('healthy')) return { type: 'healthy', icon: '🌾', color: 'farm-leaf' };
    if (diseaseLower.includes('bacterial')) return { type: 'critical', icon: '⚠️', color: 'disease-bacterial' };
    if (diseaseLower.includes('brown')) return { type: 'warning', icon: '🍂', color: 'disease-brown' };
    if (diseaseLower.includes('smut')) return { type: 'warning', icon: '🔥', color: 'disease-smut' };
    return { type: 'unknown', icon: '❓', color: 'gray' };
  };

  const diseaseStatus = getDiseaseStatus(result.disease);
  const confidencePercentage = parseFloat(result.confidence);

  const getStatusClass = (type) => {
    switch (type) {
      case 'healthy': return 'bg-farm-leaf/10 border-farm-leaf/30 text-farm-leaf';
      case 'warning': return 'bg-disease-brown/10 border-disease-brown/30 text-disease-brown';
      case 'critical': return 'bg-disease-bacterial/10 border-disease-bacterial/30 text-disease-bacterial';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Disease Status */}
      <div className="backdrop-blur-xl bg-white/80 rounded-xl shadow-2xl border border-rice-secondary-200/50 p-6 text-center">
        <div className={`inline-flex items-center px-4 py-2 rounded-full border-2 ${getStatusClass(diseaseStatus.type)}`}>
          <span className="text-2xl mr-2">{diseaseStatus.icon}</span>
          <span className="font-semibold">{result.disease}</span>
        </div>
      </div>

      {/* Confidence Score */}
      <div className="backdrop-blur-xl bg-white/80 rounded-xl shadow-2xl border border-rice-secondary-200/50 p-6">
        <h3 className="text-lg font-bold text-rice-secondary-800 mb-4 flex items-center">
          <span className="text-2xl mr-2">📊</span>
          Confidence Level
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-rice-secondary-700">Confidence</span>
            <span className="text-2xl font-bold text-rice-secondary-800">{confidencePercentage}%</span>
          </div>
          <div className="w-full bg-rice-secondary-100 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-rice-secondary-400 to-rice-secondary-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${confidencePercentage}%` }}
              aria-label={`Confidence level: ${confidencePercentage}%`}
            ></div>
          </div>
          <p className="text-sm text-rice-secondary-600 text-center">
            {confidencePercentage > 90 ? 'Very High Confidence' :
             confidencePercentage > 75 ? 'High Confidence' :
             confidencePercentage > 60 ? 'Medium Confidence' :
             'Low Confidence - Please Take Another Photo'}
          </p>
        </div>
      </div>

      {/* Recommendation */}
      <div className="backdrop-blur-xl bg-white/80 rounded-xl shadow-2xl border border-rice-secondary-200/50 p-6">
        <h3 className="text-lg font-bold text-rice-secondary-800 mb-4 flex items-center">
          <span className="text-2xl mr-2">💡</span>
          Recommended Action
        </h3>
        <p className="text-rice-secondary-700 leading-relaxed">
          {result.recommendation}
        </p>
      </div>

      {/* Analysis Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="backdrop-blur-xl bg-white/80 rounded-xl shadow-2xl border border-rice-secondary-200/50 p-4">
          <div className="text-rice-secondary-600 mb-2 flex items-center">
            <span className="text-xl mr-2">📅</span>
            Date
          </div>
          <div className="font-bold text-rice-secondary-800">
            {result.timestamp ? new Date(result.timestamp).toLocaleDateString() : 'Today'}
          </div>
        </div>
        <div className="backdrop-blur-xl bg-white/80 rounded-xl shadow-2xl border border-rice-secondary-200/50 p-4">
          <div className="text-rice-secondary-600 mb-2 flex items-center">
            <span className="text-xl mr-2">🕐</span>
            Time
          </div>
          <div className="font-bold text-rice-secondary-800">
            {result.timestamp ? new Date(result.timestamp).toLocaleTimeString() : 'Just now'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button className="px-4 py-3 bg-rice-secondary-600 text-white rounded-lg font-semibold hover:bg-rice-secondary-700 focus:outline-none focus:ring-2 focus:ring-rice-secondary-500 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
          </svg>
          Save Result
        </button>
        <button className="px-4 py-3 bg-white/80 text-rice-secondary-800 border border-rice-secondary-300 rounded-lg font-semibold hover:bg-rice-secondary-50 focus:outline-none focus:ring-2 focus:ring-rice-secondary-500 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
          </svg>
          Share Result
        </button>
      </div>
    </div>
  );
};

// Enhanced navigation with rice theme
const NavigationHeader = ({ onLogout, onHistory, currentPage }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    setIsMenuOpen(false);
  };

  const handleHistory = () => {
    onHistory();
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/60 border-b border-rice-secondary-200/50 shadow-lg">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src={`${process.env.PUBLIC_URL}/logo.png`}
              alt="RiceGuard Logo - Rice leaf disease detection"
              className="h-10 w-10 object-contain"
            />
            <div className="ml-3">
              <h1 className="text-xl font-bold text-rice-secondary-800">RiceGuard</h1>
              <p className="text-sm text-rice-secondary-600">Smart Crop Protection</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4">
            <button
              onClick={handleHistory}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${currentPage === 'history'
                  ? 'bg-rice-secondary-100 text-rice-secondary-800 border border-rice-secondary-300'
                  : 'text-rice-secondary-700 hover:text-rice-secondary-900 hover:bg-rice-secondary-50 border border-transparent'
                }
              `}
              aria-label="Go to scan history"
            >
              History
            </button>
            <button
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border
                ${currentPage === 'scan'
                  ? 'bg-rice-secondary-100 text-rice-secondary-800 border-rice-secondary-300'
                  : 'text-rice-secondary-700 hover:text-rice-secondary-900 hover:bg-rice-secondary-50 border-transparent'
                }
              `}
              aria-label="Current page: Scan"
              aria-current="page"
            >
              Scan
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-3 bg-white/80 text-rice-secondary-800 border border-rice-secondary-300 rounded-lg font-medium hover:bg-rice-secondary-50 focus:outline-none focus:ring-2 focus:ring-rice-secondary-500 shadow-lg hover:shadow-xl transition-all duration-200"
              aria-label="Log out of your account"
            >
              Log Out
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-rice-secondary-700 hover:text-rice-secondary-900 hover:bg-rice-secondary-50 transition-colors duration-200"
              aria-label="Toggle navigation menu"
              aria-expanded={isMenuOpen}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 space-y-2 border-t border-rice-secondary-200 mt-4">
            <button
              onClick={handleHistory}
              className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-rice-secondary-700 hover:text-rice-secondary-900 hover:bg-rice-secondary-50 transition-colors duration-200"
            >
              History
            </button>
            <div className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium bg-rice-secondary-100 text-rice-secondary-800 border border-rice-secondary-300">
              Scan
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-rice-secondary-700 hover:text-rice-secondary-900 hover:bg-rice-secondary-50 transition-colors duration-200"
            >
              Log Out
            </button>
          </div>
        )}
      </nav>
    </header>
  );
};

// Enhanced main ScanPage component with progress tracking
function ScanPage() {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);

  // Calculate current step for progress stepper
  const getCurrentStep = () => {
    if (result) return 3; // Results
    if (loading) return 2; // Analysis
    if (image || preview) return 1; // Upload
    return 0; // Initial state
  };

  // Auth check
  useEffect(() => {
    const t = localStorage.getItem("token");
    setToken(t);
    if (!t) navigate("/");
  }, [navigate]);

  // Cleanup preview URL on unmount / change
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // Clear error when dependencies change
  useEffect(() => {
    if (error && image && token) {
      setError(null);
    }
  }, [image, token, error]);

  // Enhanced image select with better validation
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (8MB limit)
      if (file.size > 8 * 1024 * 1024) {
        setError('File size must be less than 8MB. Please take a smaller photo.');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a photo file (JPG, PNG, or GIF).');
        return;
      }

      setImage(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
      setResult(null);
      setError(null);
    }
  };

  // Enhanced upload with better error handling
  const handleUpload = async () => {
    if (!image) {
      setError('Please take a photo of the rice leaf first.');
      return;
    }
    if (!token) {
      setError('You must be logged in to analyze rice leaves.');
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      setError(null);

      const data = await uploadScan({ file: image, token });

      const diseaseKeyRaw = data.label;
      let recText = "";
      try {
        let key = diseaseKeyRaw;
        if (!/^[a-z_]+$/.test(key)) key = diseaseKeyRaw.toLowerCase().replace(/\s+/g, "_");

        const rec = await getRecommendation(key);
        recText = Array.isArray(rec?.steps) ? rec.steps.join(" ") : "";
      } catch (recError) {
        console.warn('Recommendation fetch failed:', recError);
        recText = "Please consult with your local agricultural extension office for specific treatment recommendations based on your growing conditions.";
      }

      const newResult = {
        disease: diseaseKeyRaw,
        confidence: typeof data.confidence === "number" ? (data.confidence * 100).toFixed(1) : data.confidence,
        recommendation: recText || "Please consult with an agricultural expert for specific guidance.",
        timestamp: data.createdAt,
      };

      setResult(newResult);
      console.log("Analysis completed:", newResult);
    } catch (error) {
      console.error("Analysis error:", error);
      setError(error.message || 'Unable to analyze the image. Please try taking another photo in better lighting conditions.');
    } finally {
      setLoading(false);
    }
  };

  const handleHistory = () => navigate("/history");
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + Enter to scan
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && image && !loading) {
        e.preventDefault();
        handleUpload();
      }
      // Escape to clear
      if (e.key === 'Escape' && image) {
        setImage(null);
        setPreview(null);
        setResult(null);
        setError(null);
      }
      // H for history
      if (e.key === 'h' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleHistory();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [image, loading, handleUpload, handleHistory]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-rice-secondary-100 via-rice-primary-50 to-rice-secondary-200">
        <SkipLink targetId="main-content">Skip to main content</SkipLink>

        <NavigationHeader
          onLogout={handleLogout}
          onHistory={handleHistory}
          currentPage="scan"
        />

        <main id="main-content" className="max-w-5xl xl:max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
          {/* Progress Stepper */}
          <ProgressStepper currentStep={getCurrentStep()} />

          <div className="backdrop-blur-xl bg-white/80 rounded-2xl shadow-2xl border border-rice-secondary-200/50 p-6 mb-6">
          {/* Page Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <span className="text-4xl mr-3 animate-bounce-gentle">🌾</span>
              <h1 className="text-2xl md:text-3xl font-bold text-rice-secondary-800">
                Rice Disease Detection
              </h1>
            </div>
            <p className="text-base md:text-lg text-rice-secondary-700 max-w-2xl mx-auto">
              Protect your harvest with instant AI-powered disease detection.
              Take a clear photo of your rice leaf and get personalized treatment recommendations.
            </p>
          </div>

          {/* Error Alert with rice theme */}
          {error && (
            <div className="mb-6 max-w-2xl mx-auto">
              <div className="backdrop-blur-lg bg-red-50/80 border-l-4 border-red-400 p-4 rounded-lg border border-red-200/50" role="alert">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-red-500 text-xl mt-0.5">⚠️</span>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-bold text-red-800 mb-1">Unable to Process</h3>
                    <div className="text-sm text-red-700">
                      {error}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Grid - Responsive Layout */}
          <div className="grid xl:grid-cols-2 gap-6 lg:gap-4">
            {/* Upload Section */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-rice-secondary-800 mb-4 flex items-center">
                  <span className="text-2xl md:text-3xl mr-2">📷</span>
                  Capture Rice Leaf
                </h2>
                <UploadZone
                  onImageSelect={handleImageUpload}
                  preview={preview}
                />
              </div>

              {/* Action Buttons */}
              {preview && (
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleUpload}
                    disabled={loading || !image}
                    className="flex-1 px-6 py-3 bg-rice-secondary-600 text-white rounded-lg font-semibold hover:bg-rice-secondary-700 focus:outline-none focus:ring-2 focus:ring-rice-secondary-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    aria-label={loading ? "Analyzing image, please wait" : "Analyze uploaded image for disease"}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline mr-2" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Analyze Leaf</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setImage(null);
                      setPreview(null);
                      setResult(null);
                      setError(null);
                    }}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-white/80 text-rice-secondary-800 border border-rice-secondary-300 rounded-lg font-semibold hover:bg-rice-secondary-50 focus:outline-none focus:ring-2 focus:ring-rice-secondary-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    aria-label="Clear uploaded image and take new photo"
                  >
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Take New Photo</span>
                  </button>
                </div>
              )}

              {/* Quick Tips with rice theme */}
              <div className="backdrop-blur-lg bg-rice-secondary-50/80 rounded-xl p-6 border border-rice-secondary-200/50">
                <h3 className="text-lg font-bold text-rice-secondary-800 mb-4 flex items-center">
                  <span className="text-2xl mr-2">💡</span>
                  Tips for Best Results
                </h3>
                <ul className="space-y-3 text-sm text-rice-secondary-700">
                  <li className="flex items-start">
                    <span className="text-rice-secondary-500 mr-2 text-lg">🌞</span>
                    <span>Take photos in bright, natural daylight</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-rice-secondary-500 mr-2 text-lg">🎯</span>
                    <span>Focus on affected areas of the leaf</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-rice-secondary-500 mr-2 text-lg">🍃</span>
                    <span>Include healthy tissue for comparison</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-rice-secondary-500 mr-2 text-lg">📸</span>
                    <span>Avoid shadows and blurry images</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Results Section */}
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-rice-secondary-800 mb-4 flex items-center">
                <span className="text-2xl md:text-3xl mr-2">🔬</span>
                Analysis Results
              </h2>
              <ResultsPanel result={result} isAnalyzing={loading} />

              {!result && !loading && (
                <div className="backdrop-blur-xl bg-white/80 rounded-xl shadow-2xl border border-rice-secondary-200/50 p-12 text-center">
                  <div className="text-6xl text-rice-secondary-300 mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-rice-secondary-800 mb-2">
                    Ready for Analysis
                  </h3>
                  <p className="text-rice-secondary-700">
                    Take a photo of your rice leaf and click "Analyze" to get started with instant disease detection.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Keyboard Shortcuts Help with rice theme */}
          <div className="mt-12 text-center">
            <details className="inline-block text-left">
              <summary className="cursor-pointer text-sm text-rice-secondary-500 hover:text-rice-secondary-700 transition-colors duration-200">
                Keyboard shortcuts
              </summary>
              <div className="mt-2 p-4 backdrop-blur-lg bg-rice-secondary-50/80 rounded-lg text-xs text-rice-secondary-600 border border-rice-secondary-200/50">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <kbd className="px-2 py-1 bg-white/80 rounded border border-rice-secondary-300 font-mono">Ctrl</kbd>
                    <span> + </span>
                    <kbd className="px-2 py-1 bg-white/80 rounded border border-rice-secondary-300 font-mono">Enter</kbd>
                    <span> - Analyze image</span>
                  </div>
                  <div>
                    <kbd className="px-2 py-1 bg-white/80 rounded border border-rice-secondary-300 font-mono">Esc</kbd>
                    <span> - Clear image</span>
                  </div>
                </div>
              </div>
            </details>
          </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default ScanPage;