from datetime import datetime, timedelta, timezone
from typing import Optional, List
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import func
from sqlalchemy.orm import Session
import os

from app.database import get_db
from app.models import User, UserRole, ClientWebsiteAccess
from app.schemas import TokenData

SECRET_KEY = os.getenv("JWT_SECRET", "change-this-to-a-very-long-random-secret-key")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def normalize_email(email: Optional[str]) -> str:
    return (email or "").strip().lower()


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def _encode(data: dict, expires: datetime) -> str:
    payload = data.copy()
    payload["exp"] = expires
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return _encode({**data, "typ": "access"}, expire)


def create_refresh_token(data: dict) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    return _encode({**data, "typ": "refresh"}, expire)


def decode_token(token: str, expected_typ: str = "access") -> dict:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    if payload.get("typ") not in (expected_typ, None) and expected_typ == "refresh":
        if payload.get("typ") != "refresh":
            raise JWTError("wrong token type")
    if expected_typ == "refresh" and payload.get("typ") != "refresh":
        raise JWTError("not a refresh token")
    if expected_typ == "access" and payload.get("typ") not in ("access", None):
        raise JWTError("not an access token")
    return payload


def get_user_by_email(db: Session, email: Optional[str]) -> Optional[User]:
    normalized = normalize_email(email)
    if not normalized:
        return None
    return db.query(User).filter(func.lower(User.email) == normalized).first()


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token, "access")
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email, role=payload.get("role"))
    except JWTError:
        raise credentials_exception

    user = get_user_by_email(db, email=token_data.email)
    if user is None or not user.is_active:
        raise credentials_exception
    return user


async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return current_user


async def get_current_pro_or_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in (UserRole.ADMIN, UserRole.PRO):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pro or Admin privileges required")
    return current_user


def get_allowed_website_ids(db: Session, user: User) -> Optional[List[int]]:
    if user.role == UserRole.CLIENT:
        rows = db.query(ClientWebsiteAccess.website_id).filter(
            ClientWebsiteAccess.user_id == user.id
        ).all()
        return [r[0] for r in rows]
    return None


def user_can_access_website(db: Session, user: User, website_id: int) -> bool:
    if user.role == UserRole.ADMIN:
        return True
    if user.role == UserRole.PRO:
        from app.models import Website
        return db.query(Website).filter(
            Website.id == website_id, Website.owner_id == user.id
        ).first() is not None
    if user.role == UserRole.CLIENT:
        return db.query(ClientWebsiteAccess).filter(
            ClientWebsiteAccess.user_id == user.id,
            ClientWebsiteAccess.website_id == website_id,
        ).first() is not None
    return False
