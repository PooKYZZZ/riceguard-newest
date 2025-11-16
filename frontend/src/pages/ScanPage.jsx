import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { uploadScan, getRecommendation } from "../api";

// Import modern dashboard components
import DashboardCard from "../components/dashboard/DashboardCard";
import UploadZone from "../components/dashboard/UploadZone";
import ConfidenceScore from "../components/dashboard/ConfidenceScore";
import { AnalysisLoading, LoadingOverlay } from "../components/dashboard/LoadingStates";
import { AgriculturalErrorBoundary, InlineError } from "../components/dashboard/ErrorBoundary";

// Utility function for class names (simple implementation)
const cn = (...classes) => classes.filter(Boolean).join(' ');

// Accessible skip link component
const SkipLink = ({ targetId, children }) => (
  <a href={`#${targetId}`} className="skip-link">
    {children}
  </a>
);

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
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div 
              className="ml-3 w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl"
              style={{ display: 'none' }}
            >
              RG
            </div>
            <span className="ml-3 text-xl font-bold text-gray-900">RiceGuard</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={handleHistory}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                currentPage === 'history'
                  ? 'bg-rice-primary-100 text-rice-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
              aria-label="Go to scan history"
            >
              History
            </button>
            <button
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                currentPage === 'scan'
                  ? 'bg-rice-primary-100 text-rice-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
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
          <div className="md:hidden py-4 space-y-2 border-t border-gray-200 mt-4 animate-fade-in">
            <button
              onClick={handleHistory}
              className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
            >
              History
            </button>
            <div className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium bg-rice-primary-100 text-rice-primary-700">
              Scan
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
            >
              Log Out
            </button>
          </div>
        )}
      </nav>
    </header>
  );
};

// Disease Status Badge Component
const DiseaseStatusBadge = ({ disease }) => {
  const getDiseaseConfig = (disease) => {
    const diseaseLower = disease.toLowerCase();
    if (diseaseLower.includes('healthy')) {
      return {
        color: 'green',
        bgColor: 'bg-green-50 border-green-200',
        textColor: 'text-green-700',
        dotColor: 'bg-green-500',
        icon: '✅'
      };
    }
    if (diseaseLower.includes('bacterial')) {
      return {
        color: 'red',
        bgColor: 'bg-red-50 border-red-200',
        textColor: 'text-red-700',
        dotColor: 'bg-red-500',
        icon: '🦠'
      };
    }
    if (diseaseLower.includes('brown')) {
      return {
        color: 'amber',
        bgColor: 'bg-amber-50 border-amber-200',
        textColor: 'text-amber-700',
        dotColor: 'bg-amber-500',
        icon: '🟤'
      };
    }
    if (diseaseLower.includes('smut')) {
      return {
        color: 'purple',
        bgColor: 'bg-purple-50 border-purple-200',
        textColor: 'text-purple-700',
        dotColor: 'bg-purple-500',
        icon: '🟣'
      };
    }
    return {
      color: 'gray',
      bgColor: 'bg-gray-50 border-gray-200',
      textColor: 'text-gray-700',
      dotColor: 'bg-gray-500',
      icon: '⚠️'
    };
  };

  const config = getDiseaseConfig(disease);

  return (
    <div className={cn(
      'inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200',
      config.bgColor,
      config.textColor
    )}>
      <span className="text-lg mr-2">{config.icon}</span>
      <div className={cn('w-2 h-2 rounded-full mr-2 animate-pulse', config.dotColor)} />
      {disease}
    </div>
  );
};

