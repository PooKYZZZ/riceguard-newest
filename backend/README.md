# RiceGuard Backend

FastAPI-based backend for RiceGuard rice leaf disease detection system with ML integration and MongoDB persistence.

## Features

- **RESTful API**: Built with FastAPI for high performance
- **Authentication**: JWT-based user authentication
- **ML Integration**: TensorFlow model for disease classification
- **Database**: MongoDB for scalable data storage
- **File Upload**: Secure image upload and processing
- **CORS Support**: Configured for web and mobile clients
- **Docker Support**: Containerized deployment
- **Environment Management**: Production-ready configuration

## Quick Start

### Option 1: Development Setup (Recommended)

```bash
# Clone and navigate to backend
cd riceguard/backend

# Set up environment (installs dependencies, creates .env)
make install

# Start development server
make dev

# Or manually:
python scripts/setup_environment.py development
python dev_runner.py
```

### Option 2: Docker Setup

```bash
# Start all services (MongoDB, Redis, Backend)
make docker-run

# View logs
make docker-logs

# Stop services
make docker-stop
```

### Option 3: Manual Setup

```bash
# 1. Setup Virtual Environment
python -m venv .venv
# Windows
. .\.venv\Scripts\Activate.ps1
# macOS/Linux
source .venv/bin/activate

# 2. Install Dependencies
pip install -r requirements.txt

# 3. Configure Environment
python scripts/setup_environment.py development

# 4. Run Development Server
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

## Configuration

### Environment Files

The application uses different configuration files for different environments:

- `.env.example` - Template with documentation
- `.env` - Active configuration (created from template)
- `.env.production` - Production settings
- `.env.testing` - Testing settings

### Key Environment Variables

```bash
# Database
MONGO_URI=mongodb://localhost:27017
DB_NAME=riceguard_db

# Security
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
TOKEN_EXPIRE_HOURS=6

# File Upload
UPLOAD_DIR=uploads
MAX_UPLOAD_MB=8

# ML Model
MODEL_PATH=ml/model.h5
CONFIDENCE_THRESHOLD=0.50

# Environment
ENVIRONMENT=development
LOG_LEVEL=INFO
DEBUG=true
```

## Available Commands

### Development

```bash
make install      # Set up development environment
make dev          # Start development server
make test         # Run tests
make lint         # Run code linting
make format       # Format code
make clean        # Clean temporary files
```

### Docker

```bash
make docker-build # Build Docker image
make docker-run   # Run with Docker Compose
make docker-stop  # Stop Docker services
make docker-logs  # View Docker logs
```

### Production

```bash
make deploy       # Deploy to production
make prod         # Start production server
make db-backup    # Create database backup
make db-restore   # Restore from backup
```

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/           # API endpoints
│   ├── core/
│   │   ├── config.py     # Configuration management
│   │   ├── database.py   # Database connection
│   │   └── security.py   # Authentication logic
│   ├── models.py         # Pydantic models
│   ├── main.py           # FastAPI application
│   └── ml_service.py     # ML model integration
├── scripts/              # Utility scripts
├── uploads/              # File upload directory
├── ml/                   # ML model files
├── tests/                # Test files
├── requirements.txt      # Python dependencies
├── .env.example         # Environment template
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Docker Compose setup
└── Makefile             # Convenient commands
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
# Run all tests
make test

# Run with coverage
make test-cov

# Run specific test file
pytest tests/test_auth.py -v

# Run with specific environment
ENVIRONMENT=testing pytest -v
```

## Database

### MongoDB Setup

**Local Development:**
```bash
# With Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# Or use provided docker-compose
make docker-run  # Starts MongoDB with backend
```

**Production (MongoDB Atlas):**
1. Create a free MongoDB Atlas account
2. Create a cluster
3. Get connection string and update `.env`

### Collections

- `users` - User accounts and authentication
- `scans` - Image scan results and metadata
- `recommendations` - Disease treatment recommendations

## Security

### Authentication

- JWT-based authentication
- Password hashing with bcrypt
- Token expiration management

### Security Best Practices

1. **Environment Variables**: Never commit secrets to git
2. **JWT Secret**: Use strong, random secret in production
3. **Input Validation**: All inputs validated with Pydantic
4. **CORS**: Configure allowed origins properly
5. **File Upload**: Validate file types and sizes

## Deployment

### Production Deployment

1. **Server Setup**:
   ```bash
   # On production server
   git clone <repository>
   cd riceguard/backend
   make deploy-setup
   ```

2. **Environment Configuration**:
   ```bash
   # Update .env with production values
   vim .env
   ```

3. **Start Services**:
   ```bash
   # With Docker (recommended)
   make deploy

   # Or directly
   make prod
   ```

### Environment Variables

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `ENVIRONMENT` | `development` | `production` | Application environment |
| `DEBUG` | `true` | `false` | Debug mode |
| `LOG_LEVEL` | `INFO` | `WARNING` | Logging level |
| `RELOAD` | `true` | `false` | Auto-reload on code changes |

## Development

```bash
# Install development dependencies
make install

# Format code
make format

# Run linting
make lint

# Run all checks
make check
```

## Monitoring

### Health Checks

The application provides health check endpoints:
- `/health` - Basic health status
- `/api/v1/health` - Detailed health information

### Logging

Logs are configured based on environment:
- **Development**: Verbose logging with DEBUG level
- **Production**: Structured logging with WARNING level

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `make test`
5. Run linting: `make lint`
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the API documentation at `/docs`
- Review the configuration options in `.env.example`