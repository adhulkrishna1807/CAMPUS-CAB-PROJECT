import hashlib
import hmac
import base64
import json
import time
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.config import settings
from app.database import get_db
from app.models import User

security = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    salt = "campuscab_salt_2026"
    pwd_bytes = (password + salt).encode("utf-8")
    return hashlib.sha256(pwd_bytes).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hmac.compare_digest(hash_password(plain_password), hashed_password)

def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = int(time.time()) + (settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    json_bytes = json.dumps(payload).encode("utf-8")
    encoded_payload = base64.urlsafe_b64encode(json_bytes).decode("utf-8").rstrip("=")
    
    signature = hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        encoded_payload.encode("utf-8"),
        hashlib.sha256
    ).digest()
    encoded_sig = base64.urlsafe_b64encode(signature).decode("utf-8").rstrip("=")
    return f"{encoded_payload}.{encoded_sig}"

def decode_token(token: str) -> Optional[dict]:
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        encoded_payload, encoded_sig = parts
        
        expected_sig = hmac.new(
            settings.SECRET_KEY.encode("utf-8"),
            encoded_payload.encode("utf-8"),
            hashlib.sha256
        ).digest()
        actual_sig = base64.urlsafe_b64decode(encoded_sig + "=" * (-len(encoded_sig) % 4))
        
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
        
        payload_bytes = base64.urlsafe_b64decode(encoded_payload + "=" * (-len(encoded_payload) % 4))
        payload = json.loads(payload_bytes.decode("utf-8"))
        
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required"
        )
    payload = decode_token(credentials.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token"
        )
    user_id = payload["sub"]
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    return user

def require_role(allowed_roles: List[str]):
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Unauthorized access. Required role: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker
