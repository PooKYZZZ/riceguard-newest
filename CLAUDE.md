# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RiceGuard is a multi-platform rice leaf disease detection system built by Team 27. It consists of:
- **Backend**: FastAPI server with ML classification, JWT auth, and MongoDB persistence
- **Frontend**: React web application for uploading and viewing scans
- **Mobile**: React Native (Expo) app for on-device scanning with optional backend sync
- **ML**: TensorFlow model for rice disease classification

## Development Commands

### Backend (FastAPI)
```bash
cd backend
# Setup virtual environment
python -m venv .venv
. .\.venv\Scripts\Activate.ps1  # Windows PowerShell
pip install -r requirements.txt

# Development server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Production
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend (React)
```bash
cd frontend
npm install
npm start        # Development server on port 3000
npm run build    # Production build
npm test         # Run tests
```

### Mobile App (Expo)
```bash
cd mobileapp/riceguard
npm install

# Development (device over LAN)
$env:EXPO_PUBLIC_API_BASE_URL="http://<PC_IP>:8000/api/v1"
$env:REACT_NATIVE_PACKAGER_HOSTNAME="<PC_IP>"
npx expo start --lan --clear

# Development (tunnel)
npx expo start --tunnel --clear

# Platform-specific
npm run android
npm run ios
npm run web
```

### Full Development Stack
```bash
# Run both backend and frontend together
python dev_runner.py
```

## Architecture

### Backend Structure
- `main.py`: FastAPI app entry point with CORS and lifecycle management
- `routers.py`: API endpoints for auth, scans, and recommendations
- `models.py`: Pydantic models for requests/responses
- `ml_service.py`: TensorFlow model integration and image preprocessing
- `db.py`: MongoDB connection and index management
- `security.py`: JWT authentication and password hashing
- `settings.py`: Environment configuration management
- `storage.py`: File upload handling
- `seed.py`: Database seeding for disease recommendations

### API Endpoints
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login with JWT tokens
- `POST /api/v1/scans` - Upload and classify image scans
- `GET /api/v1/scans` - Get user's scan history
- `GET /api/v1/recommendations/{diseaseKey}` - Treatment recommendations

### Frontend Structure
- React app using Create React App with React Router
- Components for image upload, scan results, and user authentication
- Axios for API communication with backend
- Runs on port 3000 by default

### Mobile App Structure
- Expo React Native app with navigation
- Image picker functionality for camera/gallery access
- Can run TensorFlow Lite models on-device
- API integration for backend synchronization
- Uses Nunito font via expo-google-fonts

### ML Model Integration
- Backend uses TensorFlow model at `backend/ml/model.h5`
- Mobile uses TensorFlow Lite model
- Image preprocessing handled in `ml_service.py`
- Model classifies rice leaf diseases and provides confidence scores

## Configuration

### Backend Environment (.env)
```
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/riceguard_db
DB_NAME=riceguard_db
JWT_SECRET=CHANGE_ME_SUPER_SECRET
JWT_ALGORITHM=HS256
TOKEN_EXPIRE_HOURS=6
UPLOAD_DIR=uploads
MAX_UPLOAD_MB=8
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173
```

### Frontend Environment (.env)
```
REACT_APP_API_URL=http://127.0.0.1:8000/api/v1
```

### Mobile Environment
Set via environment variables before starting:
- `EXPO_PUBLIC_API_BASE_URL` - Backend API URL
- `REACT_NATIVE_PACKAGER_HOSTNAME` - PC IP for LAN development

## Database

- **MongoDB Atlas** for production, local MongoDB for development
- Collections: users, scans, recommendations
- User authentication with JWT tokens
- Scan history with image metadata and classification results

## Testing

- Backend tests in `backend/tests/`
- Frontend tests using React Testing Library
- Mobile testing via Expo Go app or device simulators

## Development Notes

- Backend serves both web and mobile applications
- CORS configured for multiple development origins
- File uploads stored locally in `uploads/` directory
- ML model files (.h5, .tflite) are large binaries and not tracked in git
- Development runner (`dev_runner.py`) starts both backend and frontend together

## Enhanced Development Tools

This project supports advanced development workflows using MCP servers and Claude Code plugins. For comprehensive guidance on using these tools, see: **[PLUGIN_AND_MCP_GUIDE.md](PLUGIN_AND_MCP_GUIDE.md)**

### Available Tools:
- **MCP Servers**: GitHub, Filesystem, Brave Search, Memory, Playwright, Sequential Thinking, Context7
- **Claude Code Plugins**: fullstack-starter-pack, ai-ml-engineering-pack, data-visualization-creator

### Quick Examples:
```bash
# Research and planning
"Search for rice disease detection best practices using Brave search"
"Use sequential thinking to plan new features"

# Development with plugins
"Use ai-ml-engineering-pack to optimize the TensorFlow model"
"Generate React components using fullstack-starter-pack"
"Create analytics dashboards using data-visualization-creator"

# Project management
"Use filesystem to explore project structure"
"Test the web app using Playwright"
"Remember important decisions using memory"
```

## Security Policy

**IMPORTANT**: This is an academic capstone project for educational purposes only (CPE025/CPE026).

- **NEVER** modify or improve security configurations - keep existing implementation as-is
- **DO NOT** add additional authentication, authorization, or security measures
- **DO NOT** fix or address security vulnerabilities, exposed environment variables, or weak secrets
- **DO NOT** implement production-grade security practices
- Current security configuration (including any exposed .env files, weak JWT secrets, permissive CORS, etc.) must remain unchanged
- This is intentional for the school project environment and should not be "fixed"