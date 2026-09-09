from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, cast, Date
from typing import Optional
from datetime import datetime, timedelta, date
import re

from app.database import get_db
from app.models import Website, PageView, User, Event
from app.schemas import TrackEvent, StatsOverview
from app.auth import get_current_user, user_can_access_website

router = APIRouter(prefix="/api/track", tags=["Tracking"])


def calculate_traffic_score(user_agent: Optional[str], path: str, referrer: Optional[str]) -> tuple:
    score = 1.0
    if not user_agent:
        return 0.1, "bot", True
    ua = user_agent.lower()
    bot_patterns = [
        r"bot", r"crawl", r"spider", r"slurp", r"facebookexternalhit",
        r"bingpreview", r"googlebot", r"yandex", r"baidu", r"duckduck",
        r"semrush", r"ahrefs", r"petalbot", r"bytespider",
    ]
    for p in bot_patterns:
        if re.search(p, ua):
            return 0.05, "bot", True
    if any(x in ua for x in ["headless", "phantomjs", "selenium", "puppeteer", "playwright"]):
        score -= 0.6
    if "mozilla" not in ua and "chrome" not in ua and "safari" not in ua:
        score -= 0.3
    score = max(0.0, min(1.0, score))
    if score >= 0.7:
        return score, "human", False
    if score >= 0.35:
        return score, "suspicious", False
    return score, "bot", True


def detect_device(user_agent: Optional[str]) -> str:
    if not user_agent:
        return "unknown"
    ua = user_agent.lower()
    if "mobile" in ua or "android" in ua or "iphone" in ua:
        return "mobile"
    if "tablet" in ua or "ipad" in ua:
        return "tablet"
    return "desktop"


def detect_browser(user_agent: Optional[str]) -> str:
    if not user_agent:
        return "unknown"
    ua = user_agent.lower()
    if "chrome" in ua and "edg" not in ua:
        return "Chrome"
    if "firefox" in ua:
        return "Firefox"
    if "safari" in ua and "chrome" not in ua:
        return "Safari"
    if "edg" in ua:
        return "Edge"
    return "Other"


@router.post("/{api_key}")
async def track_pageview(
    api_key: str,
    event: TrackEvent,
    request: Request,
    db: Session = Depends(get_db),
    user_agent: Optional[str] = Header(None),
):
    website = db.query(Website).filter(Website.api_key == api_key, Website.is_active == True).first()
    if not website:
        website = db.query(Website).filter(Website.public_key == api_key, Website.is_active == True).first()
    if not website:
        raise HTTPException(status_code=404, detail="Invalid API key")

    kind = (event.event_type or "pageview").lower()
    if kind == "heartbeat":
        db.add(Event(
            website_id=website.id,
            session_id=event.session_id,
            visitor_id=event.visitor_id or event.session_id,
            event_name="heartbeat",
            event_data={"path": event.path},
        ))
        db.commit()
        return {"status": "ok", "ignored": "heartbeat"}

    ua = user_agent or event.user_agent or ""
    score, label, is_bot = calculate_traffic_score(ua, event.path, event.referrer)

    pageview = PageView(
        website_id=website.id,
        path=(event.path or "/")[:512],
        title=(event.title or "")[:512] or None,
        referrer=event.referrer[:512] if event.referrer else None,
        user_agent=ua[:1000] if ua else None,
        ip_address=request.client.host if request.client else None,
        device=event.device or detect_device(ua),
        browser=detect_browser(ua),
        language=event.language,
        screen_width=event.screen_width,
        screen_height=event.screen_height,
        utm_source=event.utm_source,
        utm_medium=event.utm_medium,
        utm_campaign=event.utm_campaign,
        is_bot=is_bot,
        traffic_score=score,
        traffic_label=label,
        visitor_id=event.visitor_id or event.session_id,
        session_id=None,
    )
    db.add(pageview)
    db.commit()
    return {"status": "ok", "is_bot": is_bot, "traffic_score": score, "traffic_label": label}


@router.get("/stats/{website_id}", response_model=StatsOverview)
def get_stats(
    website_id: int,
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not user_can_access_website(db, current_user, website_id):
        raise HTTPException(status_code=404, detail="Website not found")
    website = db.query(Website).filter(Website.id == website_id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")

    since = datetime.utcnow() - timedelta(days=days)
    base = db.query(PageView).filter(PageView.website_id == website_id, PageView.created_at >= since)
    total = base.count()
    true_traffic = base.filter(PageView.traffic_label == "human").count()
    unique_sessions = (
        db.query(func.count(func.distinct(PageView.visitor_id)))
        .filter(PageView.website_id == website_id, PageView.created_at >= since, PageView.traffic_label == "human")
        .scalar()
        or 0
    )

    bounce = 0.0
    if unique_sessions:
        singles = (
            db.query(PageView.visitor_id)
            .filter(PageView.website_id == website_id, PageView.created_at >= since, PageView.traffic_label == "human")
            .group_by(PageView.visitor_id)
            .having(func.count(PageView.id) == 1)
            .count()
        )
        bounce = round((singles / unique_sessions) * 100, 1)

    top_pages = (
        db.query(PageView.path, func.count(PageView.id).label("views"))
        .filter(PageView.website_id == website_id, PageView.created_at >= since, PageView.traffic_label == "human")
        .group_by(PageView.path).order_by(desc("views")).limit(10).all()
    )
    top_referrers = (
        db.query(PageView.referrer, func.count(PageView.id).label("views"))
        .filter(PageView.website_id == website_id, PageView.created_at >= since, PageView.traffic_label == "human", PageView.referrer.isnot(None))
        .group_by(PageView.referrer).order_by(desc("views")).limit(10).all()
    )
    devices_q = (
        db.query(PageView.device, func.count(PageView.id))
        .filter(PageView.website_id == website_id, PageView.created_at >= since, PageView.traffic_label == "human")
        .group_by(PageView.device).all()
    )
    return StatsOverview(
        total_pageviews=total,
        unique_sessions=unique_sessions,
        true_traffic=true_traffic,
        bounce_rate=bounce,
        top_pages=[{"path": p, "views": v} for p, v in top_pages],
        top_referrers=[{"referrer": r or "Direct", "views": v} for r, v in top_referrers],
        devices={d or "unknown": c for d, c in devices_q},
        countries=[],
        humans=true_traffic,
        bots=base.filter(PageView.traffic_label == "bot").count(),
        suspicious=base.filter(PageView.traffic_label == "suspicious").count(),
    )


@router.get("/series/{website_id}")
def get_series(
    website_id: int,
    days: int = 14,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not user_can_access_website(db, current_user, website_id):
        raise HTTPException(status_code=404, detail="Website not found")
    days = max(1, min(days, 90))
    now = datetime.utcnow().date()
    start = now - timedelta(days=days - 1)
    prev_start = start - timedelta(days=days)

    rows = (
        db.query(cast(PageView.created_at, Date).label("d"), func.count(PageView.id))
        .filter(
            PageView.website_id == website_id,
            PageView.traffic_label == "human",
            PageView.created_at >= datetime.combine(prev_start, datetime.min.time()),
        )
        .group_by("d")
        .all()
    )
    by_day = {r[0]: r[1] for r in rows}

    def fill(from_day: date, n: int):
        out = []
        for i in range(n):
            day = from_day + timedelta(days=i)
            out.append(int(by_day.get(day, 0)))
        return out

    return {"current": fill(start, days), "previous": fill(prev_start, days), "days": days}
