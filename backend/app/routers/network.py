from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import User, Website, PageView, UserRole, ClientWebsiteAccess
from app.auth import get_current_user

router = APIRouter(prefix="/api/track", tags=["Network"])


def _site_ids(db: Session, user: User):
    if user.role == UserRole.ADMIN:
        return [w.id for w in db.query(Website.id).all()]
    if user.role == UserRole.CLIENT:
        rows = db.query(ClientWebsiteAccess.website_id).filter(ClientWebsiteAccess.user_id == user.id).all()
        return [r[0] for r in rows]
    return [w.id for w in db.query(Website.id).filter(Website.owner_id == user.id).all()]


@router.get("/network")
def network_overview(
    days: int = 14,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    days = max(1, min(days, 90))
    since = datetime.utcnow() - timedelta(days=days)
    ids = _site_ids(db, current_user)
    if not ids:
        return {"sites": [], "totals": {"pageviews": 0, "users": 0, "sites": 0}}

    sites = db.query(Website).filter(Website.id.in_(ids)).all()
    rows = []
    total_pv = 0
    total_users = 0
    for w in sites:
        pv = db.query(func.count(PageView.id)).filter(
            PageView.website_id == w.id, PageView.created_at >= since, PageView.traffic_label == "human"
        ).scalar() or 0
        users = db.query(func.count(func.distinct(PageView.visitor_id))).filter(
            PageView.website_id == w.id, PageView.created_at >= since, PageView.traffic_label == "human"
        ).scalar() or 0
        total_pv += pv
        total_users += users
        rows.append({
            "id": w.id,
            "name": w.name,
            "domain": w.domain,
            "is_active": w.is_active,
            "pageviews": pv,
            "users": users,
        })
    rows.sort(key=lambda r: r["pageviews"], reverse=True)
    return {
        "days": days,
        "totals": {"pageviews": total_pv, "users": total_users, "sites": len(rows)},
        "sites": rows,
    }
