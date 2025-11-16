# backend/security.py
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
from jose import jwt, JWTError
from passlib.context import CryptContext
from settings import JWT_SECRET, JWT_ALGORITHM, TOKEN_EXPIRE_HOURS

# Use bcrypt_sha256 to avoid 72-byte password issues
pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")

# -------------------- PASSWORD UTILS --------------------
def hash_password(password: str) -> str:
    """Hash a plaintext password securely."""
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against its hash."""
    return pwd_context.verify(plain, hashed)

# -------------------- TOKEN UTILS --------------------
def create_access_token(
    subject: str,
    extra_claims: Optional[Dict[str, Any]] = None,
) -> Tuple[str, datetime]:
    """
    Create a JWT access token.
    - subject: user ID (stored as 'sub')
    - extra_claims: optional dict with email, name, etc.
    Returns: (token, expires_at)
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(hours=TOKEN_EXPIRE_HOURS)
    to_encode = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    if extra_claims:
        to_encode.update(extra_claims)

    token = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token, expire


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}")