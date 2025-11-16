# ============================================================================
# RiceGuard Backend Makefile
# Provides convenient commands for development, testing, and deployment
# ============================================================================

.PHONY: help install dev test clean docker-build docker-run deploy

# Default target
help:
	@echo "RiceGuard Backend - Available Commands:"
	@echo ""
	@echo "Development:"
	@echo "  install       Install dependencies and set up environment"
	@echo "  dev           Start development server"
	@echo "  test          Run tests"
	@echo "  lint          Run code linting"
	@echo "  format        Format code"
	@echo ""
	@echo "Docker:"
	@echo "  docker-build  Build Docker image"
	@echo "  docker-run    Run with Docker Compose"
	@echo "  docker-stop   Stop Docker containers"
	@echo ""
	@echo "Production:"
	@echo "  deploy        Deploy to production"
	@echo "  clean         Clean temporary files"

# Install dependencies and set up environment
install:
	@echo "🔧 Setting up development environment..."
	python scripts/setup_environment.py development

# Start development server
dev:
	@echo "🚀 Starting development server..."
	python dev_runner.py

# Start production server
prod:
	@echo "🚀 Starting production server..."
	ENVIRONMENT=production python scripts/run_server.py

# Run tests
test:
	@echo "🧪 Running tests..."
	ENVIRONMENT=testing pytest -v --cov=app --cov-report=html

# Run tests with coverage
test-cov:
	@echo "🧪 Running tests with coverage..."
	ENVIRONMENT=testing pytest -v --cov=app --cov-report=term-missing

# Run linting
lint:
	@echo "🔍 Running code linting..."
	flake8 app/ scripts/
	mypy app/

# Format code
format:
	@echo "✨ Formatting code..."
	black app/ scripts/
	isort app/ scripts/

# Check code quality
check: lint test
	@echo "✅ All checks passed!"

# Clean temporary files
clean:
	@echo "🧹 Cleaning temporary files..."
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf build/
	rm -rf dist/
	rm -rf .coverage
	rm -rf htmlcov/
	rm -rf .pytest_cache/
	rm -rf .mypy_cache/

# Docker commands
docker-build:
	@echo "🐳 Building Docker image..."
	docker build -t riceguard-backend .

docker-run:
	@echo "🐳 Starting services with Docker Compose..."
	docker-compose up -d

docker-stop:
	@echo "🐳 Stopping Docker services..."
	docker-compose down

docker-logs:
	@echo "🐳 Showing Docker logs..."
	docker-compose logs -f

# Deployment setup
deploy-setup:
	@echo "🚀 Setting up production environment..."
	python scripts/setup_environment.py production --skip-venv

# Full deployment (for production servers)
deploy: deploy-setup
	@echo "🚀 Deploying to production..."
	docker-compose -f docker-compose.prod.yml up -d --build

# Database operations
db-backup:
	@echo "💾 Creating database backup..."
	mongodump --uri="$(MONGO_URI)" --out=backups/$(shell date +%Y%m%d_%H%M%S)

db-restore:
	@echo "📥 Restoring database from backup..."
	@read -p "Enter backup directory: " backup_dir; \
	mongorestore --uri="$(MONGO_URI)" $$backup_dir

# Security audit
security-audit:
	@echo "🔒 Running security audit..."
	safety check
	bandit -r app/

# Generate API documentation
docs:
	@echo "📚 Generating API documentation..."
	@mkdir -p docs
	@echo "API Documentation: http://localhost:8000/docs" > docs/api_info.txt
	@echo "ReDoc: http://localhost:8000/redoc" >> docs/api_info.txt

# Show environment info
info:
	@echo "📋 Environment Information:"
	@echo "  Python: $(shell python --version)"
	@echo "  Pip: $(shell pip --version)"
	@echo "  Environment: $$ENVIRONMENT"
	@echo "  Working Directory: $(shell pwd)"
	@if [ -f ".env" ]; then echo "  .env file: ✅"; else echo "  .env file: ❌"; fi

# Quick start (install + dev)
quick-start: install dev

# Development setup with all tools
setup-dev: install
	@echo "🔧 Setting up development tools..."
	pre-commit install
	@echo "✅ Development environment ready!"

# CI/CD pipeline
ci: lint test-cov security-audit
	@echo "✅ CI pipeline completed successfully!"