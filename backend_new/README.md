# RiceGuard Backend API

A modern FastAPI backend for rice leaf disease detection with MongoDB integration and TensorFlow ML capabilities.

## Features

- **Authentication**: JWT-based user authentication and authorization
- **Image Processing**: Upload and analyze rice leaf images for disease detection
- **ML Integration**: TensorFlow model for automated disease classification
- **Database**: MongoDB Atlas for scalable data storage
- **API Documentation**: Auto-generated OpenAPI/Swagger documentation

## Quick Start

### 1. Setup Virtual Environment

```bash
python -m venv .venv
# Windows
. .\.venv\Scripts\Activate.ps1
# macOS/Linux
source .venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Copy `.env.example` to `.env` and configure:

```env
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/riceguard_db
DB_NAME=riceguard_db
JWT_SECRET=your-super-secret-key
UPLOAD_DIR=uploads
MAX_UPLOAD_MB=8
MODEL_PATH=../ml/model.h5
```

### 4. Run Development Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Access API

- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user info

### Scans
- `POST /api/v1/scans/` - Upload and analyze image
- `GET /api/v1/scans/` - Get user's scan history
- `GET /api/v1/scans/{scan_id}` - Get specific scan
- `DELETE /api/v1/scans/{scan_id}` - Delete scan

### Recommendations
- `GET /api/v1/recommendations/{disease_key}` - Get treatment recommendations
- `GET /api/v1/recommendations/` - Get all recommendations

## Project Structure

```
backend_new/
├── app/
│   ├── api/
│   │   ├── deps.py          # FastAPI dependencies
│   │   └── v1/
│   │       ├── auth.py      # Authentication endpoints
│   │       ├── scans.py     # Image upload/analysis
│   │       └── recommendations.py  # Treatment recommendations
│   ├── core/
│   │   ├── config.py        # Settings configuration
│   │   ├── database.py      # MongoDB connection
│   │   ├── security.py      # JWT and password hashing
│   │   └── seed.py          # Database seeding
│   ├── models/
│   │   ├── user.py          # User models
│   │   └── scan.py          # Scan models
│   ├── services/
│   │   └── ml_service.py    # TensorFlow ML service
│   └── main.py              # FastAPI application
├── uploads/                 # Uploaded images
├── requirements.txt         # Python dependencies
├── .env                    # Environment variables
└── README.md               # This file
```

## ML Model

Place your trained TensorFlow model at `../ml/model.h5` relative to this backend directory. The model should be trained to classify rice leaf diseases:

- bacterial_blight
- brown_spot
- healthy
- leaf_blast
- tungro

## Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

## Development

```bash
# Install development dependencies
pip install black isort mypy

# Format code
black app/
isort app/

# Type checking
mypy app/
```