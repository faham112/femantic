from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from sqlalchemy import func

from app.database import get_db
from app.models import PageView, Website, User
from app.auth import get_current_user, user_can_access_website

router = APIRouter(prefix="/api/realtime", tags=["Realtime"])


def _bucket_device(raw: str | None) -> str:
    s = (raw or "").lower()
    if "tab" in s:
        return "tablet"
    if "mob" in s or "phone" in s or "android" in s or "ios" in s:
        return "mobile"
    if "desk" in s or "win" in s or "mac" in s or "linux" in s:
        return "desktop"
    return "desktop" if s else "desktop"


@router.get("/live/{website_id}")
async def live_stats(
    website_id: int,
    minutes: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not user_can_access_website(db, current_user, website_id):
        raise HTTPException(status_code=404, detail="Website not found")
    website = db.query(Website).filter(Website.id == website_id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")

    minutes = 5 if minutes not in (5, 30) else minutes
    now = datetime.utcnow()
    since = now - timedelta(minutes=minutes)
    since30 = now - timedelta(minutes=30)

    live_visitors = db.query(func.count(func.distinct(PageView.visitor_id))).filter(
        PageView.website_id == website_id,
        PageView.created_at >= since,
        PageView.traffic_label == "human",
    ).scalar() or 0

    pageviews_window = db.query(PageView).filter(
        PageView.website_id == website_id,
        PageView.created_at >= since,
        PageView.traffic_label == "human",
    ).count()

    raw_devices = (
        db.query(PageView.device, func.count(PageView.id))
        .filter(PageView.website_id == website_id, PageView.created_at >= since, PageView.traffic_label == "human")
        .group_by(PageView.device)
        .all()
    )
    devices = {"desktop": 0, "mobile": 0, "tablet": 0}
    for name, n in raw_devices:
        devices[_bucket_device(name)] += int(n or 0)

    top_pages = (
        db.query(PageView.path, func.count(func.distinct(PageView.visitor_id)).label("views"))
        .filter(PageView.website_id == website_id, PageView.created_at >= since, PageView.traffic_label == "human")
        .group_by(PageView.path)
        .order_by(func.count(func.distinct(PageView.visitor_id)).desc())
        .limit(12)
        .all()
    )

    sources = (
        db.query(
            func.coalesce(PageView.utm_source, "(direct)"),
            func.coalesce(PageView.utm_medium, "(none)"),
            func.count(func.distinct(PageView.visitor_id)),
        )
        .filter(PageView.website_id == website_id, PageView.created_at >= since, PageView.traffic_label == "human")
        .group_by(PageView.utm_source, PageView.utm_medium)
        .order_by(func.count(func.distinct(PageView.visitor_id)).desc())
        .limit(40)
        .all()
    )
    src_total = sum(n for *_, n in sources) or 1
    source_rows = [
        {"source": s, "medium": m, "users": n, "pct": round(n * 100 / src_total, 1)}
        for s, m, n in sources
    ]

    minute_series = []
    for i in range(30):
        a = now - timedelta(minutes=30 - i)
        b = a + timedelta(minutes=1)
        n = db.query(func.count(PageView.id)).filter(
            PageView.website_id == website_id,
            PageView.created_at >= a,
            PageView.created_at < b,
            PageView.traffic_label == "human",
        ).scalar() or 0
        minute_series.append(n)

    last_minute = []
    for i in range(12):
        a = now - timedelta(seconds=60 - i * 5)
        b = a + timedelta(seconds=5)
        n = db.query(func.count(PageView.id)).filter(
            PageView.website_id == website_id,
            PageView.created_at >= a,
            PageView.created_at < b,
            PageView.traffic_label == "human",
        ).scalar() or 0
        last_minute.append(n)

    recent = (
        db.query(PageView)
        .filter(PageView.website_id == website_id, PageView.created_at >= since30, PageView.traffic_label == "human")
        .order_by(PageView.created_at.desc())
        .limit(10)
        .all()
    )

    return {
        "live_visitors": live_visitors,
        "window_minutes": minutes,
        "pageviews_last_5min": pageviews_window,
        "devices": devices,
        "top_pages_live": [{"path": p, "views": v} for p, v in top_pages],
        "sources": source_rows,
        "minute_series": minute_series,
        "last_minute_series": last_minute,
        "recent_visitors": [
            {
                "path": r.path,
                "device": r.device,
                "country": r.country,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in recent
        ],
        "timestamp": now.isoformat(),
    }
