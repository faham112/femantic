from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, timezone
from pydantic import BaseModel
from jose import JWTError

from app.database import get_db
from app.models import User, UserRole, MembershipStatus, InviteToken, ClientWebsiteAccess
from app.schemas import UserCreate, UserOut, Token
from app.auth import (
    get_password_hash, verify_password, create_access_token, create_refresh_token,
    decode_token, get_user_by_email, normalize_email,
    ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class RefreshIn(BaseModel):
    refresh_token: str


def _issue_tokens(user: User) -> dict:
    payload = {"sub": user.email, "role": user.role.value}
    return {
        "access_token": create_access_token(payload, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)),
        "refresh_token": create_refresh_token(payload),
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    normalized_email = normalize_email(user_in.email)
    existing = get_user_by_email(db, normalized_email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if user_in.invite_token:
        token = db.query(InviteToken).filter(InviteToken.token == user_in.invite_token).first()
        if not token or not token.is_active:
            raise HTTPException(status_code=400, detail="Invalid or inactive invite token")
        if token.expires_at and token.expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Invite token has expired")
        if token.used_count >= token.max_uses:
            raise HTTPException(status_code=400, detail="Invite token has reached maximum uses")

        user = User(
            email=normalized_email,
            hashed_password=get_password_hash(user_in.password),
            full_name=user_in.full_name,
            role=UserRole.CLIENT,
            membership=MembershipStatus.FREE,
            parent_id=token.created_by,
            is_active=True,
        )
        db.add(user)
        db.flush()
        for wid in (token.allowed_website_ids or []):
            db.add(ClientWebsiteAccess(
                user_id=user.id,
                website_id=wid,
                allowed_metrics=token.allowed_metrics or ["visitors", "pageviews", "utm"],
            ))
        token.used_count += 1
        db.commit()
        db.refresh(user)
        return user

    is_first = db.query(User).count() == 0
    role = UserRole.ADMIN if is_first else UserRole.PRO
    user = User(
        email=normalized_email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=role,
        membership=MembershipStatus.FREE,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    normalized_email = normalize_email(form_data.username)
    user = get_user_by_email(db, normalized_email)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return _issue_tokens(user)


@router.post("/refresh")
def refresh(body: RefreshIn, db: Session = Depends(get_db)):
    try:
        payload = decode_token(body.refresh_token, "refresh")
        email = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = get_user_by_email(db, email)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    return _issue_tokens(user)


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
