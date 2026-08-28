from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"


class MembershipStatus(str, Enum):
    FREE = "free"
    PREMIUM = "premium"
    EXPIRED = "expired"


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


class WebsiteCreate(BaseModel):
    name: str
    domain: str


class WebsiteOut(BaseModel):
    id: int
    name: str
    domain: str
    api_key: str
    public_key: Optional[str] = None
    is_active: bool
    created_at: datetime
    owner_id: int

    class Config:
        from_attributes = True


class TrackEvent(BaseModel):
    path: str
    title: Optional[str] = None
    referrer: Optional[str] = None
    user_agent: Optional[str] = None
    session_id: Optional[str] = None
    visitor_id: Optional[str] = None
    language: Optional[str] = None
    screen_width: Optional[int] = None
    screen_height: Optional[int] = None
    device: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    event_type: Optional[str] = "pageview"
    event_name: Optional[str] = None
    event_data: Optional[Dict[str, Any]] = None
    timestamp: Optional[str] = None


class PageViewOut(BaseModel):
    id: int
    path: str
    referrer: Optional[str]
    country: Optional[str]
    device: Optional[str]
    browser: Optional[str]
    is_bot: bool
    traffic_score: Optional[float] = None
    traffic_label: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class StatsOverview(BaseModel):
    total_pageviews: int
    unique_sessions: int
    true_traffic: int
    bounce_rate: float
    top_pages: List[dict]
    top_referrers: List[dict]
    devices: dict
    countries: List[dict]
    humans: Optional[int] = None
    bots: Optional[int] = None
    suspicious: Optional[int] = None


class RealtimeStats(BaseModel):
    live_visitors: int
    pageviews_last_5min: int
    top_pages_live: List[dict]
    recent_visitors: List[dict]


class MembershipOut(BaseModel):
    id: int
    user_id: int
    plan: str
    status: MembershipStatus
    started_at: datetime
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MembershipUpdate(BaseModel):
    plan: Optional[str] = None
    status: Optional[MembershipStatus] = None
    expires_at: Optional[datetime] = None
