#!/usr/bin/env python3
"""
RiceGuard Environment Setup Script

This script helps set up the environment for different deployment scenarios:
- development
- testing
- production

Usage:
    python scripts/setup_environment.py [environment]

Examples:
    python scripts/setup_environment.py development
    python scripts/setup_environment.py testing
    python scripts/setup_environment.py production
"""

import os
import sys
import secrets
import shutil
import argparse
from pathlib import Path

def generate_jwt_secret():
    """Generate a secure JWT secret."""
    return secrets.token_urlsafe(32)

def create_env_file(env_name: str, backend_dir: Path):
    """Create .env file for specified environment."""
    env_file = backend_dir / ".env"

    # Choose template based on environment
    if env_name == "production":
        template_file = backend_dir / ".env.production"
    elif env_name == "testing":
        template_file = backend_dir / ".env.testing"
    else:
        template_file = backend_dir / ".env.example"

    if not template_file.exists():
        print(f"❌ Template file not found: {template_file}")
        return False

    # Read template
    with open(template_file, 'r') as f:
        content = f.read()

    # Generate secure secret for production
    if env_name == "production":
        jwt_secret = generate_jwt_secret()
        content = content.replace("GENERATE_STRONG_SECRET_KEY_HERE", jwt_secret)

    # Write .env file
    with open(env_file, 'w') as f:
        f.write(content)

    print(f"✅ Created {env_file} from {template_file.name}")

    if env_name == "production":
        print(f"🔐 Generated secure JWT secret for production")

    return True

def create_requirements_files(backend_dir: Path):
    """Create separate requirements files for different environments."""
    base_requirements = backend_dir / "requirements.txt"

    # Read base requirements
    with open(base_requirements, 'r') as f:
        base_content = f.read()

    # Production requirements (exclude dev tools)
    prod_lines = []
    skip_sections = ["Development and testing dependencies", "# Development and testing dependencies"]
    in_skip_section = False

    for line in base_content.split('\n'):
        if any(skip in line for skip in skip_sections):
            in_skip_section = True
            continue
        if in_skip_section and line.startswith('#') and "Development" not in line:
            in_skip_section = False

        if not in_skip_section and line.strip():
            prod_lines.append(line)

    prod_content = '\n'.join(prod_lines)

    # Write production requirements
    prod_file = backend_dir / "requirements-prod.txt"
    with open(prod_file, 'w') as f:
        f.write(prod_content)

    print(f"✅ Created {prod_file} (production requirements)")

def setup_python_environment(backend_dir: Path, env_name: str):
    """Set up Python virtual environment."""
    venv_dir = backend_dir / ".venv"

    if not venv_dir.exists():
        print(f"🔧 Creating virtual environment...")
        result = os.system(f'cd "{backend_dir}" && python -m venv .venv')
        if result != 0:
            print("❌ Failed to create virtual environment")
            return False
        print("✅ Virtual environment created")
    else:
        print("✅ Virtual environment already exists")

    # Determine requirements file
    if env_name == "production":
        req_file = backend_dir / "requirements-prod.txt"
    else:
        req_file = backend_dir / "requirements.txt"

    if not req_file.exists():
        print(f"❌ Requirements file not found: {req_file}")
        return False

    # Install requirements
    if os.name == "nt":  # Windows
        pip_path = venv_dir / "Scripts" / "pip.exe"
    else:  # Unix
        pip_path = venv_dir / "bin" / "pip"

    print(f"📦 Installing requirements from {req_file.name}...")
    result = os.system(f'"{pip_path}" install -r "{req_file}"')
    if result != 0:
        print("❌ Failed to install requirements")
        return False

    print("✅ Requirements installed successfully")
    return True

def validate_environment(backend_dir: Path, env_name: str):
    """Validate that the environment is properly set up."""
    print(f"\n🔍 Validating {env_name} environment...")

    env_file = backend_dir / ".env"
    if not env_file.exists():
        print("❌ .env file not found")
        return False

    venv_dir = backend_dir / ".venv"
    if not venv_dir.exists():
        print("❌ Virtual environment not found")
        return False

    # Check for required directories
    upload_dir = backend_dir / "uploads"
    upload_dir.mkdir(exist_ok=True)

    ml_dir = backend_dir / "ml"
    ml_dir.mkdir(exist_ok=True)

    print("✅ Environment validation passed")
    return True

def main():
    parser = argparse.ArgumentParser(description="Set up RiceGuard environment")
    parser.add_argument(
        "environment",
        choices=["development", "testing", "production"],
        default="development",
        nargs="?",
        help="Environment to set up (default: development)"
    )
    parser.add_argument(
        "--skip-venv",
        action="store_true",
        help="Skip virtual environment creation"
    )

    args = parser.parse_args()

    env_name = args.environment
    backend_dir = Path(__file__).parent.parent

    print(f"🚀 Setting up RiceGuard {env_name} environment...")
    print(f"📁 Backend directory: {backend_dir}")

    # Create .env file
    if not create_env_file(env_name, backend_dir):
        sys.exit(1)

    # Create requirements files
    create_requirements_files(backend_dir)

    # Set up Python environment
    if not args.skip_venv:
        if not setup_python_environment(backend_dir, env_name):
            sys.exit(1)

    # Validate environment
    if not validate_environment(backend_dir, env_name):
        sys.exit(1)

    print(f"\n✨ {env_name.title()} environment setup complete!")

    # Provide next steps
    print("\n📋 Next steps:")
    if env_name == "development":
        print("   1. Update .env with your MongoDB URI if needed")
        print("   2. Run: python dev_runner.py")
    elif env_name == "testing":
        print("   1. Run: pytest")
    elif env_name == "production":
        print("   1. Update .env with your production settings")
        print("   2. Ensure MongoDB Atlas is configured")
        print("   3. Deploy to your production server")
        print("   4. Run: ENVIRONMENT=production python -m uvicorn app.main:app --host 0.0.0.0 --port 8000")

if __name__ == "__main__":
    main()