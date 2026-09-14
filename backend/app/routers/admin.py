from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, Website, PageView, MembershipStatus
from app.auth import get_current_admin
from app.schemas import UserOut, WebsiteOut

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/overview")
def admin_overview(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    total_users = db.query(User).count()
    total_websites = db.query(Website).count()
    total_pageviews = db.query(PageView).count()
    true_traffic = db.query(PageView).filter(PageView.is_bot == False).count()
    premium_users = db.query(User).filter(User.membership == MembershipStatus.PREMIUM).count()
    admins = db.query(User).filter(User.role == "admin").count()
    return {
        "total_users": total_users,
        "total_websites": total_websites,
        "total_pageviews": total_pageviews,
        "true_traffic": true_traffic,
        "premium_users": premium_users,
        "admins": admins,
        "bot_ratio": round((total_pageviews - true_traffic) / total_pageviews * 100, 1) if total_pageviews else 0,
    }


@router.get("/users", response_model=List[UserOut])
def admin_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return db.query(User).order_by(User.id.desc()).limit(200).all()


@router.get("/websites", response_model=List[WebsiteOut])
def admin_websites(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return db.query(Website).order_by(Website.id.desc()).limit(300).all()
