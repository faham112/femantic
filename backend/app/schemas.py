from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"


class MembershipStatus(str, Enum):
    FREE = "free"
    PREMIUM = "premium"
    EXPIRED = "expired"


# ---------- Auth ----------
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


# ---------- User ----------
class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str]
    role: UserRole
    membership: MembershipStatus
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    membership: Optional[MembershipStatus] = None
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None


# ---------- Website ----------
class WebsiteCreate(BaseModel):
    name: str
    domain: str


class WebsiteOut(BaseModel):
    id: int
    name: str
    domain: str
    api_key: str
    is_active: bool
    created_at: datetime
    owner_id: int

    class Config:
        from_attributes = True


# ---------- Tracking ----------
class TrackEvent(BaseModel):
    path: str
    referrer: Optional[str] = None
    user_agent: Optional[str] = None
    session_id: Optional[str] = None


class PageViewOut(BaseModel):
    id: int
    path: str
    referrer: Optional[str]
    country: Optional[str]
    device: Optional[str]
    browser: Optional[str]
    is_bot: bool
    created_at: datetime

    class Config:
        from_attributes = True


class StatsOverview(BaseModel):
    total_pageviews: int
    unique_sessions: int
    true_traffic: int          # non-bot
    bounce_rate: float
    top_pages: List[dict]
    top_referrers: List[dict]
    devices: dict
    countries: List[dict]
