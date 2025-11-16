# RiceGuard Product Requirements Document (PRD)

## 1. Executive Summary

RiceGuard is a multi-platform rice leaf disease detection system designed to help farmers and agricultural workers quickly identify and manage rice plant diseases. The system combines machine learning image classification with user-friendly mobile and web interfaces to provide instant disease detection and treatment recommendations.

### Key Features
- AI-powered rice leaf disease detection using TensorFlow models
- Cross-platform support (Web, Mobile) with unified backend API
- User authentication and scan history tracking
- Disease-specific treatment recommendations
- Image upload and preprocessing pipeline

## 2. Product Overview

### 2.1 Problem Statement
Rice farmers face significant challenges in identifying and treating plant diseases early, leading to reduced crop yields and economic losses. Traditional disease identification requires agricultural expertise and can be time-consuming, delaying critical treatment decisions.

### 2.2 Solution
RiceGuard provides an accessible, AI-driven solution that:
- Instantly analyzes rice leaf images to detect common diseases
- Provides confidence scores and treatment recommendations
- Maintains scan history for tracking disease patterns
- Works both online (web) and offline (mobile on-device)

### 2.3 Target Users
- **Primary**: Rice farmers and agricultural workers
- **Secondary**: Agricultural extension workers, researchers, students
- **Tertiary**: Home gardeners and hobbyists growing rice

## 3. Functional Requirements

### 3.1 User Authentication

#### 3.1.1 User Registration
- Users can create accounts using email and password
- Minimum password requirements: 8 characters
- Email validation for account creation
- Automatic name generation from email username

#### 3.1.2 User Login
- JWT-based authentication system
- Token expiration: 6 hours (configurable)
- Persistent login sessions using browser storage
- Secure password verification using bcrypt

### 3.2 Image Analysis and Disease Detection

#### 3.2.1 Supported Diseases
The system detects and classifies the following rice leaf diseases:
- **Bacterial Leaf Blight** (bacterial_leaf_blight)
- **Brown Spot** (brown_spot)
- **Leaf Blast** (leaf_blast)
- **Leaf Scald** (leaf_scald)
- **Narrow Brown Spot** (narrow_brown_spot)
- **Healthy** (healthy)
- **Uncertain** (uncertain) - for low-confidence predictions

#### 3.2.2 Image Upload and Processing
- Support for common image formats (JPEG, PNG)
- Maximum file size: 8MB (configurable)
- Image preprocessing for ML model compatibility
- Automatic image storage and reference tracking

#### 3.2.3 ML Model Integration
- TensorFlow model for backend inference
- TensorFlow Lite model for mobile on-device processing
- Confidence score calculation (0-100%)
- Model version tracking for auditability

### 3.3 Treatment Recommendations

#### 3.3.1 Disease-Specific Recommendations
Each detected disease provides structured treatment guidance:
- **Bacterial Leaf Blight**: Clean seeds, field sanitation, water management, nitrogen control
- **Brown Spot**: Remove infected leaves, proper drainage, balanced fertilization
- **Leaf Blast**: Resistant varieties, synchronized planting, proper spacing
- **Leaf Scald**: Balanced fertilization, irrigation management, crop rotation
- **Narrow Brown Spot**: Resistant varieties, proper spacing, potassium emphasis
- **Healthy**: Maintenance practices and monitoring guidance

#### 3.3.2 Recommendation Management
- Versioned recommendation system
- Regular content updates and maintenance
- Migration support for legacy disease keys

### 3.4 User Data Management

#### 3.4.1 Scan History
- Complete scan history for authenticated users
- Timestamped scan records with metadata
- Image URLs and model version tracking
- User notes and annotations support

#### 3.4.2 Data Operations
- Individual scan deletion
- Bulk scan deletion operations
- Scan filtering and sorting by date
- Data export capabilities (future enhancement)

## 4. Non-Functional Requirements

### 4.1 Performance
- **Response Time**: Image analysis under 5 seconds
- **Concurrent Users**: Support 100+ simultaneous users
- **Upload Speed**: Image processing completion within 10 seconds
- **Mobile Performance**: On-device inference under 3 seconds

