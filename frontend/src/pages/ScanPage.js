import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { uploadScan, getRecommendation } from "../api";

// Accessible skip link component
const SkipLink = ({ targetId, children }) => (
  <a href={`#${targetId}`} className="skip-link">
    {children}
  </a>
);

// Loading spinner component
const LoadingSpinner = ({ size = "md" }) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={`${sizeClasses[size]} spinner`} role="status" aria-label="Loading">
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Error boundary component
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
        <div className="min-h-screen bg-gradient-rice flex items-center justify-center p-4">
          <div className="card max-w-md w-full text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-6">
              We're having trouble loading the scan page. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Drag and drop upload zone component
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
        ${isDragging ? 'scale-105 ring-4 ring-rice-primary-500 ring-opacity-50' : ''}
        ${isDragActive ? 'animate-pulse-slow' : ''}
      `}
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      aria-label="Upload image area"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="glass min-h-96 min-w-72 p-8 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-rice-primary-400 transition-colors duration-200">
        {preview ? (
          <div className="relative w-full h-full">
            <img
              src={preview}
              alt="Uploaded rice leaf preview"
              className="w-full h-full object-cover rounded-xl shadow-lg"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-4xl mb-2">📷</div>
                <p className="text-sm font-medium">Click to change image</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="text-6xl text-gray-400 group-hover:text-rice-primary-500 transition-colors duration-200">
              📷
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Upload Rice Leaf Image
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Drag and drop or click to browse
              </p>
              <div className="text-xs text-gray-400 space-y-1">
                <p>• Clear, well-lit photos work best</p>
                <p>• Maximum file size: 8MB</p>
                <p>• Supported formats: JPG, PNG, GIF</p>
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
        aria-label="Image file input"
      />
    </div>
  );
};

// Results panel component
const ResultsPanel = ({ result, isAnalyzing }) => {
  if (isAnalyzing) {
    return (
      <div className="card animate-fade-in">
        <div className="text-center py-12">
          <LoadingSpinner size="lg" />
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-2">
            Analyzing Your Image
          </h3>
          <p className="text-gray-600">
            Our AI model is examining the rice leaf for disease patterns...
          </p>
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-rice-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-rice-primary-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-rice-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const getDiseaseColor = (disease) => {
    const diseaseLower = disease.toLowerCase();
    if (diseaseLower.includes('healthy')) return 'disease-healthy';
    if (diseaseLower.includes('bacterial')) return 'disease-bacterial';
    if (diseaseLower.includes('brown')) return 'disease-brown';
    if (diseaseLower.includes('smut')) return 'disease-smut';
    return 'gray-600';
  };

  const diseaseColor = getDiseaseColor(result.disease);
  const confidencePercentage = parseFloat(result.confidence);

  return (
    <div className="card animate-slide-up space-y-6">
      {/* Disease Status Header */}
      <div className="text-center">
        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-${diseaseColor}/10 text-${diseaseColor}`}>
          <div className={`w-2 h-2 rounded-full bg-${diseaseColor} mr-2`}></div>
          {result.disease}
        </div>
      </div>

      {/* Confidence Score */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Confidence Score</span>
          <span className="text-lg font-bold text-gray-900">{confidencePercentage}%</span>
        </div>
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r from-${diseaseColor}/50 to-${diseaseColor} rounded-full transition-all duration-700 ease-out`}
              style={{ width: `${confidencePercentage}%` }}
            ></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">
              {confidencePercentage > 80 ? 'High Confidence' : confidencePercentage > 60 ? 'Medium Confidence' : 'Low Confidence'}
            </span>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <span className="text-2xl mr-2">💡</span>
          Recommendation
        </h3>
        <p className="text-gray-700 leading-relaxed text-sm">
          {result.recommendation}
        </p>
      </div>

      {/* Analysis Details */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-gray-500 mb-1">Analysis Date</div>
          <div className="font-medium text-gray-900">
            {result.timestamp ? new Date(result.timestamp).toLocaleDateString() : '-'}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-gray-500 mb-1">Analysis Time</div>
          <div className="font-medium text-gray-900">
            {result.timestamp ? new Date(result.timestamp).toLocaleTimeString() : '-'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button className="btn-primary flex-1" aria-label="Save this analysis result">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
          </svg>
          Save Result
        </button>
        <button className="btn-secondary flex-1" aria-label="Share this analysis result">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
          </svg>
          Share
        </button>
      </div>
    </div>
  );
};

// Navigation header component
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
    <header className="glass sticky top-0 z-50 safe-top">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src={`${process.env.PUBLIC_URL}/logo.png`}
              alt="RiceGuard Logo"
              className="h-10 w-10 object-contain"
            />
            <span className="ml-3 text-xl font-bold text-gray-900">RiceGuard</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={handleHistory}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                currentPage === 'history'
                  ? 'bg-rice-primary-100 text-rice-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              aria-label="Go to scan history"
            >
              History
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                currentPage === 'scan'
                  ? 'bg-rice-primary-100 text-rice-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              aria-label="Current page: Scan"
              aria-current="page"
            >
              Scan
            </button>
            <button
              onClick={handleLogout}
              className="btn-secondary text-sm"
              aria-label="Log out of your account"
            >
              Log Out
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
          <div className="md:hidden py-4 space-y-2 border-t border-gray-200 mt-4">
            <button
              onClick={handleHistory}
              className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              History
            </button>
            <div className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium bg-rice-primary-100 text-rice-primary-700">
              Scan
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              Log Out
            </button>
          </div>
        )}
      </nav>
    </header>
  );
};

// Main ScanPage component
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

  // Image select + preview
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (8MB limit)
      if (file.size > 8 * 1024 * 1024) {
        setError('File size must be less than 8MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      setImage(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
      setResult(null);
      setError(null);
    }
  };

  // Upload + inference
  const handleUpload = async () => {
    if (!image) {
      setError('Please select an image first');
      return;
    }
    if (!token) {
      setError('You must be logged in to scan');
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
        recText = "Detailed recommendations are currently unavailable. Please consult with an agricultural expert for specific treatment guidance.";
      }

      const newResult = {
        disease: diseaseKeyRaw,
        confidence: typeof data.confidence === "number" ? (data.confidence * 100).toFixed(1) : data.confidence,
        recommendation: recText || "No recommendation available.",
        timestamp: data.createdAt,
      };

      setResult(newResult);
      console.log("Prediction saved:", newResult);
    } catch (error) {
      console.error("Upload error:", error);
      setError(error.message || 'Failed to analyze the image. Please try again.');
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

  // Handle keyboard shortcuts
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [image, loading, handleUpload]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-dashboard">
        <SkipLink targetId="main-content">Skip to main content</SkipLink>

        <NavigationHeader
          onLogout={handleLogout}
          onHistory={handleHistory}
          currentPage="scan"
        />

        <main id="main-content" className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 safe-bottom">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Rice Leaf Disease Detection
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Upload a clear image of your rice leaf for instant AI-powered disease detection and personalized treatment recommendations.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 max-w-2xl mx-auto">
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg animate-fade-in" role="alert">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      {error}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Upload Section */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Upload Image</h2>
                <UploadZone
                  onImageSelect={handleImageUpload}
                  preview={preview}
                  isDragActive={isDragActive}
                />
              </div>

              {/* Action Buttons */}
              {preview && (
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 animate-scale-in">
                  <button
                    onClick={handleUpload}
                    disabled={loading || !image}
                    className="btn-primary flex-1"
                    aria-label={loading ? "Analyzing image" : "Analyze uploaded image"}
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Analyze Image
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
                    className="btn-secondary flex-1"
                    aria-label="Clear uploaded image"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear Image
                  </button>
                </div>
              )}

              {/* Quick Tips */}
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                  <span className="text-2xl mr-2">💡</span>
                  Quick Tips for Best Results
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Take photos in bright, natural daylight
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Focus on affected areas of the leaf
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Include healthy tissue for comparison
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Avoid shadows and blurry images
                  </li>
                </ul>
              </div>
            </div>

            {/* Results Section */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Analysis Results</h2>
              <ResultsPanel result={result} isAnalyzing={loading} />

              {!result && !loading && (
                <div className="card text-center py-12">
                  <div className="text-6xl text-gray-300 mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Analysis Yet
                  </h3>
                  <p className="text-gray-600">
                    Upload an image and click "Analyze" to get started with disease detection.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Keyboard Shortcuts Help */}
          <div className="mt-12 text-center">
            <details className="inline-block text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Keyboard shortcuts
              </summary>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg text-xs text-gray-600">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div><kbd className="px-2 py-1 bg-white rounded border">Ctrl</kbd> + <kbd className="px-2 py-1 bg-white rounded border">Enter</kbd> - Analyze image</div>
                  <div><kbd className="px-2 py-1 bg-white rounded border">Esc</kbd> - Clear image</div>
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