// Results Panel Component
const ResultsPanel = ({ result, isAnalyzing }) => {
  if (isAnalyzing) {
    return (
      <DashboardCard variant="elevated" className="animate-fade-in">
        <AnalysisLoading />
      </DashboardCard>
    );
  }

  if (!result) {
    return (
      <DashboardCard variant="outlined" className="text-center py-12">
        <div className="text-6xl text-gray-300 mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Analysis Yet
        </h3>
        <p className="text-gray-600">
          Upload an image and click "Analyze" to get started with disease detection.
        </p>
      </DashboardCard>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Disease Status Header */}
      <DashboardCard variant="outlined" className="text-center">
        <DiseaseStatusBadge disease={result.disease} />
      </DashboardCard>

      {/* Confidence Score */}
      <DashboardCard>
        <ConfidenceScore 
          score={parseFloat(result.confidence)} 
          size="lg"
          animated={true}
        />
      </DashboardCard>

      {/* Recommendation */}
      <DashboardCard variant="success">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="text-2xl mr-2">💡</span>
            Recommendation
          </h3>
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
            {result.recommendation.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-3 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </DashboardCard>

      {/* Analysis Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DashboardCard size="sm">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-sm text-gray-500 mb-1">Analysis Date</div>
            <div className="font-medium text-gray-900">
              {result.timestamp ? new Date(result.timestamp).toLocaleDateString() : '-'}
            </div>
          </div>
        </DashboardCard>

        <DashboardCard size="sm">
          <div className="text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-sm text-gray-500 mb-1">Analysis Time</div>
            <div className="font-medium text-gray-900">
              {result.timestamp ? new Date(result.timestamp).toLocaleTimeString() : '-'}
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
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

// Quick Tips Component
const QuickTips = () => (
  <DashboardCard variant="info">
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-blue-900 flex items-center">
        <span className="text-2xl mr-2">💡</span>
        Quick Tips for Best Results
      </h3>
      <ul className="space-y-3 text-sm text-blue-800">
        <li className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>Take photos in bright, natural daylight</span>
        </li>
        <li className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>Focus on affected areas of the leaf</span>
        </li>
        <li className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>Include healthy tissue for comparison</span>
        </li>
        <li className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>Avoid shadows and blurry images</span>
        </li>
      </ul>
    </div>
  </DashboardCard>
);

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
  const handleImageUpload = useCallback((e) => {
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
  }, []);

  // Upload + inference
  const handleUpload = useCallback(async () => {
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
  }, [image, token]);

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

  // Memoized components for performance
  const memoizedUploadZone = useMemo(() => (
    <UploadZone
      onImageSelect={handleImageUpload}
      preview={preview}
      isDragActive={isDragActive}
      disabled={loading}
    />
  ), [handleImageUpload, preview, isDragActive, loading]);

  const memoizedResultsPanel = useMemo(() => (
    <ResultsPanel result={result} isAnalyzing={loading} />
  ), [result, loading]);

  return (
    <AgriculturalErrorBoundary>
      <div className="min-h-screen bg-gradient-dashboard">
        <SkipLink targetId="main-content">Skip to main content</SkipLink>

        <NavigationHeader
          onLogout={handleLogout}
          onHistory={handleHistory}
          currentPage="scan"
        />

        <main id="main-content" className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 safe-bottom">
          {/* Page Header */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Rice Leaf Disease Detection
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Upload a clear image of your rice leaf for instant AI-powered disease detection and personalized treatment recommendations.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 max-w-2xl mx-auto animate-fade-in">
              <InlineError 
                error={error} 
                onRetry={() => setError(null)}
                title="Upload Error"
              />
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Upload Section */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Upload Image</h2>
                {memoizedUploadZone}
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
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
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
              <QuickTips />
            </div>

            {/* Results Section */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Analysis Results</h2>
              <LoadingOverlay visible={loading} message="Analyzing your rice leaf...">
                {memoizedResultsPanel}
              </LoadingOverlay>
            </div>
          </div>

          {/* Keyboard Shortcuts Help */}
          <div className="mt-12 text-center">
            <details className="inline-block text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200">
                Keyboard shortcuts
              </summary>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg text-xs text-gray-600 border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <kbd className="px-2 py-1 bg-white rounded border border-gray-300 font-mono">Ctrl</kbd>
                    <span>+</span>
                    <kbd className="px-2 py-1 bg-white rounded border border-gray-300 font-mono">Enter</kbd>
                    <span>- Analyze image</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <kbd className="px-2 py-1 bg-white rounded border border-gray-300 font-mono">Esc</kbd>
                    <span>- Clear image</span>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </main>
      </div>
    </AgriculturalErrorBoundary>
  );
}

export default ScanPage;