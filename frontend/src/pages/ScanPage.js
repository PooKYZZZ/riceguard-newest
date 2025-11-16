import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { uploadScan, getRecommendation } from "../api";

// Enhanced skip link component with agricultural context
const SkipLink = ({ targetId, children }) => (
  <a href={`#${targetId}`} className="skip-link touch-target-large">
    {children}
  </a>
);

// Enhanced loading spinner with agricultural context
const LoadingSpinner = ({ size = "md", message = "Processing" }) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12", 
    lg: "w-16 h-16",
  };

  return (
    <div className="flex flex-col items-center space-y-4" role="status" aria-live="polite">
      <div className={`${sizeClasses[size]} spinner border-4 border-rice-primary-200 border-t-rice-primary-600`}></div>
      <span className="text-lg font-semibold text-gray-700 animate-pulse">{message}</span>
      <span className="sr-only">Loading, please wait</span>
    </div>
  );
};

// Enhanced error boundary with agricultural context
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
        <div className="min-h-screen bg-gradient-to-br from-farm-soil/10 via-white to-farm-leaf/10 flex items-center justify-center p-4">
          <div className="card-field max-w-lg w-full text-center">
            <div className="text-6xl mb-4">🌾</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-6 text-lg leading-relaxed">
              We're having trouble with the disease detection system. Don't worry - your crops are safe! Please try refreshing the page.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="btn-field-primary w-full"
                aria-label="Refresh the page to try again"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="btn-field-secondary w-full"
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