### 4.2 Usability
- **Mobile-First Design**: Responsive layouts for all screen sizes
- **Accessibility**: WCAG 2.1 AA compliance where applicable
- **Multi-Language**: English language support (expandable)
- **Offline Capability**: Mobile app limited offline functionality

### 4.3 Reliability
- **Uptime**: 99% availability for production deployments
- **Data Backup**: Automated MongoDB Atlas backups
- **Error Handling**: Graceful degradation for model failures
- **Recovery**: Automatic service restart and health monitoring

### 4.4 Security
- **Note**: Educational project with intentionally basic security configuration
- **Authentication**: JWT tokens with configurable expiration
- **Data Storage**: MongoDB Atlas with network access controls
- **File Upload**: Type and size restrictions
- **CORS**: Configurable origin allowlist for development

### 4.5 Scalability
- **Backend**: Horizontal scaling capability via FastAPI
- **Database**: MongoDB Atlas automatic scaling
- **File Storage**: Configurable local or cloud storage
- **ML Inference**: Model loading optimization for high volume

## 5. Technical Architecture

### 5.1 System Components

#### 5.1.1 Backend API (FastAPI)
- **Framework**: FastAPI with Uvicorn server
- **Authentication**: JWT tokens with python-jose
- **Database**: MongoDB Atlas with pymongo
- **ML Integration**: TensorFlow 2.x model serving
- **File Storage**: Local file system with static serving

#### 5.1.2 Web Frontend (React)
- **Framework**: React 19.x with Create React App
- **Routing**: React Router DOM for SPA navigation
- **API Communication**: Axios for HTTP requests
- **Styling**: CSS modules with responsive design
- **State Management**: React hooks and local storage

#### 5.1.3 Mobile Application (Expo React Native)
- **Framework**: Expo SDK 54.x
- **Navigation**: React Navigation with native stack
- **Fonts**: Nunito font family via expo-google-fonts
- **Image Processing**: expo-image-picker for camera/gallery access
- **Offline ML**: TensorFlow Lite integration

#### 5.1.4 Machine Learning Pipeline
- **Backend Model**: TensorFlow (.h5) for server-side inference
- **Mobile Model**: TensorFlow Lite (.tflite) for on-device processing
- **Preprocessing**: Image normalization and resizing
- **Output**: Disease classification with confidence scores

### 5.2 API Specification

#### 5.2.1 Authentication Endpoints
```
POST /api/v1/auth/register
POST /api/v1/auth/login
```

#### 5.2.2 Scan Management Endpoints
```
POST /api/v1/scans              # Upload and analyze image
GET /api/v1/scans               # Get user scan history
DELETE /api/v1/scans/{id}       # Delete individual scan
POST /api/v1/scans/bulk-delete  # Delete multiple scans
```

#### 5.2.3 Recommendation Endpoints
```
GET /api/v1/recommendations/{diseaseKey}  # Get treatment guidance
```

#### 5.2.4 System Endpoints
```
GET /health                       # Service health check
GET /docs                         # API documentation
GET /uploads/{filename}           # Static image serving
```

### 5.3 Data Models

#### 5.3.1 User Model
```javascript
{
  _id: ObjectId,
  name: string,
  email: string,
  passwordHash: string,
  createdAt: DateTime
}
```

