from datetime import datetime, timedelta, timezone
from typing import Optional, List
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import os

from app.database import get_db
from app.models import User, UserRole, ClientWebsiteAccess
from app.schemas import TokenData

SECRET_KEY = os.getenv("JWT_SECRET", "change-this-to-a-very-long-random-secret-key")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


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
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
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
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user


async def get_current_pro_or_admin(current_user: User = Depends(get_current_user)) -> User:
    """Only Admin or Pro users can manage websites / create invite tokens."""
    if current_user.role not in (UserRole.ADMIN, UserRole.PRO):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Pro or Admin privileges required"
        )
    return current_user


def get_allowed_website_ids(db: Session, user: User) -> Optional[List[int]]:
    """
    Returns list of website IDs the user is allowed to access.
    - Admin / Pro: None means "all their own websites"
    - Client: explicit list from ClientWebsiteAccess
    """
    if user.role == UserRole.CLIENT:
        rows = db.query(ClientWebsiteAccess.website_id).filter(
            ClientWebsiteAccess.user_id == user.id
        ).all()
        return [r[0] for r in rows]
    return None  # Owner sees their own


def user_can_access_website(db: Session, user: User, website_id: int) -> bool:
    if user.role == UserRole.ADMIN:
        return True
    if user.role == UserRole.PRO:
        from app.models import Website
        return db.query(Website).filter(
            Website.id == website_id,
            Website.owner_id == user.id
        ).first() is not None
    if user.role == UserRole.CLIENT:
        return db.query(ClientWebsiteAccess).filter(
            ClientWebsiteAccess.user_id == user.id,
            ClientWebsiteAccess.website_id == website_id
        ).first() is not None
    return False
