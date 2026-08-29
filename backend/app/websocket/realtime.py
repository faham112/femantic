"""
Simple real-time support using Redis pub/sub + Server-Sent Events style.
For full WebSocket later, this provides the foundation.
"""
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from sqlalchemy import func
import asyncio
import json

from app.database import get_db
from app.models import PageView, Website
from app.auth import get_current_user, user_can_access_website
from app.models import User

router = APIRouter(prefix="/api/realtime", tags=["Realtime"])


@router.get("/live/{website_id}")
async def live_stats(
    website_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return current live snapshot (poll every 5-10s from frontend)"""
    if not user_can_access_website(db, current_user, website_id):
        return {"error": "Website not found"}
    website = db.query(Website).filter(Website.id == website_id).first()
    if not website:
        return {"error": "Website not found"}

    since = datetime.utcnow() - timedelta(minutes=5)

    live_visitors = db.query(func.count(func.distinct(PageView.visitor_id))).filter(
        PageView.website_id == website_id,
        PageView.created_at >= since,
        PageView.traffic_label == "human"
    ).scalar() or 0

    pageviews_last_5min = db.query(PageView).filter(
        PageView.website_id == website_id,
        PageView.created_at >= since,
        PageView.traffic_label == "human"
    ).count()

    top_pages = (
        db.query(PageView.path, func.count(PageView.id).label("views"))
        .filter(
            PageView.website_id == website_id,
            PageView.created_at >= since,
            PageView.traffic_label == "human"
        )
        .group_by(PageView.path)
        .order_by(func.count(PageView.id).desc())
        .limit(5)
        .all()
    )

    recent = (
        db.query(PageView)
        .filter(
            PageView.website_id == website_id,
            PageView.created_at >= since,
            PageView.traffic_label == "human"
        )
        .order_by(PageView.created_at.desc())
        .limit(10)
        .all()
    )

    return {
        "live_visitors": live_visitors,
        "pageviews_last_5min": pageviews_last_5min,
        "top_pages_live": [{"path": p, "views": v} for p, v in top_pages],
        "recent_visitors": [
            {
                "path": r.path,
                "device": r.device,
                "country": r.country,
                "created_at": r.created_at.isoformat() if r.created_at else None
            }
            for r in recent
        ],
        "timestamp": datetime.utcnow().isoformat()
    }
