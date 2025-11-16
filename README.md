# 🌾 RiceGuard

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)
[![License](https://img.shields.io/badge/license-Educational%20Use-orange.svg)

> **Multi-platform rice leaf disease detection system** built with FastAPI, React, and TensorFlow. Detect rice plant diseases through AI-powered image analysis and get treatment recommendations.

---

## Table of Contents

- [Quick Start](#-quick-start)
- [Development Workflow](#-development-workflow)
- [Architecture](#-architecture)
- [Key Commands](#-key-commands)
- [OpenSpec Integration](#-openspec-integration)
- [Contributing](#-contributing)
- [Troubleshooting](#-troubleshooting)
- [License](#license)

---

## 🚀 Quick Start

Get RiceGuard running in under 5 minutes with our all-in-one development runner:

```bash
# 1️⃣ Clone the repository
git clone <repository-url>
cd rice

# 2️⃣ Run full development stack (Backend + Frontend)
python dev_runner.py
```

That's it! The development runner will:
- ✅ Set up virtual environments
- ✅ Install all dependencies  
- ✅ Start FastAPI backend on `http://127.0.0.1:8000`
- ✅ Start React frontend on `http://localhost:3000`
- ✅ Configure CORS and file uploads

### 📱 Mobile Development

```bash
# Install Expo CLI (once globally)
npm install -g @expo/cli

# Navigate to mobile app
cd riceguard/mobileapp/riceguard
npm install

# Configure for LAN development (replace with your PC IP)
export EXPO_PUBLIC_API_BASE_URL="http://192.168.1.100:8000/api/v1"
export REACT_NATIVE_PACKAGER_HOSTNAME="192.168.1.100"

# Start Expo development server
npx expo start --lan
```

> **🔧 Pro Tip**: Run `python dev_runner.py --help` for advanced options like tunnel mode, specific ports, and development modes.

---

## ⚙️ Development Workflow

### Core Commands

```bash
# Full development stack
python dev_runner.py                    # Backend + Frontend

# Individual services
cd riceguard/backend && python -m uvicorn app.main:app --reload
cd riceguard/frontend && npm start
cd riceguard/mobileapp/riceguard && npx expo start

# Testing
cd riceguard/backend && python -m pytest
cd riceguard/frontend && npm test

# Code quality
cd riceguard/backend && python -m black app/
cd riceguard/frontend && npm run lint
```

### Environment Setup

**Backend (FastAPI)**
```bash
cd riceguard/backend
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
# .venv\Scripts\Activate.ps1  # Windows
pip install -r requirements.txt
```

**Frontend (React + Tailwind CSS v3)**
```bash
cd riceguard/frontend
npm install
npm start          # Development server
npm run build      # Production build
```

### 🔧 Configuration Files

Create these environment files (examples in `.env.example`):

**Backend (`riceguard/backend/.env`)**
```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/riceguard_db
DB_NAME=riceguard_db
JWT_SECRET=your-super-secret-key
TOKEN_EXPIRE_HOURS=6
UPLOAD_DIR=uploads
MAX_UPLOAD_MB=8
```

**Frontend (`riceguard/frontend/.env`)**
```env
REACT_APP_API_URL=http://127.0.0.1:8000/api/v1
```

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technologies | Purpose |
|------|-------------|---------|
| **Backend** | FastAPI, Uvicorn, Pydantic | REST API, Authentication, ML Integration |
| **Frontend** | React 19, Tailwind CSS v3, Axios | Web Interface, Image Upload, Results Display |
| **Mobile** | React Native (Expo), TensorFlow Lite | On-device Scanning, Offline Support |
| **Database** | MongoDB Atlas | User Data, Scan History, Recommendations |
| **ML** | TensorFlow/Keras, NumPy, Pillow | Disease Classification, Image Processing |
| **Infrastructure** | JWT Auth, CORS, File Upload | Security, Cross-origin Support |

### Project Structure

```
riceguard/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── api/v1/        # API routes (auth, scans, recommendations)
│   │   ├── core/          # Configuration, database, security
│   │   ├── models/        # Pydantic models
│   │   ├── services/      # ML service, business logic
│   │   └── main.py        # FastAPI app entry point
│   ├── tests/              # Backend tests
│   ├── uploads/            # File upload storage
│   └── ml/                 # TensorFlow models
├── frontend/               # React web application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   └── services/      # API integration
│   ├── public/             # Static assets
│   └── tailwind.config.js # Tailwind CSS configuration
├── mobileapp/riceguard/     # Expo mobile app
│   ├── src/
│   │   ├── components/    # React Native components
│   │   ├── screens/       # App screens
│   │   └── navigation/    # App navigation
│   └── assets/             # Mobile assets
└── openspec/               # Specifications (see OpenSpec Integration)
```

### Key Features

- **🤖 AI-Powered Detection**: TensorFlow models classify rice leaf diseases with confidence scores
- **📊 Multi-Platform**: Web, iOS, and Android apps share the same backend
- **🔒 Secure Authentication**: JWT-based auth with proper token management
- **📱 Offline Support**: Mobile app works offline with on-device ML models
- **📈 Treatment Recommendations**: Disease-specific treatment guidance
- **🎨 Modern UI**: Tailwind CSS v3 with rice-themed design system

---

## ⚡ Key Commands

### Backend Development

```bash
# Development server
cd riceguard/backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Database operations
python -m pytest backend/tests/
python seed.py              # Seed database with recommendations

# ML operations
python tools/check_model.py  # Verify ML model status
```

### Frontend Development

```bash
# Development
cd riceguard/frontend
npm start                   # Dev server on :3000

# Build & Test
npm run build               # Production build
npm test                     # Run tests
npm run lint                 # Code linting

# Tailwind CSS development
npm run dev:tailwind         # Watch CSS changes
```

### Mobile Development

```bash
# Start Expo development server
cd riceguard/mobileapp/riceguard
npx expo start

# Build for production
npx expo build

# Run on device/emulator
npx expo run android
npx expo run ios
```

### Testing & Quality

```bash
# Run all tests
python -m pytest backend/tests/ && cd frontend && npm test

# Backend health check
curl http://127.0.0.1:8000/health

# Linting and formatting
cd backend && python -m black app/ && cd ../frontend && npm run lint
```

---

## 📋 OpenSpec Integration

This project uses **OpenSpec** for specification-driven development. When making changes:

### 🔄 Creating New Features
1. **Check existing specs**: `openspec list --specs`
2. **Create change proposal**: `openspec new change-feature-name`
3. **Write specifications**: Detailed requirements with scenarios
4. **Validate**: `openspec validate change-feature-name --strict`
5. **Get approval** before implementation

### 🐛 Direct Fixes (No Proposal Needed)
- Bug fixes restoring intended behavior
- Typos, formatting, documentation
- Non-breaking dependency updates
- Configuration improvements

### 📚 Available Commands
```bash
openspec list                  # List active changes
openspec list --specs          # List specifications
openspec show <spec>           # View specification details
openspec validate <change>     # Validate change proposal
openspec archive <change>      # Mark change as complete
```

### 📖 Key Files
- `openspec/project.md` - Project conventions
- `openspec/AGENTS.md` - Complete workflow guide
- `openspec/specs/` - Current specifications
- `openspec/changes/` - Proposed changes

---

## 🤝 Contributing

We welcome contributions from the community! Here's how to get started:

### 🌟 Development Process

1. **Fork the repository** and create a feature branch
2. **Set up your environment** using the quick start guide
3. **Make your changes** with our coding standards
4. **Add tests** for new functionality
5. **Ensure all tests pass** before submitting

### 📝 Branching Strategy

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test
# ... development work ...

# Push and create PR
git push origin feature/your-feature-name
```

### 🔧 Code Style

- **Python**: Follow PEP 8, use `black` for formatting
- **JavaScript/React**: Use ES6+ features, follow React conventions
- **Git**: Use conventional commits (`feat:`, `fix:`, `docs:`, etc.)

### 📋 Pull Request Requirements

- [ ] **Clear title and description** explaining the change
- [ ] **Tests pass** for all affected functionality
- [ ] **Code follows style guidelines**
- [ ] **Documentation updated** if needed
- [ ] **No secrets or sensitive data** committed

### 👥 Suggested Reviewers

- **Backend changes**: Request review from backend team members
- **Frontend changes**: Request review from frontend developers  
- **ML changes**: Request review from ML specialists
- **Architecture changes**: Request review from tech lead

---

## 🔧 Troubleshooting

### Common Issues

#### ❌ **Uvicorn Import Error**
```bash
# Wrong command (fails):
uvicorn main:app --reload

# Correct command:
uvicorn app.main:app --reload
# Or:
python -m uvicorn app.main:app --reload
```

#### ⚠️ **TensorFlow Loading Issues**
```bash
# Check ML model status
cd backend
python -c "from app.services.ml_service import classifier; print(classifier.get_service_health())"

# Fallback mode will work without TensorFlow
```

#### 🔌 **CORS Errors**
```bash
# Add your origin to ALLOWED_ORIGINS in backend/.env
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://your-ip:3000
```

#### 📱 **Mobile App Connection Issues**
```bash
# Test backend connectivity
curl http://<PC_IP>:8000/health

# Check Expo configuration
echo $EXPO_PUBLIC_API_BASE_URL  # Should show your backend URL
echo $REACT_NATIVE_PACKAGER_HOSTNAME  # Should show your PC IP
```

### 🐞 Development Environment Issues

#### **Python Version**
- **Required**: Python 3.11+
- **Check**: `python --version`
- **Install**: Use pyenv, conda, or official Python installer

#### **Node.js Version**  
- **Required**: Node.js 16+ for Expo
- **Check**: `node --version`
- **Install**: Use nvm or official Node.js installer

#### **MongoDB Connection**
```bash
# Test connection
cd backend
python -c "from app.core.database import get_db; print('MongoDB connected')"
```

### 📞 Getting Help

- **Check existing issues**: Look at GitHub Issues and Discussions
- **Team Communication**: Contact team members through project channels
- **Documentation**: Check `CLAUDE.md` and `openspec/AGENTS.md` for detailed guides

### 🔍 Debug Mode

Enable debug logging by setting environment variable:
```bash
export LOG_LEVEL=DEBUG
python dev_runner.py
```

---

## 📜 License

This project is licensed under the **Educational Use License** for academic capstone projects (CPE025/CPE026).

### 🎓 Academic Use

- ✅ **Educational institutions** may use for teaching and research
- ✅ **Students** may use for learning and assignments  
- ✅ **Modifications allowed** for educational purposes
- ❌ **Commercial use** without explicit permission
- ❌ **Redistribution** of proprietary components

### 🏫 Acknowledgements

**Team 27** - Computer Engineering Capstone Project
- **Mark Angelo Aquino** - Team Lead & Backend Development
- **Faron Jabez Nonan** - Frontend Development
- **Froilan Gayao** - Backend Development & Integration
- **Eugene Dela Cruz** - Machine Learning & Model Development

**Advisors**
- **Engr. Neal Barton James Matira**
- **Engr. Robin Valenzuela**

**University**: College of Engineering Education, 2nd Floor, A. Luna Building

---

<div align="center">

**🌾 Empowering farmers with AI-powered rice disease detection**

[![Built with ❤️ for Rice Farmers](https://img.shields.io/badge/built%20with%20❤️%20for%20Rice%20Farmers-orange.svg)]

</div>