#### 5.3.2 Scan Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  label: DiseaseKey,
  confidence: float,
  modelVersion: string,
  notes: string,
  imageUrl: string,
  createdAt: DateTime
}
```

#### 5.3.3 Recommendation Model
```javascript
{
  _id: ObjectId,
  diseaseKey: string,
  title: string,
  steps: [string],
  version: string,
  updatedAt: DateTime
}
```

## 6. User Experience Flows

### 6.1 New User Onboarding
1. User accesses web or mobile application
2. Clicks "Sign Up" and enters email/password
3. Account created automatically
4. Redirected to scan interface
5. Welcome message explains basic usage

### 6.2 Disease Detection Flow
1. User navigates to scan page
2. Uploads rice leaf image via file picker or camera
3. Image preview displayed for confirmation
4. Click "SCAN IMAGE" to initiate analysis
5. Loading state during ML inference
6. Results displayed with:
   - Disease classification
   - Confidence percentage
   - Treatment recommendations
   - Analysis timestamp
7. Option to add notes and save to history

### 6.3 History Management Flow
1. User navigates to history page
2. List of previous scans displayed chronologically
3. Each scan shows:
   - Thumbnail image
   - Disease detection result
   - Confidence score
   - Date/time
4. Options to view details, delete individual items, or bulk delete
5. Pagination for large scan histories

## 7. Deployment and Infrastructure

### 7.1 Development Environment
- **Local Development**: dev_runner.py orchestrates backend/frontend
- **Backend Port**: 8000 (configurable)
- **Frontend Port**: 3000 (configurable)
- **Mobile Development**: Expo tunnel or LAN connection
- **Database**: MongoDB Atlas or local MongoDB instance

### 7.2 Production Deployment
- **Backend**: FastAPI with Gunicorn/Uvicorn
- **Frontend**: Static hosting (Netlify, Vercel, or S3)
- **Mobile**: Expo EAS Build and distribution
- **Database**: MongoDB Atlas with appropriate scaling tier
- **File Storage**: Cloud storage integration recommended

### 7.3 Configuration Management
- **Environment Variables**: .env files for all components
- **Development vs Production**: Separate configuration profiles
- **Secret Management**: Environment-based configuration
- **CORS Settings**: Production origin allowlist

## 8. Testing Strategy

### 8.1 Backend Testing
- **Unit Tests**: API endpoint testing with pytest
- **Integration Tests**: Database and ML service integration
- **ML Model Testing**: Prediction accuracy validation
- **Load Testing**: Concurrent user simulation

### 8.2 Frontend Testing
- **Component Tests**: React component rendering and interaction
- **Integration Tests**: API communication workflows
- **End-to-End Tests**: Complete user journey automation
- **Responsive Testing**: Multiple device and screen size validation

### 8.3 Mobile Testing
- **Device Testing**: Real device testing on iOS/Android
- **Expo Go Testing**: Development build validation
- **App Store Testing**: Production build verification
- **Performance Testing**: Memory and CPU usage monitoring

## 9. Success Metrics and KPIs

### 9.1 User Engagement
- Daily active users (DAU)
- Scan completion rate
- User registration to scan conversion
- Session duration and frequency

### 9.2 Technical Performance
- API response time (p95 < 2s)
- Image processing completion rate
- System uptime and availability
- Error rate and failure recovery

### 9.3 ML Model Performance
- Disease detection accuracy (>90% target)
- Confidence score calibration
- False positive/negative rates
- Model inference speed

## 10. Future Enhancements and Roadmap

### 10.1 Short-term (3-6 months)
- Multi-language support (local languages)
- Enhanced image preprocessing
- Advanced filtering and search
- Data export functionality

### 10.2 Medium-term (6-12 months)
- Additional crop disease support
- Weather integration for disease risk prediction
- Community features and knowledge sharing
- Offline-first mobile experience

### 10.3 Long-term (12+ months)
- Advanced analytics and reporting
- IoT sensor integration
- Drone imagery analysis
- AI-powered treatment optimization

## 11. Constraints and Assumptions

### 11.1 Technical Constraints
- Image quality affects detection accuracy
- ML model requires periodic retraining
- Mobile device capabilities vary
- Network connectivity required for web version

### 11.2 Business Constraints
- Educational project scope limitation
- Limited development team resources
- Academic project timeline constraints
- Basic security configuration accepted

### 11.3 Assumptions
- Users have basic smartphone/computer literacy
- Internet access is available for web usage
- Images are captured in adequate lighting conditions
- Users follow provided treatment guidelines

---

**Document Version**: 1.0
**Last Updated**: November 2024
**Project**: RiceGuard - Team 27
**Academic Context**: CPE025 (Software Design) and CPE026 (Emerging Technologies 3)