// Enhanced drag and drop with agricultural context
const UploadZone = ({ onImageSelect, preview, isDragActive }) => {
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
        relative group cursor-pointer rounded-2xl overflow-hidden transition-all duration-300
        ${isDragging ? 'scale-[1.03] ring-4 ring-farm-leaf ring-opacity-50 shadow-2xl' : ''}
        ${isDragActive ? 'animate-pulse-slow' : ''}
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
      <div className="card-field min-h-[320px] p-8 flex flex-col items-center justify-center border-3 border-dashed border-outdoor-shadow/40 hover:border-farm-leaf transition-colors duration-300 bg-white/80">
        {preview ? (
          <div className="relative w-full h-full">
            <img
              src={preview}
              alt="Uploaded rice leaf showing disease symptoms"
              className="w-full h-full object-cover rounded-xl shadow-lg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-end justify-center pb-6">
              <div className="text-white text-center">
                <div className="text-3xl mb-2">📷</div>
                <p className="text-lg font-medium">Click to take a new photo</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="text-7xl text-outdoor-shadow/60 group-hover:text-farm-leaf transition-colors duration-300">
              🌾
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Take a Photo of Your Rice Leaf
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Point your camera at the affected rice leaf and tap to capture
              </p>
              <div className="bg-farm-leaf/10 rounded-xl p-4 border-2 border-farm-leaf/30">
                <h3 className="font-semibold text-farm-leaf mb-3">For Best Results:</h3>
                <ul className="text-left text-sm text-gray-700 space-y-2">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Take photos in bright daylight
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Focus on the affected areas
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Include healthy parts for comparison
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

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

// Enhanced workflow step indicator
const WorkflowSteps = ({ currentStep }) => {
  const steps = [
    { id: 1, name: "Capture", icon: "📷", description: "Take photo" },
    { id: 2, name: "Analyze", icon: "🔬", description: "AI analysis" },
    { id: 3, name: "Results", icon: "📋", description: "Get recommendations" },
  ];

  return (
    <div className="bg-white/80 rounded-2xl p-6 border-2 border-outdoor-shadow/20 backdrop-blur-sm">
      <div className="step-indicator justify-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={`
                  step touch-target-large
                  ${currentStep >= step.id ? 'step-completed' : ''}
                  ${currentStep === step.id ? 'step-active' : ''}
                `}
                aria-label={`Step ${step.id}: ${step.name}`}
                aria-current={currentStep === step.id ? 'step' : undefined}
              >
                <span className="text-2xl">{step.icon}</span>
              </div>
              <div className="mt-3 text-center">
                <p className="font-semibold text-gray-900">{step.name}</p>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-4 rounded-full transition-colors duration-300 ${
                currentStep > step.id ? 'bg-outdoor-success' : 'bg-outdoor-shadow/30'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Enhanced results panel with trust indicators
const ResultsPanel = ({ result, isAnalyzing }) => {
  if (isAnalyzing) {
    return (
      <div className="card-field animate-fade-in">
        <div className="text-center py-12">
          <LoadingSpinner size="lg" message="Analyzing Your Rice Leaf" />
          <div className="mt-8 space-y-3">
            <p className="text-lg text-gray-600">
              Our AI is examining your rice leaf for disease patterns...
            </p>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-3 h-3 bg-farm-leaf rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-farm-sun rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-farm-water rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const getDiseaseStatus = (disease) => {
    const diseaseLower = disease.toLowerCase();
    if (diseaseLower.includes('healthy')) return { type: 'healthy', icon: '✅', color: 'green' };
    if (diseaseLower.includes('bacterial')) return { type: 'critical', icon: '⚠️', color: 'red' };
    if (diseaseLower.includes('brown')) return { type: 'warning', icon: '⚡', color: 'orange' };
    if (diseaseLower.includes('smut')) return { type: 'warning', icon: '🔥', color: 'orange' };
    return { type: 'unknown', icon: '❓', color: 'gray' };
  };

  const diseaseStatus = getDiseaseStatus(result.disease);
  const confidencePercentage = parseFloat(result.confidence);

  return (
    <div className={`card-disease-${diseaseStatus.type} animate-slide-up space-y-6`}>
      {/* Disease Status Header */}
      <div className="text-center">
        <div className={`status-${diseaseStatus.type} text-lg`}>
          <span className="text-3xl mr-3">{diseaseStatus.icon}</span>
          {result.disease}
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="flex flex-wrap gap-3 justify-center">
        <div className="trust-badge">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          AI Powered
        </div>
        <div className="trust-badge">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-1a1 1 0 100-2h1a4 4 0 014 4v6a4 4 0 01-4 4H6a4 4 0 01-4-4V7a4 4 0 014-4z" clipRule="evenodd" />
          </svg>
          Expert Verified
        </div>
      </div>

      {/* Confidence Score */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-gray-800">Confidence Level</span>
          <span className="text-2xl font-bold text-gray-900">{confidencePercentage}%</span>
        </div>
        <div className="relative">
          <div className="confidence-meter">
            <div
              className="confidence-fill"
              style={{ width: `${confidencePercentage}%` }}
              aria-label={`Confidence level: ${confidencePercentage}%`}
            ></div>
          </div>
        </div>
        <p className="text-center text-base font-medium text-gray-600">
          {confidencePercentage > 90 ? 'Very High Confidence - Clear Detection' : 
           confidencePercentage > 75 ? 'High Confidence - Likely Accurate' :
           confidencePercentage > 60 ? 'Medium Confidence - Consider Consultation' : 
           'Low Confidence - Please Take Another Photo'}
        </p>
      </div>

      {/* Recommendation */}
      <div className={`card-${diseaseStatus.type === 'critical' ? 'disease-critical' : 'field'} p-6`}>
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <span className="text-3xl mr-3">💡</span>
          Recommended Action
        </h3>
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-700 leading-relaxed text-base">
            {result.recommendation}
          </p>
        </div>
      </div>

      {/* Analysis Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-base">
        <div className="bg-gray-50 rounded-xl p-4 border-2 border-outdoor-shadow/20">
          <div className="text-gray-600 mb-2 font-medium">Analysis Date</div>
          <div className="font-bold text-gray-900 text-lg">
            {result.timestamp ? new Date(result.timestamp).toLocaleDateString() : 'Today'}
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border-2 border-outdoor-shadow/20">
          <div className="text-gray-600 mb-2 font-medium">Analysis Time</div>
          <div className="font-bold text-gray-900 text-lg">
            {result.timestamp ? new Date(result.timestamp).toLocaleTimeString() : 'Just now'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button className="btn-field-primary" aria-label="Save this analysis to your history">
          <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
          </svg>
          Save Result
        </button>
        <button className="btn-field-secondary" aria-label="Share this result with other farmers">
          <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
          </svg>
          Share Result
        </button>
      </div>
    </div>
  );
};

// Enhanced navigation with agricultural context
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
    <header className="glass sticky top-0 z-50 safe-top border-b-2 border-outdoor-shadow/10">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo with agricultural context */}
          <div className="flex items-center">
            <div className="relative">
              <img
                src={`${process.env.PUBLIC_URL}/logo.png`}
                alt="RiceGuard Logo - Rice leaf disease detection"
                className="h-12 w-12 object-contain"
              />
              <span className="absolute -bottom-1 -right-1 text-xl">🌾</span>
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">RiceGuard</h1>
              <p className="text-sm text-gray-600">Smart Crop Protection</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            <button
              onClick={handleHistory}
              className={`
                px-6 py-3 rounded-xl text-base font-semibold transition-all duration-200
                ${currentPage === 'history'
                  ? 'bg-rice-primary-100 text-rice-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
              aria-label="Go to scan history"
            >
              📊 History
            </button>
            <button
              className={`
                px-6 py-3 rounded-xl text-base font-semibold transition-all duration-200
                ${currentPage === 'scan'
                  ? 'bg-rice-primary-100 text-rice-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
              aria-label="Current page: Scan"
              aria-current="page"
            >
              🔬 Scan
            </button>
            <button
              onClick={handleLogout}
              className="btn-field-secondary"
              aria-label="Log out of your account"
            >
              Log Out
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 touch-target-large"
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
          <div className="lg:hidden py-6 space-y-3 border-t-2 border-outdoor-shadow/20 mt-4">
            <button
              onClick={handleHistory}
              className="w-full text-left px-6 py-4 rounded-xl text-base font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 touch-target"
            >
              📊 History
            </button>
            <div className="w-full text-left px-6 py-4 rounded-xl text-base font-semibold bg-rice-primary-100 text-rice-primary-700 touch-target">
              🔬 Scan
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-6 py-4 rounded-xl text-base font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 touch-target"
            >
              Log Out
            </button>
          </div>
        )}
      </nav>
    </header>
  );
};

// Main ScanPage component with enhanced agricultural context
function ScanPage() {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);

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
  }, [image, loading, handleUpload]);

  // Determine current workflow step
  const currentStep = loading ? 2 : result ? 3 : image ? 2 : 1;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-farm-soil/5 via-white to-farm-leaf/5">
        <SkipLink targetId="main-content">Skip to main content</SkipLink>

        <NavigationHeader
          onLogout={handleLogout}
          onHistory={handleHistory}
          currentPage="scan"
        />

        <main id="main-content" className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 safe-bottom">
          {/* Enhanced Page Header */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center mb-4">
              <span className="text-5xl mr-4">🌾</span>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                Rice Disease Detection
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Protect your harvest with instant AI-powered disease detection. 
              Take a clear photo of your rice leaf and get personalized treatment recommendations.
            </p>
          </div>

          {/* Workflow Steps */}
          <div className="mb-10">
            <WorkflowSteps currentStep={currentStep} />
          </div>

          {/* Enhanced Error Alert */}
          {error && (
            <div className="mb-8 max-w-3xl mx-auto">
              <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-2xl animate-fade-in" role="alert">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-400 mt-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-bold text-red-800 mb-2">Unable to Process</h3>
                    <div className="text-base text-red-700">
                      {error}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid xl:grid-cols-2 gap-10 max-w-7xl mx-auto">
            {/* Upload Section */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-4xl mr-3">📷</span>
                  Capture Rice Leaf
                </h2>
                <UploadZone
                  onImageSelect={handleImageUpload}
                  preview={preview}
                  isDragActive={isDragActive}
                />
              </div>

              {/* Enhanced Action Buttons */}
              {preview && (
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 animate-scale-in">
                  <button
                    onClick={handleUpload}
                    disabled={loading || !image}
                    className="btn-field-primary flex-1 touch-target-large"
                    aria-label={loading ? "Analyzing image, please wait" : "Analyze uploaded image for disease"}
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" message="" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Analyze Leaf
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
                    className="btn-field-secondary flex-1 touch-target-large"
                    aria-label="Clear uploaded image and take new photo"
                  >
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Take New Photo
                  </button>
                </div>
              )}

              {/* Enhanced Quick Tips */}
              <div className="bg-gradient-to-r from-farm-leaf/10 to-farm-sun/10 rounded-2xl p-8 border-2 border-farm-leaf/30">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-3xl mr-3">💡</span>
                  Expert Tips for Best Results
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-farm-sun/20 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-farm-sun" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">Bright Natural Light</h4>
                      <p className="text-gray-600">Take photos in daylight for clear visibility</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-farm-leaf/20 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-farm-leaf" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">Focus on Affected Areas</h4>
                      <p className="text-gray-600">Get close to the disease symptoms</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-farm-water/20 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-farm-water" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">Include Healthy Tissue</h4>
                      <p className="text-gray-600">Show both healthy and affected parts</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-farm-harvest/20 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-farm-harvest" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">Avoid Blurry Images</h4>
                      <p className="text-gray-600">Hold steady and wait for good focus</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-4xl mr-3">🔬</span>
                Analysis Results
              </h2>
              <ResultsPanel result={result} isAnalyzing={loading} />

              {!result && !loading && (
                <div className="card-field text-center py-16">
                  <div className="text-7xl text-gray-300 mb-6">🔍</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Ready for Analysis
                  </h3>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    Take a photo of your rice leaf and click "Analyze" to get started with instant disease detection.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Keyboard Shortcuts Help */}
          <div className="mt-16 text-center">
            <details className="inline-block text-left bg-white/80 rounded-2xl p-6 border-2 border-outdoor-shadow/20 backdrop-blur-sm">
              <summary className="cursor-pointer text-lg font-semibold text-gray-700 hover:text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Quick Actions & Shortcuts
              </summary>
              <div className="mt-6 p-4 text-base text-gray-600">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <kbd className="px-3 py-2 bg-gray-100 rounded-lg border-2 border-gray-300 font-mono font-bold mr-3">Ctrl</kbd>
                    <span className="mr-2">+</span>
                    <kbd className="px-3 py-2 bg-gray-100 rounded-lg border-2 border-gray-300 font-mono font-bold mr-3">Enter</kbd>
                    <span>- Analyze image</span>
                  </div>
                  <div className="flex items-center">
                    <kbd className="px-3 py-2 bg-gray-100 rounded-lg border-2 border-gray-300 font-mono font-bold mr-3">Esc</kbd>
                    <span>- Clear image</span>
                  </div>
                  <div className="flex items-center">
                    <kbd className="px-3 py-2 bg-gray-100 rounded-lg border-2 border-gray-300 font-mono font-bold mr-3">H</kbd>
                    <span>- View history</span>
                  </div>
                  <div className="flex items-center">
                    <kbd className="px-3 py-2 bg-gray-100 rounded-lg border-2 border-gray-300 font-mono font-bold mr-3">Tab</kbd>
                    <span>- Navigate elements</span>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default ScanPage;